import { mirrorDoc, type MirrorDoc } from './schema';

/**
 * 读取 src/data/mirrors/ 下的所有 JSON，逐个校验后按分类聚合。
 * 以下划线开头的文件（如 _template.json）是模板，不参与构建。
 */
const modules = import.meta.glob(['./mirrors/*.json', '!./mirrors/_*.json'], {
  eager: true,
}) as Record<string, { default: unknown }>;

function load(): MirrorDoc[] {
  const errors: string[] = [];
  const docs: MirrorDoc[] = [];

  for (const [path, mod] of Object.entries(modules)) {
    const parsed = mirrorDoc.safeParse(mod.default);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `    ${i.path.join('.') || '(根)'}: ${i.message}`)
        .join('\n');
      errors.push(`  ${path}\n${detail}`);
      continue;
    }
    docs.push(parsed.data);
  }

  if (errors.length > 0) {
    throw new Error(
      `镜像源数据校验失败，共 ${errors.length} 个文件：\n${errors.join('\n')}\n` +
        `\n请对照 src/data/mirrors/README.md 修正后重新构建。`,
    );
  }

  const ids = new Set<string>();
  for (const d of docs) {
    if (ids.has(d.id)) {
      throw new Error(`镜像源 id 重复：${d.id}（检查 src/data/mirrors/ 下的文件名）`);
    }
    ids.add(d.id);
  }

  return docs.sort((a, b) => a.id.localeCompare(b.id));
}

export const docs: MirrorDoc[] = load();

export const byCategory = (() => {
  const groups = new Map<MirrorDoc['category'], MirrorDoc[]>();
  for (const d of docs) {
    const list = groups.get(d.category) ?? [];
    list.push(d);
    groups.set(d.category, list);
  }
  return groups;
})();

/** 全站最近一次核实日期，用于页面顶部展示数据新鲜度 */
export const latestVerified: string | null = docs
  .flatMap((d) => d.mirrors.map((m) => m.verified_at))
  .sort()
  .at(-1) ?? null;

export { CATEGORY_LABEL, STATUS_LABEL } from './schema';
export type { MirrorDoc, MirrorEntry } from './schema';
