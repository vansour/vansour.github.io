# 个人博客设计文档（Astro + GitHub Pages）

日期：2026-08-21
状态：已获用户确认；2026-08-24 同步实现状态（静态文件 URL、code-tabs、主题系统与 Pagefind）

## 背景与目标

用 Astro + GitHub Pages 从零手写一个个人博客，部署在 GitHub Pages 根路径，绑定自定义域名 `mhy.im`。

- **内容定位**：中文技术博客（技术笔记、踩坑经历、学习心得）
- **视觉风格**：现代极简风（无衬线、柔和配色、卡片列表、代码区随主题联动）
- **功能范围**：文章列表（首页分页）、全部文章页、关于页、RSS、站内搜索 + 暗色模式
- **明确不做**：评论系统、访问统计、MDX、多语言、博客管理后台、标签/归档（曾实现后移除）

## 方案决策

对比过三条路线后选用 **方案 A：纯静态 Markdown 博客**：

- 内容以纯 Markdown 存放，Content Collections 做 schema 校验，构建时生成全部页面
- 无框架运行时；主题、搜索、导航、代码复制和 code-tabs 使用少量原生 JS
- 内容可移植，升级 MDX 的路径平滑（`.md` → `.mdx` 即可）
- 被否方案：MDX 增强版（对纯文字+代码的博客过度）、无头 CMS 驱动（个人博客用 Git 发布已经是最好的流程）

## 1. 技术栈

| 依赖 | 用途 |
|---|---|
| `astro`（v7，需 Node 22.12+；本仓库用 Node 26） | 核心框架，静态输出 |
| `@astrojs/markdown-satteri` | Astro 7 Markdown 处理器与 HAST 插件挂载 |
| `@astrojs/rss` | RSS 订阅生成 |
| `@astrojs/sitemap` | sitemap.xml（SEO） |
| `pagefind` | 站内搜索索引（构建时生成，无后端） |
| `@astrojs/check` + TypeScript 6 | Astro/TypeScript 静态检查（使用与 `@astrojs/check` 兼容的最新 6.x） |
| CSS 变量 | 代码区颜色由 `--fg`/`--code-bg` 控制，随主题联动 |

不使用任何 UI 框架。代码高亮关闭，代码区由 CSS 变量控制；code-tabs 在构建期枚举组合，运行时只做选择、文本替换和复制。

## 2. 目录结构

```
├── astro.config.mjs        # site 配置 + sitemap 集成 + Sätteri/code-tabs
├── public/
│   ├── favicon.png         # 站点图标（PNG，含 apple-touch-icon.png）
│   ├── CNAME               # 自定义域名 mhy.im
│   ├── robots.txt          # 允许爬虫 + sitemap 指向
│   └── (构建产物 dist/ 另含 pagefind 索引)
└── src/
    ├── content.config.ts       # 文章 schema
    ├── content/blog/           # 写文章 = 放 .md 文件到这里
    ├── layouts/
    │   └── BaseLayout.astro    # HTML 骨架、SEO meta、防闪烁主题脚本
    ├── components/
    │   ├── Header.astro        # 导航栏 + 主题切换 + 搜索入口
    │   ├── Footer.astro
    │   ├── ThemeToggle.astro   # 明暗模式与强调色切换
    │   ├── SearchDialog.astro  # Pagefind 弹窗（Ctrl+K / `/` 唤起）
    │   ├── PostCard.astro      # 首页文章卡片
    │   ├── CopyCodeButton.astro# 普通代码块复制按钮
    │   └── CodeTabs.astro      # 多变体代码框交互
    ├── lib/
    │   └── posts.ts            # 取已发布文章 + order 排序
    ├── pages/
    │   ├── [...page].astro     # 首页：文章卡片分页（每页 10 篇）
    │   ├── posts.astro         # 全部文章列表
    │   ├── blog/[slug].astro   # 文章详情（getStaticPaths）
    │   ├── about.astro         # 关于页
    │   ├── rss.xml.ts          # RSS
    │   └── 404.astro           # 带搜索引导的 404
    └── styles/
        └── global.css          # 设计令牌 + 排版 + 暗色主题
```

## 3. 内容模型

`src/content.config.ts`，使用 Content Collections + zod schema：

