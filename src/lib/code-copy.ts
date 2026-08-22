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
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** 从高亮后的代码块提取纯文本：逐行取 .line 文本再拼接（构建产物可能压缩换行）。 */
export function codeBlockText(pre: HTMLElement): string {
  const codeEl = pre.querySelector('code');
  const lines = codeEl ? [...codeEl.querySelectorAll('.line')].map((l) => l.textContent) : [];
  return lines.length ? lines.join('\n') : (codeEl?.textContent ?? '');
}
