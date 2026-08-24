/** 复制文本到剪贴板（Clipboard API 优先，非安全上下文 http 用 execCommand 兜底）。
 *  返回是否成功。被 CopyCodeButton 与 CodeTabs 的复制按钮共用。 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 继续走兜底
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    // Clipboard API 不可用时保留 http 本地预览的兼容路径。
    const execCommand = Reflect.get(document, 'execCommand') as
      | ((command: string) => boolean)
      | undefined;
    const ok = execCommand?.call(document, 'copy') ?? false;
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** 从代码块提取纯文本：优先逐行取 .line（兼容旧高亮输出），否则用 code 的 textContent。 */
export function codeBlockText(pre: HTMLElement): string {
  const codeEl = pre.querySelector('code');
  const lines = codeEl ? [...codeEl.querySelectorAll('.line')].map((l) => l.textContent) : [];
  return lines.length ? lines.join('\n') : (codeEl?.textContent ?? '');
}
