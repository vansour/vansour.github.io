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
 * - 头部每行一个维度：「维度名: 选项 | 选项」为下拉（选项可用 显示名=值 指定值）；
 *   「维度名: 输入 默认值」为输入框（自由文本，运行时由用户输入动态生成代码）
 * - `---` 之后是代码模板，`{维度名}` 占位符在渲染时替换为选中/输入值
 * - 构建期枚举全部组合并逐个渲染为纯文本变体（颜色由 CSS 变量控制、随主题联动），
 *   运行时 JS 只切换显示，默认展示第一个组合（无 JS 也可用）
 * - 语法约束：选项分隔符为 `|`，`显示名=值` 中的 `=` 只取**首个**（值内可含 `=`，
 *   如 `镜像=官方=https://deb.debian.org/debian`）；选项值（`=` 后部分）**不得包含
 *   `|`**——它同时是运行时组合匹配的分隔符，含 `|` 会使变体匹配错乱（构建期会报错）
 *
 * 使用前提（astro.config.mjs）：`processor: satteri({ hastPlugins: [codeTabs()] })`，
 * 并关闭高亮（syntaxHighlight: false），与全站「代码随主题」保持一致。
 */

import type { Element, ElementContent, Properties, Text } from 'hast';

const MAX_COMBOS = 24;

interface Option {
  label: string;
  value: string;
}
type Dimension = { name: string; input: string } | { name: string; options: Option[] };

/** 输入框维度：`名称: 输入 默认值`（自由文本，运行时替换模板占位符） */
const INPUT_KEYWORDS = ['输入', 'input'];

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
    const name = m[1].trim();
    const body = m[2].trim();
    // 输入框维度：`名称: 输入 默认值`
    const inputMatch = body.match(new RegExp(`^(?:${INPUT_KEYWORDS.join('|')})(?:\\s+|=)(.+)$`));
    if (inputMatch) {
      const def = inputMatch[1].trim();
      if (!def) return null;
      dims.push({ name, input: def });
      continue;
    }
    const options = body
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
    // 选项值含 | 会与运行时组合分隔符冲突，构建期直接报错而非静默生成错乱变体
    if (options.some((o) => o.value.includes('|'))) {
      throw new Error(
        `[code-tabs] 维度「${name}」的选项值包含保留字符 |（值内不允许出现 |，它是选项与组合的分隔符）`,
      );
    }
    dims.push({ name, options });
  }
  if (dims.length === 0) return null;
  return { dims, template };
}

/** 笛卡尔积枚举全部组合（每个维度取一个选项；输入框维度取默认值） */
function enumerate(dims: Dimension[]): Array<Record<string, string>> {
  let result: Array<Record<string, string>> = [{}];
  for (const dim of dims) {
    const opts: Option[] = 'input' in dim ? [{ label: dim.input, value: dim.input }] : dim.options;
    result = result.flatMap((combo) =>
      opts.map((opt) => ({ ...combo, [dim.name]: opt.value })),
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

function h(
  tagName: string,
  properties: Properties = {},
  children: ElementContent[] = [],
): Element {
  return { type: 'element', tagName, properties, children };
}

function text(value: string): Text {
  return { type: 'text', value };
}

function dataValue(node: Readonly<Element>, key: string): string | undefined {
  const value = (node.data as Record<string, unknown> | undefined)?.[key];
  return typeof value === 'string' ? value : undefined;
}

interface CodeTabsContext {
  textContent(node: Readonly<Element>): string;
}

export default function codeTabs() {
  return {
    name: 'code-tabs',
    element: {
      filter: ['pre'],
      visit(node: Readonly<Element>, ctx: CodeTabsContext) {
        const codeChild = node.children?.find(
          (child): child is Element => child.type === 'element' && child.tagName === 'code',
        );
        if (!codeChild) return;
        if (dataValue(codeChild, 'lang') !== 'code-tabs') return;

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

        // 模板语言（围栏 meta，如 ```code-tabs bash 中的 bash）仅用于标注 data-language
        const meta = dataValue(codeChild, 'meta');

        // 选择器行：下拉维度 + 输入框维度（data-default 供运行时按默认值做文本替换）
        const rows = spec.dims.map((dim) =>
          h('div', { className: ['ct-row'] }, [
            h('label', { className: ['ct-label'] }, [text(dim.name)]),
            'input' in dim
              ? h('input', {
                  type: 'text',
                  className: ['ct-input'],
                  value: dim.input,
                  dataDefault: dim.input,
                  ariaLabel: dim.name,
                })
              : h('select', { className: ['ct-select'], ariaLabel: dim.name }, [
                  ...dim.options.map((opt, i) =>
                    h(
                      'option',
                      { value: opt.value, selected: i === 0 },
                      [text(opt.label)],
                    ),
                  ),
                ]),
          ]),
        );

        // 全部组合的纯文本变体；data-combo 只编码下拉维度。
        // 输入维度只有一个构建期默认值，由运行时直接替换文本，不应参与组合匹配。
        const selectDims = spec.dims.filter((dim) => 'options' in dim);
        const variants: Element[] = [];
        for (const combo of comboList) {
          const code = substitute(spec.template, spec.dims, combo);
          const comboKey = selectDims.map((dim) => combo[dim.name]).join('|');
          variants.push(
            h(
              'pre',
              {
                className: ['code-variant'],
                style: 'overflow-x: auto;',
                dataLanguage: meta ?? '',
                dataCombo: comboKey,
              },
              [h('code', {}, [text(code)])],
            ),
          );
        }
        // 只显示第一个组合，其余 hidden（无 JS 时降级为默认组合）
        variants.forEach((v, i) => {
          if (i > 0) (v.properties ?? {}).hidden = true;
        });

        const childNodes: ElementContent[] = [];
        // 多组合或有输入框维度时渲染控制栏（输入框需常驻）
        if (comboList.length > 1 || spec.dims.some((d) => 'input' in d)) {
          childNodes.push(h('div', { className: ['ct-selectors'] }, rows));
        }
        return h('div', { className: ['code-tabs'], dataLang: meta ?? '' }, [
          ...childNodes,
          ...variants,
          h('button', { type: 'button', className: ['ct-copy'], ariaLabel: '复制代码' }, [
            text('复制'),
          ]),
        ]);
      },
    },
  };
}
