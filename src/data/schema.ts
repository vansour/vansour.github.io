import { z } from 'zod';

/**
 * 镜像源数据的结构定义。src/data/mirrors/*.json 里的每个文件都会被
 * src/data/index.ts 读取并按此校验；不符合的文件会让构建直接失败。
 */

export const STATUS = ['ok', 'degraded', 'dead'] as const;
export const CATEGORY = ['language', 'system', 'container', 'other'] as const;

export const mirrorEntry = z.object({
  /** 镜像站名称，如「清华 TUNA」。同一工具下应唯一 */
  station: z.string().min(1),
  /** 实际镜像地址。用于展示和比对，不是给人直接粘的 */
  endpoint: z.string().min(1),
  /** 官方帮助页。必须是能打开的 URL，便于读者自行核对 */
  doc: z.string().url().optional(),
  /**
   * ok       正常可用
   * degraded 可用但有坑或有使用限制（如条款限制、仅部分同步）
   * dead     已停止服务，保留用于让读者认出自己 dotfiles 里的过期配置
   */
  status: z.enum(STATUS),
  /** 最后人工核实日期，YYYY-MM-DD。必须填，这是本项目的可信度来源 */
  verified_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'verified_at 必须是 YYYY-MM-DD 格式'),
  /**
   * 可直接粘贴到终端的完整命令或配置片段。
   * 多行用 \n 分隔——注意 JSON 里要写成转义后的字面量。
   * 务必照抄官方文档，不要自己改写语法。
   */
  snippet: z.string().min(1),
  /**
   * 只对该镜像源成立的提醒，如「会覆盖原文件」「商用需授权」。
   * 各源共同的注意事项请写到工具级 note，不要在这里逐条重复。
   */
  note: z.string().optional(),
});

export const mirrorDoc = z.object({
  /** 工具标识，决定页面锚点和文件名。小写字母，如 pip / npm / debian */
  id: z.string().regex(/^[a-z0-9-]+$/, 'id 只能用小写字母、数字和连字符'),
  /** 展示名称，如「PyPI / pip」 */
  name: z.string().min(1),
  category: z.enum(CATEGORY),
  /** 该配置会修改的文件，或「环境变量」。读者动手前应当能看到这个 */
  modified_file: z.string().min(1),
  /**
   * 工具级说明，适用于该工具的所有镜像源。
   * 各源完全相同的注意事项写这里；只对某个源成立的写该源的 note，
   * 否则一句相同的话会随源的个数重复十几遍。
   */
  note: z.string().optional(),
  mirrors: z.array(mirrorEntry).min(1, '每个工具至少要有一个镜像源'),
});

export type MirrorEntry = z.infer<typeof mirrorEntry>;
export type MirrorDoc = z.infer<typeof mirrorDoc>;

export const CATEGORY_LABEL: Record<(typeof CATEGORY)[number], string> = {
  language: '语言生态',
  system: '系统包管理',
  container: '容器',
  other: '其他',
};

export const STATUS_LABEL: Record<(typeof STATUS)[number], string> = {
  ok: '可用',
  degraded: '有限制',
  dead: '已停用',
};
