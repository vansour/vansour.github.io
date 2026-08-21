# 个人博客设计文档（Astro + GitHub Pages）

日期：2026-08-21
状态：已获用户确认

## 背景与目标

用 Astro + GitHub Pages 从零手写一个个人博客，部署在 GitHub Pages 根路径（`https://<username>.github.io`）。

- **内容定位**：中文技术博客（技术笔记、踩坑经历、学习心得）
- **视觉风格**：现代极简风（无衬线、柔和配色、卡片列表、精致代码高亮）
- **功能范围**：基础标配（文章列表、标签/分类、归档页、关于页、RSS、代码高亮）+ 站内搜索 + 暗色模式
- **明确不做**：评论系统、访问统计、MDX、多语言、博客管理后台

## 方案决策

对比过三条路线后选用 **方案 A：纯静态 Markdown 博客**：

- 内容以纯 Markdown 存放，Content Collections 做 schema 校验，构建时生成全部页面
- 零运行时 JS（默认），性能最佳
- 内容可移植，升级 MDX 的路径平滑（`.md` → `.mdx` 即可）
- 被否方案：MDX 增强版（对纯文字+代码的博客过度）、无头 CMS 驱动（个人博客用 Git 发布已经是最好的流程）

## 1. 技术栈

| 依赖 | 用途 |
|---|---|
| `astro`（v6，需 Node 22.12+） | 核心框架，静态输出 |
| `@astrojs/rss` | RSS 订阅生成 |
| `@astrojs/sitemap` | sitemap.xml（SEO） |
| `pagefind` | 站内搜索索引（构建时生成，无后端） |
| Shiki | 代码高亮（Astro 内置，构建时渲染） |

不使用任何 UI 框架。全站唯一的运行时 JS：暗色切换与搜索弹窗（原生 JS）。

## 2. 目录结构

```
├── astro.config.mjs        # site 配置 + sitemap 集成
├── public/
│   ├── favicon.svg
│   └── robots.txt
└── src/
    ├── content/
    │   ├── config.ts       # 文章 schema
    │   └── blog/           # 写文章 = 放 .md 文件到这里
    ├── layouts/
    │   └── BaseLayout.astro    # HTML 骨架、SEO meta、header/footer
    ├── components/
    │   ├── Header.astro        # 导航栏 + 主题切换 + 搜索入口
    │   ├── Footer.astro
    │   ├── ThemeToggle.astro   # 唯一 JS 岛
    │   ├── SearchDialog.astro  # Pagefind 弹窗（Ctrl+K 唤起）
    │   ├── PostCard.astro      # 首页文章卡片
    │   └── TagChip.astro
    ├── pages/
    │   ├── index.astro         # 首页：最新文章分页
    │   ├── blog/[slug].astro   # 文章详情（getStaticPaths）
    │   ├── tags/index.astro    # 标签总览
    │   ├── tags/[tag].astro    # 单标签文章列表
    │   ├── archives.astro      # 按年月归档
    │   ├── about.astro         # 关于页
    │   ├── rss.xml.ts          # RSS
    │   └── 404.astro           # 带搜索引导的 404
    └── styles/
        └── global.css          # 设计令牌 + 排版 + 暗色主题
```

## 3. 内容模型

`src/content/config.ts`，使用 Content Collections + zod schema：

```ts
schema: z.object({
  title: z.string(),                        // 标题
  description: z.string(),                  // 摘要（列表页 + SEO）
  pubDate: z.coerce.date(),                 // 发布日期
  updatedDate: z.coerce.date().optional(),  // 更新日期（可选）
  tags: z.array(z.string()).default([]),    // 标签
  draft: z.boolean().default(false),        // 草稿：开发可见、构建剔除
})
```

- slug = 文件名（`hello-astro.md` → `/blog/hello-astro`）
- 文章按 `pubDate` 降序；首页分页，每页 10 篇
- 草稿过滤：开发环境显示，生产构建剔除（`import.meta.env.PROD` 判断）

## 4. 页面行为

- **首页**：文章卡片列表（标题、摘要、日期、标签）+ 分页器
- **文章页**：标题、日期、标签、正文、上一篇/下一篇导航
- **标签总览 / 单标签列表**：标签聚合浏览
- **归档页**：按「2026 年 8 月」分组
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

- 正文：`system-ui, -apple-system, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif`
- 代码：`ui-monospace, "JetBrains Mono", "Cascadia Code", monospace`

### 排版基调

正文约 17px、行高 1.75、段落间距宽松；标题粗字重区分层级；卡片列表克制无装饰；强调色仅用于链接、标签、当前导航。

## 6. 站内搜索（Pagefind）

- 构建后运行 `pagefind --site dist` 生成静态索引
- `Ctrl+K` / `/` 快捷键或导航栏搜索图标唤起弹窗
- 结果高亮匹配片段，点击直达文章
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
      - checkout + setup-node(22) + npm ci
      - npm run build          # 含 Pagefind 索引
      - upload-pages-artifact
      - deploy-pages
```

配套配置：

- `astro.config.mjs`：`site: 'https://<username>.github.io'`（根路径，不需要 base）
- 仓库 Settings → Pages → Source 选 **GitHub Actions**
- 仓库名必须是 `<username>.github.io`

## 8. 明确不做（YAGNI）

- 评论系统、访问统计（用户已排除）
- MDX、多语言、图片 CDN——需要时再引入，升级路径平滑
- 博客管理后台——Git 提交即发布

## 工作流程（写文章）

1. 新建 `src/content/blog/xxx.md`，填写 frontmatter + 正文
2. 本地 `npm run dev` 预览
3. `git push` → Actions 自动构建部署
