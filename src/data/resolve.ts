import type {
  MirrorDoc,
  MirrorDocInput,
  MirrorEntry,
  MirrorEntryInput,
  ResolvedVariant,
} from './schema';
import { DERIVED_VARS } from './schema';

/**
 * 把工具级模板里的 {占位符} 用各镜像源的变量替换掉。
 *
 * 核心是「单趟分词替换」：先把模板切成 字面量 | 占位符 两种片段再拼接。
 * 替换值只被拼进结果，永不再被扫描。这一点同时解决三件事：
 *   - 变量值里含 { 或 } 时不会被误当成占位符（扫输出的话必然误报）
 *   - 残留检测是精确的，不依赖正则去猜
 *   - 能报出具体是哪个占位符、在第几行
 *
 * 模板语法三条（见 src/data/mirrors/README.md）：
 *   {name}    占位符，name 匹配 ^[a-z][a-z0-9_]*$，值从变量表取
 *   {{ }}     转义，输出字面量的花括号
 *   其它 { }  报错，不静默放过
 */

const NAME_RE = /^[a-z][a-z0-9_]*$/;

export interface BadBrace {
  raw: string;
  line: number;
  lineText: string;
}

type Piece = { kind: 'text'; value: string } | { kind: 'var'; name: string; index: number };

/** 由字符下标反查行号与该行原文，报错时直接贴出来 */
function at(src: string, index: number): { line: number; lineText: string } {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < index && i < src.length; i++) {
    if (src.charCodeAt(i) === 10) {
      line++;
      lineStart = i + 1;
    }
  }
  let end = src.indexOf('\n', index);
  if (end === -1) end = src.length;
  let lineText = src.slice(lineStart, end);
  if (lineText.length > 100) lineText = `${lineText.slice(0, 100)}…`;
  return { line, lineText };
}

/** 切成字面量与占位符。切完再拼，绝不对拼好的结果二次扫描。 */
function scan(src: string): { pieces: Piece[]; bad: BadBrace[] } {
  const pieces: Piece[] = [];
  const bad: BadBrace[] = [];
  let text = '';
  let i = 0;

  const flush = () => {
    if (text) {
      pieces.push({ kind: 'text', value: text });
      text = '';
    }
  };

  while (i < src.length) {
    const ch = src[i];

    if (ch === '{') {
      if (src[i + 1] === '{') {
        text += '{';
        i += 2;
        continue;
      }
      const end = src.indexOf('}', i + 1);
      const name = end === -1 ? '' : src.slice(i + 1, end);
      if (end !== -1 && NAME_RE.test(name)) {
        flush();
        pieces.push({ kind: 'var', name, index: i });
        i = end + 1;
        continue;
      }
      // {URL}、{ url }、${url} 都落到这里——它们几乎都是拼错的占位符
      bad.push({ raw: end === -1 ? src.slice(i, i + 12) : src.slice(i, end + 1), ...at(src, i) });
      text += ch;
      i += 1;
      continue;
    }

    if (ch === '}') {
      if (src[i + 1] === '}') {
        text += '}';
        i += 2;
        continue;
      }
      bad.push({ raw: '}', ...at(src, i) });
      text += ch;
      i += 1;
      continue;
    }

    text += ch;
    i += 1;
  }

  flush();
  return { pieces, bad };
}

export interface MissingVar {
  name: string;
  line: number;
  lineText: string;
}

interface Rendered {
  text: string;
  missing: MissingVar[];
  bad: BadBrace[];
}

/**
 * 单趟替换。lookup 返回 undefined 表示该变量没有值 → 记进 missing，输出里原样保留该占位符，
 * 报错时能与现场对照。
 */
function render(src: string, lookup: (name: string) => string | undefined): Rendered {
  const { pieces, bad } = scan(src);
  const missing = new Map<string, MissingVar>();
  let text = '';

  for (const p of pieces) {
    if (p.kind === 'text') {
      text += p.value;
      continue;
    }
    const value = lookup(p.name);
    if (value === undefined) {
      if (!missing.has(p.name)) missing.set(p.name, { name: p.name, ...at(src, p.index) });
      text += `{${p.name}}`;
      continue;
    }
    text += value;
  }

  return { text, missing: [...missing.values()], bad };
}

