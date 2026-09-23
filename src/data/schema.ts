import { z } from 'zod';

/**
 * 镜像源数据的结构定义。src/data/mirrors/*.json 里的每个文件都会被
 * src/data/index.ts 读取并按此校验；不符合的文件会让构建直接失败。
 *
 * 数据分两层：
 *   工具级 —— 命令的「模板」只写一次。variants 定义各变体，正文里用 {变量} 留空。
 *   源级   —— 每个源只填 vars（变量值）。命令由 src/data/resolve.ts 在构建时拼出。
 *
 * 命名规则：带 Input 后缀的是 JSON 里写的样子（zod 推断出的原始形状）；
 * 不带的（MirrorDoc / MirrorEntry）是 resolve.ts 处理完交给组件的形状，组件只认后者。
 */

export const STATUS = ['ok', 'degraded', 'dead'] as const;
export const CATEGORY = ['language', 'system', 'container', 'other'] as const;

/**
 * 变量名：小写字母开头，后接小写字母/数字/下划线。
 * 故意不允许大写——{URL} 这类拼错和正确写法几乎一样，靠命名规则先挡掉一批；
 * 真正的兜底是 resolve 阶段的残留检查。
 */
export const VAR_NAME = /^[a-z][a-z0-9_]*$/;
/** 变体 key：进 DOM id，也是源级 skip_variants 的引用目标 */
export const VARIANT_KEY = /^[a-z][a-z0-9-]*$/;
/** 由 resolve.ts 自动推导、不必也不该写进 vars 的变量（写进 vars 则视为显式覆盖） */
export const DERIVED_VARS = ['host'] as const;
/** 不能用作工具 id：/mirrors/index/ 会与索引页混淆 */
export const RESERVED_IDS = ['index'] as const;

const varName = z
  .string()
  .regex(VAR_NAME, '变量名只能用小写字母、数字、下划线，且以字母开头（如 url、deb、sec）');
const varValue = z.string().min(1, '变量值不能为空');

export const variant = z.object({
  /** 变体标识：决定 DOM id（复制按钮的锚点），也是源级 skip_variants 的引用目标。工具内唯一 */
  key: z
    .string()
    .regex(VARIANT_KEY, '变体 key 只能用小写字母、数字和连字符（如 sources、permanent）'),
  /** 语言标签，如 bash / ini / toml。展示在命令块左上角 */
  lang: z.string().min(1, '变体 lang 不能为空'),
  /** 展示标签，如「写入 deb822 源文件」「永久配置」。自由文案，可含 emoji 与文件名 */
  label: z.string().min(1, '变体 label 不能为空'),
  /**
   * 可直接粘贴的模板。`{变量名}` 由本工具各源的 vars 填；
   * `{host}` 由 endpoint_var 指向的主地址自动推导。
   * 要输出字面量花括号时写成 {{ 和 }}。
   */
  code: z.string().min(1, '变体 code 不能为空'),
  /** 只对该变体成立的一句话。工具级写一次，不随源重复 */
  note: z.string().optional(),
});

export const mirrorEntry = z.object({
  /** 镜像站名称，如「清华 TUNA」。同一工具下应唯一 */
  station: z.string().min(1),
  /**
   * 该源的变量表：键是本工具 variants 模板里用到的占位符名。
   * endpoint_var 指向的那个必填——页面展示的地址与 {host} 都由它推导。
   */
  vars: z.record(varName, varValue),
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
   * 只对该镜像源成立的提醒，如「会覆盖原文件」「商用需授权」。
   * 各源共同的注意事项请写到工具级 note，不要在这里逐条重复。
   */
  note: z.string().optional(),
  /**
   * 该源不适用的变体 key。只允许「少一块」，不允许改写正文——
   * 改写会让模板不再是唯一事实来源，也就失去了「同一变体在各源只差变量」
   * 这条可审计的性质。只在确实存在个别情况时才写。
   */
  skip_variants: z.array(z.string().regex(VARIANT_KEY)).optional(),
});