```ts
schema: z.object({
  title: z.string(),                        // 标题
  description: z.string(),                  // 摘要（列表页 + SEO）
  order: z.number().optional(),             // 排序：越小越靠前；不写则排在最后
  draft: z.boolean().default(false),        // 草稿：开发可见、构建剔除
})
```

- slug = 文件名（`hello-astro.md` → `/blog/hello-astro`）
- 排序：有 `order` 的按升序靠前，无 `order` 的排在最后（保持加载顺序）；首页分页每页 10 篇
- 草稿过滤：开发环境显示，生产构建剔除（`import.meta.env.PROD` 判断）

## 4. 页面行为

- **首页**：文章卡片列表（标题、摘要）+ 分页器
- **全部文章页**：`/posts`，全量文章列表
- **文章页**：标题和 Markdown 正文
- **关于页**：静态内容，个人介绍
- **RSS**：`@astrojs/rss`，输出全部已发布文章
- **404**：带搜索引导，避免死胡同

## 5. 设计系统

### 设计令牌（CSS 变量，组件不出现硬编码颜色）

```css
:root[data-theme="light"] {
  --bg: #ffffff;          --fg: #1a1a1a;
  --muted: #6b7280;       --accent: #2563eb;   /* 强调蓝 */
  --surface: #f5f5f5;     --border: #e5e7eb;
}
:root[data-theme="dark"] {
  --bg: #0f1115;          --fg: #e5e7eb;
  --muted: #9ca3af;       --accent: #60a5fa;
  --surface: #1a1d24;     --border: #2a2e37;
}
```

### 暗色模式三态逻辑（原生 JS，约 15 行）

1. 首次访问：跟随系统 `prefers-color-scheme`
2. 手动切换：写入 `localStorage` 覆盖系统设置
3. 防闪烁：`<head>` 内联同步脚本，首帧渲染前读取偏好

### 字体

- 正文：自托管 MiSans，回退到系统中文无衬线字体
- 代码：`SimSun`/`宋体`，回退到系统等宽字体

### 排版基调

正文约 17px、行高 1.75、段落间距宽松；标题粗字重区分层级；卡片列表克制无装饰；强调色仅用于链接与当前导航。

## 6. 站内搜索（Pagefind）

- 构建后运行 `pagefind --site dist` 生成静态索引
- `Ctrl+K` / `/` 快捷键或导航栏搜索图标唤起弹窗
- 结果高亮匹配片段（`meta.title` 为标题，excerpt 自带 `<mark>` 标签），点击直达文章
- 404 页面不参与索引，避免错误页出现在搜索结果中
- 新文章构建时自动进索引，无需配置

## 7. 发布流程（GitHub Actions）

`.github/workflows/deploy.yml`：

```yaml
on:
  push: { branches: [main] }
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    steps:
      - checkout + setup-node(26) + npm ci
      - npm run build          # 含 Pagefind 索引
      - upload-pages-artifact
      - deploy-pages
```

配套配置：

- `astro.config.mjs`：`site: 'https://mhy.im'`（根路径，不需要 base）
- 仓库 Settings → Pages → Source 选 **GitHub Actions**
- `public/CNAME` 声明自定义域名，另需在域名服务商配置 DNS（A 记录指向 GitHub Pages IP，可选 CNAME `www`），随后在 Pages 设置中填自定义域名并启用 HTTPS
- 仓库名为 `<username>.github.io`（此处 `vansour.github.io`）

## 8. 明确不做（YAGNI）

- 评论系统、访问统计（用户已排除）
- MDX、多语言、图片 CDN——需要时再引入，升级路径平滑
- 博客管理后台——Git 提交即发布
- 标签/归档页、文章日期展示——首版实现后于简化重构中移除（内容模型保留 `order` 排序）

## 工作流程（写文章）

1. 新建 `src/content/blog/xxx.md`，填写 frontmatter（`title`、`description`，可选 `order` / `draft`）+ 正文
2. 本地 `npm run dev` 预览
3. `git push` → Actions 自动构建部署

## 9. 本地验证

- `npm run check`：Astro/TypeScript 检查
- `npm run build`：生产页面、RSS、sitemap 和 Pagefind 索引
- `npm run preview`：预览 `dist` 构建产物
