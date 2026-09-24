import { mirrorDoc, CATEGORY, CATEGORY_LABEL, type MirrorDoc } from './schema';
import { resolveDoc, formatResolveIssues, type ResolveIssue } from './resolve';

/**
 * 读取 src/data/tools/ 下的所有 JSON，检查后按分类聚合。
 * 以下划线开头的文件（如 _template.json）是模板，不参与构建。
 *
 * 检查分两个阶段，但合并成一次报错：
 *   1. [字段] zod 校验。形状不对就没法往下替换，该文件跳过第二阶段。
 *   2. [模板] 占位符替换。见 src/data/resolve.ts。
 * 合并是因为两类错误往往同源（改字段时顺手打错占位符），
 * 分两次抛等于强制两轮往返。
 */
const modules = import.meta.glob(['./tools/*.json', '!./tools/_*.json'], {
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
        `\n请对照 src/data/tools/README.md 修正后重新构建。`,
    );
  }

  const ids = new Set<string>();
  const paths = new Map<string, string>();
  for (const d of docs) {
    if (ids.has(d.id)) {
      throw new Error(`工具 id 重复：${d.id}（检查 src/data/tools/ 下的文件名）`);
    }
    ids.add(d.id);

    // 页面地址必须唯一，否则两个工具会抢同一个输出文件、Astro 报路由冲突，
    // 或者（更糟）一个把另一个盖掉
    const clash = paths.get(d.path);
    if (clash !== undefined) {
      throw new Error(`页面地址重复：${d.path}（${clash} 与 ${d.id} 都在用它）`);
    }
    paths.set(d.path, d.id);
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
 * 索引页与侧边栏都用它，避免两处的排序逻辑将来各漂各的。空分类不出现。
 *
 * 只收「国内镜像源」板块（页面在 /mirrors/ 之下）的工具：写了自定义 path 的工具
 * （如公共 DNS）不属于这个目录，它的入口在首页与顶栏。
 */
export const sections = CATEGORY.map((key) => ({
  key,
  label: CATEGORY_LABEL[key],
  items: (byCategory.get(key) ?? []).filter((d) => d.path.startsWith('/mirrors/')),
})).filter((section) => section.items.length > 0);

/** 各板块的入口页，首页的 links 与顶栏导航都用它 */
export const boards = [
  { href: '/mirrors/', icon: '🪞', name: '国内镜像源', desc: '各语言、系统包管理器的国内镜像源，附可直接粘贴的配置命令。' },
  { href: '/dns/', icon: '🌐', name: '公共 DNS', desc: '国内外公共 DNS 解析服务：普通 / DoT / DoH 三种协议的地址。' },
] as const;

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