export type IssueKind =
  | 'missing-var'
  | 'bad-brace'
  | 'unknown-ref'
  | 'cycle'
  | 'endpoint'
  | 'all-skipped';

export interface ResolveIssue {
  file: string;
  docId: string;
  station: string;
  /** 该工具一共有多少源——用于判断「所有源都缺这个变量」这类模板级问题 */
  mirrorTotal: number;
  variantKey?: string;
  variantLabel?: string;
  kind: IssueKind;
  detail: string;
  hint?: string;
  line?: number;
  lineText?: string;
}

interface IssueCtx {
  push(i: Omit<ResolveIssue, 'file' | 'docId' | 'station' | 'mirrorTotal'>): void;
}

interface Scope {
  values: Map<string, string>;
  endpoint: string;
  /**
   * 变量求值入口。模板替换必须用它，不能用 values.get——
   * values 只由 lookup 惰性填充（在 buildScope 里只有 endpoint_var 会被查到），
   * 直接读 values 会让 var_defaults 与源级 vars 里其余变量全部落空。
   */
  lookup: (name: string) => string | undefined;
}

function buildScope(tool: MirrorDocInput, mirror: MirrorEntryInput, ctx: IssueCtx): Scope {
  // 工具级默认值先铺底，源级 vars 同名覆盖
  const raw = new Map<string, string>();
  for (const [k, v] of Object.entries(tool.var_defaults ?? {})) raw.set(k, v);
  for (const [k, v] of Object.entries(mirror.vars)) raw.set(k, v);

  const values = new Map<string, string>();
  const stack: string[] = [];

  const lookup = (name: string): string | undefined => {
    const memo = values.get(name);
    if (memo !== undefined) return memo;

    if (stack.includes(name)) {
      ctx.push({ kind: 'cycle', detail: `变量循环引用：${[...stack, name].join(' → ')}` });
      values.set(name, '');
      return '';
    }

    const tpl = raw.get(name);
    const isDerived = tpl === undefined && (DERIVED_VARS as readonly string[]).includes(name);
    if (tpl === undefined && !isDerived) return undefined; // 未定义 → 交给 render 记 missing

    stack.push(name);
    let text = '';

    if (tpl !== undefined) {
      const r = render(tpl, lookup);
      for (const m of r.missing) {
        ctx.push({
          kind: 'unknown-ref',
          detail: `变量「${name}」引用了不存在的变量 {${m.name}}`,
          line: m.line,
          lineText: m.lineText,
        });
      }
      for (const b of r.bad) {
        ctx.push({
          kind: 'bad-brace',
          detail: `变量「${name}」的值里出现无法识别的花括号 ${b.raw}`,
          line: b.line,
          lineText: b.lineText,
          hint: '占位符要写成 {小写名}；要输出字面量花括号请写成 {{ 和 }}',
        });
      }
      text = r.text;
    } else {
      // {host}：从 endpoint_var 指向的主地址推导
      // 例：https://mirrors.ustc.edu.cn/debian → mirrors.ustc.edu.cn
      const endpoint = lookup(tool.endpoint_var) ?? '';
      try {
        text = new URL(endpoint).host; // .host 不含路径；带端口时含端口
      } catch {
        ctx.push({
          kind: 'endpoint',
          detail: `主地址不是合法 URL，推不出 {host}：${endpoint || '(空)'}`,
          hint: `检查该源 vars.${tool.endpoint_var}`,
        });
        text = '';
      }
    }

    stack.pop();
    values.set(name, text);
    return text;
  };

  const endpoint = lookup(tool.endpoint_var) ?? '';
  return { values, endpoint, lookup };
}

export interface ResolvedMirrorResult {
  endpoint: string;
  vars: Record<string, string>;
  variants: ResolvedVariant[];
  issues: ResolveIssue[];
}

/**
 * 把一个工具在某镜像源上的所有变体拼出来。
 * 纯函数：只读入参、不抛异常、不改入参；问题以 issues 返回，由调用方决定怎么报。
 */
