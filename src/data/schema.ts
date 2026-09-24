import { z } from 'zod';

/**
 * 镜像源数据的结构定义。src/data/mirrors/*.json 里的每个文件都会被
 * src/data/index.ts 读取并按此校验；不符合的文件会让构建直接失败。
 *
 * 数据分三层：
 *   工具级 —— 命令的「模板」只写一次。variants 定义各变体，正文里用 {变量} 留空。
 *   版本级 —— 同一工具的不同发行版，只填随版本变的变量（如 Debian 的套件名 suite）。
 *   源级   —— 每个源只填 vars（变量值）。命令由 src/data/resolve.ts 在构建时拼出。
 *
 * 命令的最终形态是「版本 × 源」的组合：模板一份，两边各填一部分变量。
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
/**
 * 版本 key。故意不含连字符和点——它同时是深链 `#<版本key>/<源slug>` 的第一段
 * 和命令块 DOM id 的一段，若允许连字符，「a-b」+「c」与「a」+「b-c」会拼出同一个 id。
 */
export const VERSION_KEY = /^[a-z0-9]+$/;
/**
 * 源的归属分组，决定来源下拉里的 optgroup。
 * global 是给 DNS 这类「服务本身就是源」的工具用的：Cloudflare 与 Google 的
 * 公共解析没有国内镜像可言，它们就是各自服务的官方入口。镜像类工具仍然不收国外源。
 */
export const REGION = ['official', 'cn', 'global'] as const;
/** 由 resolve.ts 自动推导、不必也不该写进 vars 的变量（写进 vars 则视为显式覆盖） */
export const DERIVED_VARS = ['host'] as const;
/** 不能用作工具 id：/mirrors/index/ 会与索引页混淆 */
export const RESERVED_IDS = ['index'] as const;

/** 必填且不能为空的字段共用这条消息，报错里字段名由 zod 的 path 带出来 */
const NOT_EMPTY = '不能为空';
const VAR_NAME_MSG = '变量名只能用小写字母、数字、下划线，且以字母开头（如 url、deb、sec）';

const varName = z.string().regex(VAR_NAME, VAR_NAME_MSG);
const varValue = z.string().min(1, '变量值不能为空');
/**
 * 变量表，三处共用（工具级 var_defaults / 版本 vars / 源 vars）。
 * 第三个参数是给「键名不合法」用的消息：zod 4 起 key schema 自己的消息不会
 * 出现在报错里（只会说一句 Invalid key in record），必须在 record 上再给一次；
 * 它不影响值的报错，值仍走 varValue 的消息。
 */
const varTable = z.record(varName, varValue, VAR_NAME_MSG);

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

/**
 * 同一工具的一个发行版本。命令里凡随版本变化的地方（Debian 的套件名、
 * Ubuntu 的代号）都写成 {变量} 由这里填，模板因此仍然只有一份。
 * 各源共用同一批 mirrors——「同一个源的 12 与 13」不需要各写一条。
 */
export const version = z.object({
  /** 版本标识：进深链与 DOM id，工具内唯一 */
  key: z.string().regex(VERSION_KEY, '版本 key 只能用小写字母和数字（如 13、12、2604）'),
  /** 展示名，如「13 (trixie)」。版本下拉里显示的就是它 */
  label: z.string().min(1, '版本 label 不能为空（如「13 (trixie)」）'),
  /** 该版本独有的变量，覆盖工具级 var_defaults；源级 vars 又可覆盖它 */
  vars: varTable.optional(),
});

