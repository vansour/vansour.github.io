/**
 * 多变体代码框（code-tabs）构建期插件（Sätteri hast 插件格式，Astro 7）。
 *
 * 语法（```` ```code-tabs <lang> ```` 围栏）：
 *
 *   ```code-tabs bash
 *   版本: Debian13=trixie | Debian12=bookworm
 *   协议: http | https
 *   镜像: 官方=deb.debian.org | XTOM=mirrors.xtom.com | TUNA=mirrors.tuna.tsinghua.edu.cn
 *   ---
 *   URIs: {协议}://{镜像}/debian
 *   Suites: {版本} {版本}-updates
 *   ```
 *
 * - 头部每行一个选择维度：「维度名: 选项 | 选项」（选项可用 显示名=值 指定值）
 * - `---` 之后是代码模板，`{维度名}` 占位符在渲染时替换为选中值
 * - 构建期枚举全部组合并逐个 Shiki 高亮（浅/暗双主题，与全站一致），
 *   运行时 JS 只切换显示，默认展示第一个组合（无 JS 也可用）
 *
 * 使用前提（astro.config.mjs）：
 * - `syntaxHighlight: { excludeLangs: ['code-tabs'] }`，避免内置高亮器处理该围栏
 * - `processor: satteri({ hastPlugins: [codeTabs()] })`
 */

import { createHighlighter, type Highlighter } from 'shiki';

const MAX_COMBOS = 24;

let highlighterPromise: Promise<Highlighter> | null = null;
function getHighlighter(): Promise<Highlighter> {
  // 与 astro.config.mjs 的 shikiConfig 保持一致
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark-dimmed'],
  });
  return highlighterPromise;
}

interface Option {
  label: string;
  value: string;
}
interface Dimension {
  name: string;
  options: Option[];
}

/** 解析围栏内容为「维度列表 + 模板」；格式不符返回 null（保持原样输出并警告） */
function parseSpec(raw: string): { dims: Dimension[]; template: string } | null {
  const sepIdx = raw.indexOf('\n---\n');
  if (sepIdx === -1) return null;
  const header = raw.slice(0, sepIdx);
  const template = raw.slice(sepIdx + 5);
  const dims: Dimension[] = [];
  for (const line of header.split('\n')) {
    if (!line.trim()) continue;
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) return null;
    const options = m[2]
      .split('|')
      .map((s) => {
        const opt = s.trim();
        const eq = opt.indexOf('=');
        return eq === -1
          ? { label: opt, value: opt }
          : { label: opt.slice(0, eq).trim(), value: opt.slice(eq + 1).trim() };
      })
      .filter((o) => o.value.length > 0);
    if (options.length === 0) return null;
    dims.push({ name: m[1].trim(), options });
  }
  if (dims.length === 0) return null;
  return { dims, template };
}

/** 笛卡尔积枚举全部组合（每个维度取一个选项） */
function enumerate(dims: Dimension[]): Array<Record<string, string>> {
  let result: Array<Record<string, string>> = [{}];
  for (const dim of dims) {
    result = result.flatMap((combo) =>
      dim.options.map((opt) => ({ ...combo, [dim.name]: opt.value })),
    );
  }
  return result;
}

/** 模板占位符替换（split/join 避免正则转义问题；占位符名称勿与代码内 {xx} 冲突） */
function substitute(template: string, dims: Dimension[], combo: Record<string, string>): string {
  let code = template;
  for (const dim of dims) {
    code = code.split(`{${dim.name}}`).join(combo[dim.name]);
  }
  return code;
}

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

function h(
  tagName: string,
  properties: Record<string, unknown> = {},
  children: HastNode[] = [],
): HastNode {
  return { type: 'element', tagName, properties, children };
}

export default function codeTabs() {
  return {
    name: 'code-tabs',
    element: {
      filter: ['pre'],
      async visit(node: HastNode, ctx: { textContent(node: HastNode): string }) {
        const codeChild = node.children?.find(
          (c) => c.type === 'element' && c.tagName === 'code',
        );
        if (!codeChild) return;
        if (codeChild.data?.lang !== 'code-tabs') return;

        const spec = parseSpec(ctx.textContent(codeChild));
        if (!spec) {
          console.warn('[code-tabs] 解析失败：需要「维度: 选项 | 选项」头部与 --- 分隔行，保持原样输出');
          return;
        }

        const comboList = enumerate(spec.dims);
        if (comboList.length > MAX_COMBOS) {
          throw new Error(
            `[code-tabs] 组合数 ${comboList.length} 超过上限 ${MAX_COMBOS}，请精简选项`,
          );
        }

        // 模板语言：围栏 meta（如 ```code-tabs bash 中的 bash）；未知语言回退纯文本
        const meta = codeChild.data?.meta as string | undefined;
        const targetLang = meta || 'plaintext';
        const highlighter = await getHighlighter();
        let loaded = true;
        try {
          await highlighter.loadLanguage(targetLang);
        } catch {
          loaded = false;
        }
        const langName = loaded ? targetLang : 'plaintext';

        // 选择器行：每个维度一个下拉列表（默认选中第一项）
        const rows = spec.dims.map((dim) =>
          h('div', { className: ['ct-row'] }, [
            h('label', { className: ['ct-label'] }, [{ type: 'text', value: dim.name }]),
            h('select', { className: ['ct-select'], ariaLabel: dim.name }, [
              ...dim.options.map((opt, i) =>
                h(
                  'option',
                  { value: opt.value, selected: i === 0 },
                  [{ type: 'text', value: opt.label }],
                ),
              ),
            ]),
          ]),
        );

        // 全部组合的高亮变体；data-combo 为各维度取值按序拼接（值不含 |，见解析逻辑）
        const variants: HastNode[] = [];
        for (const combo of comboList) {
          const code = substitute(spec.template, spec.dims, combo);
          // shiki v4 的 codeToHast 返回 root > pre，取 pre 作为变体节点
          const tree = (await highlighter.codeToHast(code, {
            lang: langName,
            themes: { light: 'github-light', dark: 'github-dark-dimmed' },
            defaultColor: 'light',
          })) as HastNode;
          const pre = tree.type === 'root' && tree.children?.[0] ? tree.children[0] : tree;

          // 与 Astro 内置高亮输出对齐：astro-code 类 + data-language + 横向滚动
          const props = pre.properties ?? {};
          const cls = String(props.class ?? '').replace(/shiki/g, 'astro-code');
          props.class = `${cls} code-variant`;
          props.dataLanguage = langName;
          props.style = `${props.style ?? ''}; overflow-x: auto;`;
          props.dataCombo = comboList
            .length > 1
              ? spec.dims.map((d) => combo[d.name]).join('|')
              : '';
          variants.push(pre);
        }
        // 只显示第一个组合，其余 hidden（无 JS 时降级为默认组合）
        variants.forEach((v, i) => {
          if (i > 0) (v.properties ?? {}).hidden = true;
        });

        const childNodes: HastNode[] = [];
        // 多组合时渲染选择器行；单一组合无切换意义
        if (comboList.length > 1) {
          childNodes.push(h('div', { className: ['ct-selectors'] }, rows));
        }
        return h('div', { className: ['code-tabs'], dataLang: langName }, [
          ...childNodes,
          ...variants,
          h('button', { type: 'button', className: ['ct-copy'], ariaLabel: '复制代码' }, [
            { type: 'text', value: '复制' },
          ]),
        ]);
      },
    },
  };
}