export const mirrorDoc = z
  .object({
    /** 工具标识，决定页面 URL（/mirrors/<id>/）与文件名。小写字母/数字/连字符 */
    id: z.string().regex(/^[a-z0-9-]+$/, 'id 只能用小写字母、数字和连字符'),
    /** 展示名称，如「PyPI / pip」 */
    name: z.string().min(1),
    category: z.enum(CATEGORY),
    /** 索引页卡片上的图标。单个 emoji，别用 ZWJ 组合序列（各平台渲染不一致） */
    icon: z.string().min(1).max(8),
    /** 一句话说明，索引页卡片与工具页标题下都用它 */
    tagline: z.string().min(1),
    /** 该配置会修改的文件，或「环境变量」。读者动手前应当能看到这个 */
    modified_file: z.string().min(1),
    /**
     * 工具级说明，适用于该工具的所有镜像源。
     * 各源完全相同的注意事项写这里；只对某个源成立的写该源的 note，
     * 否则一句相同的话会随源的个数重复十几遍。
     */
    note: z.string().optional(),
    /**
     * 哪个变量是这个工具的「主地址」：页面展示的 endpoint、以及 {host}，都由它推导。
     * 这样就不存在「展示地址与命令里的地址不一致」这一整类 bug。
     */
    endpoint_var: z.string().regex(VAR_NAME, 'endpoint_var 必须是一个变量名'),
    /**
     * 工具级变量默认值：每个源都自动带上，源级 vars 同名键可覆盖。
     * 用来表达「各源一致、只有个别源例外」的推导，如 Debian 的 sec = "{deb}-security"。
     */
    var_defaults: z.record(varName, varValue).optional(),
    /** 命令变体。数量随工具不同而不同：Debian 只有 1 种，pip 有 3 种 */
    variants: z.array(variant).min(1, '每个工具至少要有一个变体'),
    mirrors: z.array(mirrorEntry).min(1, '每个工具至少要有一个镜像源'),
  })
  .superRefine((doc, ctx) => {
    // 变体 key 唯一：进 DOM id，重复会让复制按钮指向错的那个块
    const seen = new Set<string>();
    doc.variants.forEach((v, i) => {
      if (seen.has(v.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants', i, 'key'],
          message: `变体 key 重复：${v.key}`,
        });
      }
      seen.add(v.key);
    });

    if ((RESERVED_IDS as readonly string[]).includes(doc.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['id'],
        message: `id 不能取「${doc.id}」，会和 /mirrors/ 索引页混淆`,
      });
    }

    if (doc.endpoint_var === 'host') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endpoint_var'],
        message: 'endpoint_var 不能是 host——host 是由它推导出来的',
      });
    }

    doc.mirrors.forEach((m, i) => {
      const raw = m.vars[doc.endpoint_var] ?? doc.var_defaults?.[doc.endpoint_var];

      // 主地址必须在每个源上都有值，否则展示地址与 {host} 都推不出来
      if (raw === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mirrors', i, 'vars'],
          message: `缺少 endpoint_var「${doc.endpoint_var}」：页面展示的地址和 {host} 都要从它推导`,
        });
      } else if (/[{}]/.test(raw)) {
        // 主地址必须是字面量：它是推导图的根，允许它引用别的变量会引入环与无法静态校验的地址
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mirrors', i, 'vars', doc.endpoint_var],
          message: `主地址必须写完整的字面 URL，不能用变量拼：${raw}`,
        });
      } else if (!/^https?:\/\/[^\s]+$/i.test(raw)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mirrors', i, 'vars', doc.endpoint_var],
          message: `主地址必须是完整的 http(s) URL，现在是「${raw}」`,
        });
      }

      // skip_variants 里不能有拼错的 key，否则会静默地什么都没跳过
      m.skip_variants?.forEach((k, j) => {
        if (!doc.variants.some((v) => v.key === k)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['mirrors', i, 'skip_variants', j],
            message: `skip_variants 里的「${k}」不是本工具定义的变体`,
          });
        }
      });

      // station 在同一工具下唯一
      const dup = doc.mirrors.findIndex((o) => o.station === m.station);
      if (dup !== -1 && dup < i) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mirrors', i, 'station'],
          message: `station 重复：${m.station}`,
        });
      }
    });
  });

export type Variant = z.infer<typeof variant>;
export type MirrorEntryInput = z.infer<typeof mirrorEntry>;
export type MirrorDocInput = z.infer<typeof mirrorDoc>;

/* ------------------------------------------------------------------ *
 * 解析后的形状：src/data/resolve.ts 的产物，组件只认这些
 * ------------------------------------------------------------------ */

/** 占位符已全部替换的变体 */
export interface ResolvedVariant {
  key: string;
  lang: string;
  label: string;
  note?: string;
  code: string;
}

/** endpoint 由 vars[endpoint_var] 推出；variants 是替换后的命令 */
export interface MirrorEntry extends Omit<MirrorEntryInput, 'vars' | 'skip_variants'> {
  endpoint: string;
  /** 解析后的变量值，含按需推导出的 host（模板用到才会出现在这里） */
  vars: Record<string, string>;
  variants: ResolvedVariant[];
}

export interface MirrorDoc extends Omit<MirrorDocInput, 'mirrors'> {
  mirrors: MirrorEntry[];
}

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