export const mirrorEntry = z.object({
  /** 镜像站名称，如「清华 TUNA」。同一工具下应唯一 */
  station: z.string().min(1, NOT_EMPTY),
  /**
   * 归属分组，决定来源下拉里的 optgroup。缺省 cn。
   * 本站收录范围是官方源 + 国内源，所以要显式标注的只有官方源。
   */
  region: z
    .enum(REGION, {
      error: (i) => `分组只能是 ${REGION.join(' / ')}，现在是「${i.input}」`,
    })
    .default('cn'),
  /**
   * 该源的变量表：键是本工具 variants 模板里用到的占位符名。
   * endpoint_var 指向的那个必填——页面展示的地址与 {host} 都由它推导。
   */
  vars: varTable,
  /** 官方帮助页。必须是能打开的 URL，便于读者自行核对 */
  doc: z.url('doc 必须是能打开的完整 URL').optional(),
  /**
   * ok       正常可用
   * degraded 可用但有坑或有使用限制（如条款限制、仅部分同步）
   * dead     已停止服务，保留用于让读者认出自己 dotfiles 里的过期配置
   */
  status: z.enum(STATUS, {
    error: (i) => `状态只能是 ${STATUS.join(' / ')}，现在是「${i.input}」`,
  }),
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
    name: z.string().min(1, NOT_EMPTY),
    category: z.enum(CATEGORY, {
      error: (i) => `分类只能是 ${CATEGORY.join(' / ')}，现在是「${i.input}」`,
    }),
    /** 索引页卡片上的图标。单个 emoji，别用 ZWJ 组合序列（各平台渲染不一致） */
    icon: z.string().min(1, NOT_EMPTY).max(8, '图标最多 8 个字符，一个 emoji 就够'),
    /** 一句话说明，索引页卡片与工具页标题下都用它 */
    tagline: z.string().min(1, NOT_EMPTY),
    /** 该配置会修改的文件，或「环境变量」。读者动手前应当能看到这个 */
    modified_file: z.string().min(1, NOT_EMPTY),
    /**
     * 工具级说明，适用于该工具的所有镜像源。
     * 各源完全相同的注意事项写这里；只对某个源成立的写该源的 note，
     * 否则一句相同的话会随源的个数重复十几遍。
     */
    note: z.string().optional(),
    /**
     * 哪个变量是这个工具的「主地址」：endpoint 与 {host} 都由它推导，
     * 这样就不存在「展示地址与命令里的地址不一致」这一整类 bug。
     *
     * **没有单一主地址的工具可以省略**（如公共 DNS：每个协议一个地址，
     * 普通 DNS 还是裸 IP，过不了下面那条「必须是 http(s) 字面 URL」的校验）。
     * 省略后不能用 {host}——那会报明确的错，不是静默失效。
     */
    endpoint_var: z.string().regex(VAR_NAME, 'endpoint_var 必须是一个变量名').optional(),
    /**
     * 工具级变量默认值：每个源都自动带上，源级 vars 同名键可覆盖。
     * 用来表达「各源一致、只有个别源例外」的推导，如 Debian 的 sec = "{deb}-security"。
     */
    var_defaults: varTable.optional(),
    /**
     * 该工具的发行版本，按展示顺序排列（新版本在前，第一项即默认）。
     * 不写表示该工具没有版本之分（如 pip），页面就不出版本下拉。
     */
    versions: z.array(version).min(1, 'versions 至少要写一个版本，不写则整项省略').optional(),
    /** 命令变体。数量随工具不同而不同：Debian、Ubuntu 各 1 种，pip 也是 1 种 */
    variants: z.array(variant).min(1, '每个工具至少要有一个变体'),
    mirrors: z.array(mirrorEntry).min(1, '每个工具至少要有一个镜像源'),
  })
  .superRefine((doc, ctx) => {
    // 变体 key 唯一：进 DOM id，重复会让复制按钮指向错的那个块
    const seen = new Set<string>();
    doc.variants.forEach((v, i) => {
      if (seen.has(v.key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['variants', i, 'key'],
          message: `变体 key 重复：${v.key}`,
        });
      }
      seen.add(v.key);
    });

    if ((RESERVED_IDS as readonly string[]).includes(doc.id)) {
      ctx.addIssue({
        code: 'custom',
        path: ['id'],
        message: `id 不能取「${doc.id}」，会和 /mirrors/ 索引页混淆`,
      });
    }

    if (doc.endpoint_var === 'host') {
      ctx.addIssue({
        code: 'custom',
        path: ['endpoint_var'],
        message: 'endpoint_var 不能是 host——host 是由它推导出来的',
      });
    }

    const versions = doc.versions ?? [];

    // 版本 key 唯一：它进深链与 DOM id，重复会让两块命令互相顶掉
    const seenVersionKeys = new Set<string>();
    versions.forEach((v, i) => {
      if (seenVersionKeys.has(v.key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['versions', i, 'key'],
          message: `版本 key 重复：${v.key}`,
        });
      }
      seenVersionKeys.add(v.key);
    });

    // 主地址必须是字面 URL：它是推导图的根（{host} 由它而来），
    // 允许它引用别的变量会引入环与无法静态校验的地址
    const checkEndpoint = (raw: string, path: (string | number)[], prefix: string): void => {
      if (/[{}]/.test(raw)) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `${prefix}必须写完整的字面 URL，不能用变量拼：${raw}`,
        });
      } else if (!/^https?:\/\/[^\s]+$/i.test(raw)) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `${prefix}必须是完整的 http(s) URL，现在是「${raw}」`,
        });
      }
    };

    doc.mirrors.forEach((m, i) => {
      // 没有 endpoint_var 的工具（公共 DNS 那类）没有主地址可查，整段跳过
      const endpointVar = doc.endpoint_var;

      if (endpointVar) {
        const raw = m.vars[endpointVar] ?? doc.var_defaults?.[endpointVar];

        // 主地址必须在每个源上都有值，否则 {host} 推不出来
        if (raw === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['mirrors', i, 'vars'],
            message: `缺少 endpoint_var「${endpointVar}」：{host} 要从它推导`,
          });
        } else {
          checkEndpoint(raw, ['mirrors', i, 'vars', endpointVar], '主地址');
        }

        // 版本级也能覆盖 endpoint_var，覆盖了就同样要是字面 URL
        versions.forEach((v, vi) => {
          const over = v.vars?.[endpointVar];
          if (over !== undefined) {
            checkEndpoint(over, ['versions', vi, 'vars', endpointVar], `版本「${v.label}」的主地址`);
          }
        });
      }

      // skip_variants 里不能有拼错的 key，否则会静默地什么都没跳过
      m.skip_variants?.forEach((k, j) => {
        if (!doc.variants.some((v) => v.key === k)) {
          ctx.addIssue({
            code: 'custom',
            path: ['mirrors', i, 'skip_variants', j],
            message: `skip_variants 里的「${k}」不是本工具定义的变体`,
          });
        }
      });

      // station 在同一工具下唯一
      const dup = doc.mirrors.findIndex((o) => o.station === m.station);
      if (dup !== -1 && dup < i) {
        ctx.addIssue({
          code: 'custom',
          path: ['mirrors', i, 'station'],
          message: `station 重复：${m.station}`,
        });
      }
    });
  });

