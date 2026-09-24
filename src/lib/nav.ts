/**
 * 导航高亮判定。两种语义不要混用：
 *
 *   isExact   —— 只匹配本页。侧边栏用：工具页上，应该亮的是那个工具，
 *                不是它所属的分类或索引页。
 *   isSection —— 匹配本段及其子路径。顶栏用：「国内镜像源」在工具页也要亮着。
 *
 * 两者都按**路径分段**比，而不是 startsWith——否则 /mirrors-old/ 会被判成
 * 「国内镜像源」的当前页。
 *
 * 尾斜杠先归一化再比：build.format 是 directory，Astro.url.pathname 自带尾斜杠，
 * 而 href 写没写尾斜杠是手误高发处，少一个斜杠就「高亮静默不亮」。
 */

const norm = (p: string): string => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p);

export const isExact = (path: string, href: string): boolean => norm(path) === norm(href);

export const isSection = (path: string, href: string): boolean => {
  const p = norm(path);
  const h = norm(href);
  return h === '/' ? p === '/' : p === h || p.startsWith(`${h}/`);
};
