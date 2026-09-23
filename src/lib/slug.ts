/**
 * 由站名派生稳定的锚点 slug，用于深链（`#<版本key>/<源slug>`）与命令块的 DOM id。
 *
 * 三级回退：
 *   1. 站名里的 ASCII 部分——「Debian 官方镜像」→ debian
 *   2. 主地址的域名标签——「清华大学开源软件镜像站」→ mirrors.tuna.tsinghua.edu.cn → tuna
 *   3. 序号 s0、s1……
 *
 * 第 2 级是必要的：站名改成正規中文全称后（「清华 TUNA」→「清华大学开源软件镜像站」）
 * 站名里一个 ASCII 都不剩，只靠第 1 级会让深链退化成 #13/s2 这种编号。
 * 域名标签是稳定的，展示名以后随便改，深链都不动。
 *
 * 不往数据里加字段——它是渲染期的推导物，不是数据。
 */

/** 非字母数字一律折成连字符，首尾去掉 */
const toSlug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** mirrors.tuna.tsinghua.edu.cn → tuna；mirror.xtom.de → xtom；deb.debian.org → deb */
function hostLabel(endpoint: string): string {
  try {
    const labels = new URL(endpoint).hostname.split('.');
    // 去掉常见的 mirrors. / mirror. 前缀，取剩下最左边那段
    const i = labels[0] === 'mirrors' || labels[0] === 'mirror' ? 1 : 0;
    return toSlug(labels[i] ?? '');
  } catch {
    return '';
  }
}

export function makeSlugs(items: { name: string; endpoint: string }[]): string[] {
  const used = new Set<string>();
  return items.map((item, i) => {
    const base = toSlug(item.name) || hostLabel(item.endpoint) || `s${i}`;
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    return slug;
  });
}