export type Variant = z.infer<typeof variant>;
export type VersionInput = z.infer<typeof version>;
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

/** 版本：只留展示需要的，vars 已经并进各自的 VersionedVariants */
export interface ResolvedVersion {
  key: string;
  label: string;
}

/** 一个源在某个版本下的全部产物 */
export interface VersionedVariants {
  versionKey: string;
  /** 由该版本作用域里的 vars[endpoint_var] 推出 */
  endpoint: string;
  /** 解析后的变量值，含按需推导出的 host（模板用到才会出现在这里） */
  vars: Record<string, string>;
  variants: ResolvedVariant[];
}

/**
 * 一个镜像源。命令随版本不同而不同（Debian 的套件名），
 * 所以替换结果按版本各存一套，与 MirrorDoc.versions 同序等长。
 */
export interface MirrorEntry extends Omit<MirrorEntryInput, 'vars' | 'skip_variants'> {
  perVersion: VersionedVariants[];
}

export interface MirrorDoc extends Omit<MirrorDocInput, 'mirrors' | 'versions'> {
  /** 没有 versions 的工具在这里补成单项（key 与 label 都是空串），组件不必再判空 */
  versions: ResolvedVersion[];
  mirrors: MirrorEntry[];
}

export const REGION_LABEL: Record<(typeof REGION)[number], string> = {
  official: '官方',
  cn: '国内',
  global: '国外',
};

export const CATEGORY_LABEL: Record<(typeof CATEGORY)[number], string> = {
  language: '语言生态',
  system: '系统包管理',
  container: '容器',
  other: '其他',
};
