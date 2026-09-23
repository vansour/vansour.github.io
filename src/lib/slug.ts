/**
 * 由站名派生稳定的锚点 slug，用于 chip 与面板的 DOM id 及 #hash 深链。
 * 取站名里的 ASCII 部分（「清华 TUNA」→ tuna），没有 ASCII 的（「阿里云」）
 * 退回序号。不往数据里加字段——它是渲染期的推导物，不是数据。
 */
export function makeSlugs(stations: string[]): string[] {
  const used = new Set<string>();
  return stations.map((station, i) => {
    const base =
      station
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `s${i}`;
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    return slug;
  });
}
