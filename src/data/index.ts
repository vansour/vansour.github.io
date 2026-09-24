import { mirrorDoc, CATEGORY, CATEGORY_LABEL, type MirrorDoc } from './schema';
import { resolveDoc, formatResolveIssues, type ResolveIssue } from './resolve';

/**
 * 读取 src/data/mirrors/ 下的所有 JSON，检查后按分类聚合。
 * 以下划线开头的文件（如 _template.json）是模板，不参与构建。
 *
 * 检查分两个阶段，但合并成一次报错：
 *   1. [字段] zod 校验。形状不对就没法往下替换，该文件跳过第二阶段。
 *   2. [模板] 占位符替换。见 src/data/resolve.ts。
 * 合并是因为两类错误往往同源（改字段时顺手打错占位符），
 * 分两次抛等于强制两轮往返。
 */
const modules = import.meta.glob(['./mirrors/*.json', '!./mirrors/_*.json'], {
  eager: true,
}) as Record<string, { default: unknown }>;

function load(): MirrorDoc[] {
  const shapeBlocks: { file: string; text: string }[] = [];
  const tplIssues: ResolveIssue[] = [];
  const docs: MirrorDoc[] = [];

  // 按路径排序，报错顺序稳定（glob 的键序不保证）
  const entries = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b));

  for (const [path, mod] of entries) {
    const parsed = mirrorDoc.safeParse(mod.default);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `    [字段] ${i.path.join('.') || '(根)'}: ${i.message}`)
        .join('\n');
      shapeBlocks.push({ file: path, text: `  ${path}\n${detail}` });
      continue; // 形状不对就没法替换
    }
    const { doc, issues } = resolveDoc(parsed.data, path);
    tplIssues.push(...issues);
    docs.push(doc);
  }

  const blocks = [...shapeBlocks.map((b) => b.text), ...formatResolveIssues(tplIssues)];
  if (blocks.length > 0) {
    const files = new Set([
      ...shapeBlocks.map((b) => b.file),
      ...tplIssues.map((i) => i.file),
    ]);
    throw new Error(
      `镜像源数据检查未通过，共 ${files.size} 个文件：\n${blocks.join('\n')}\n` +
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

/**
 * 按分类切的「分类 → 工具」两级结构，**顺序由 CATEGORY 定义**。
 * 索引页与侧边栏都用它，避免两处的排序逻辑将来各漂各的。
 * 空分类不出现。
 */
export const sections = CATEGORY.map((key) => ({
  key,
  label: CATEGORY_LABEL[key],
  items: byCategory.get(key) ?? [],
})).filter((section) => section.items.length > 0);

/** 全站最近一次核实日期，用于索引页与工具页展示数据新鲜度 */
export const latestVerified: string | null =
  docs.flatMap((d) => d.mirrors.map((m) => m.verified_at)).sort().at(-1) ?? null;

export { CATEGORY_LABEL, REGION_LABEL } from './schema';
export type {
  MirrorDoc,
  MirrorEntry,
  ResolvedVersion,
  ResolvedVariant,
  VersionedVariants,
} from './schema';