export function resolveVariants(
  tool: MirrorDocInput,
  mirror: MirrorEntryInput,
  file = '(未知文件)',
): ResolvedMirrorResult {
  const issues: ResolveIssue[] = [];
  const base = { file, docId: tool.id, station: mirror.station, mirrorTotal: tool.mirrors.length };
  const ctx: IssueCtx = { push: (i) => issues.push({ ...base, ...i }) };

  const { values, endpoint, lookup } = buildScope(tool, mirror, ctx);
  const skip = new Set(mirror.skip_variants ?? []);
  const variants: ResolvedVariant[] = [];

  for (const v of tool.variants) {
    if (skip.has(v.key)) continue;

    const r = render(v.code, lookup);

    for (const m of r.missing) {
      ctx.push({
        variantKey: v.key,
        variantLabel: v.label,
        kind: 'missing-var',
        detail: `占位符 {${m.name}} 没有值`,
        line: m.line,
        lineText: m.lineText,
        hint: `在本源 vars 里补上 ${m.name}；各源一致的变量请写进工具级 var_defaults`,
      });
    }
    for (const b of r.bad) {
      ctx.push({
        variantKey: v.key,
        variantLabel: v.label,
        kind: 'bad-brace',
        detail: `无法识别的花括号 ${b.raw}`,
        line: b.line,
        lineText: b.lineText,
        hint: '占位符要写成 {小写名}（如 {url}）；要输出字面量花括号请写成 {{ 和 }}',
      });
    }

    variants.push({ key: v.key, lang: v.lang, label: v.label, note: v.note, code: r.text });
  }

  if (variants.length === 0) {
    ctx.push({ kind: 'all-skipped', detail: 'skip_variants 把这个工具的所有变体都跳过了' });
  }

  return { endpoint, vars: Object.fromEntries(values), variants, issues };
}

/** 整份文档：逐源解析，汇总 issues */
export function resolveDoc(
  input: MirrorDocInput,
  file: string,
): { doc: MirrorDoc; issues: ResolveIssue[] } {
  const issues: ResolveIssue[] = [];
  const mirrors: MirrorEntry[] = input.mirrors.map((m) => {
    const r = resolveVariants(input, m, file);
    issues.push(...r.issues);
    const { vars: _vars, skip_variants: _skip, ...rest } = m;
    return { ...rest, endpoint: r.endpoint, vars: r.vars, variants: r.variants };
  });
  return { doc: { ...input, mirrors }, issues };
}

/* ==================================================================== *
 * 报错格式化
 * ==================================================================== */

/** 一行里最多列几个源名 */
const STATION_SAMPLE = 5;

/**
 * 模板只有一份，一个占位符写错会同时命中十几个源。
 * 所以按 (kind, 变体, 详情, 行号) 分组，把受影响的源折叠成一行，否则报错会刷屏。
 */
export function formatResolveIssues(issues: ResolveIssue[]): string[] {
  const byFile = new Map<string, ResolveIssue[]>();
  for (const i of issues) {
    const list = byFile.get(i.file);
    if (list) list.push(i);
    else byFile.set(i.file, [i]);
  }

  const blocks: string[] = [];
  for (const [file, list] of byFile) {
    const out: string[] = [`  ${file}`];

    const groups = new Map<string, ResolveIssue[]>();
    for (const i of list) {
      const key = `${i.kind}|${i.variantKey ?? ''}|${i.detail}|${i.line ?? ''}`;
      const g = groups.get(key);
      if (g) g.push(i);
      else groups.set(key, [i]);
    }

    for (const g of groups.values()) {
      const f = g[0];
      const where = f.variantLabel ? `变体「${f.variantLabel}」· ` : '';
      out.push(`    [模板] ${where}${f.detail}`);
      if (f.line) out.push(`      第 ${f.line} 行  ${f.lineText}`);

      const names = g.map((i) => i.station);
      const shown = names.slice(0, STATION_SAMPLE);
      out.push(
        names.length === 1
          ? `      源：${shown[0]}`
          : `      涉及 ${names.length} 个源：${shown.join('、')}${names.length > shown.length ? ' 等' : ''}`,
      );

      // 命中全部源 = 模板问题；只命中个别源 = 数据问题。两者的修法完全不同
      if (f.kind === 'missing-var' && g.length >= f.mirrorTotal) {
        out.push(
          '      提示：该工具的每个源都缺这个变量，多半是模板里的占位符写错了；' +
            '各源一致的变量请写进工具级 var_defaults',
        );
      } else if (f.hint) {
        out.push(`      提示：${f.hint}`);
      }
    }

    blocks.push(out.join('\n'));
  }
  return blocks;
}
