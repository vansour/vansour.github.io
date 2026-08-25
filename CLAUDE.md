# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

vansour 的中文个人技术博客（服务器运维与开发笔记），Astro 静态站，部署在 GitHub Pages 根路径，自定义域名 `mhy.im`。使用原生 JavaScript 和 CSS，不使用 React/Vue/Svelte 等 UI 框架。

## 常用命令

```bash
nvm use                # Node 26（.nvmrc / package.json engines）
npm install
npm run dev            # 开发预览 http://localhost:4321
npm run check          # Astro / TypeScript 静态检查
npm run build          # 构建 + Pagefind 搜索索引（完整构建链）
npm run preview        # 预览 dist 构建产物
```

## 构建链与部署

- 构建链：清理 `.astro` 缓存 → `astro build` → `pagefind --site dist`。
- `astro.config.mjs` 使用 `build.format: 'file'`，产物页面为 `.html` 文件；文章永久链接 `/blog/<slug>.html`。
- 站点为根路径部署（无 base 路径）；RSS、卡片、全部文章页和搜索结果必须指向同一套文章 URL；顶层页面、分页、canonical、RSS、sitemap 的 URL 需在生产构建后检查，不能只看开发服务器。
- 部署流程见 `.github/workflows/deploy.yml`（GitHub Actions：npm ci → npm run build → upload dist → deploy-pages）。默认不主动 commit / push。

## 技术栈与架构

- Astro 7 静态输出 + Content Collections（zod 校验 frontmatter）+ Sätteri Markdown 处理器。
- `src/lib/posts.ts` 的 `getPublishedPosts()` 是唯一的文章过滤/排序入口：`order` 升序靠前、无 `order` 排最后；生产构建剔除 `draft`。列表、分页、详情、RSS 必须复用它。
- `code-tabs`（`src/plugins/code-tabs.ts`）是构建期 HAST 插件：```` ```code-tabs <lang> ```` 围栏 + 维度头部 + `---` 分隔 + `{维度名}` 占位符。下拉维度 `名: 选项 | 选项`，输入维度 `名: 输入 默认值`；构建期笛卡尔积枚举全部组合（上限 24，超限构建失败），运行时只切换/替换/复制。需要验证：下拉维度、输入维度、复制按钮、无 JS 降级、长代码横向滚动。
- Astro 语法高亮已关闭（`syntaxHighlight: false`），代码变体是纯文本 DOM，不得假定存在 Shiki 的 `.line` 节点。
- 主题系统：`data-theme`（light/dark）+ `data-accent`（8 色），BaseLayout 内联防闪烁脚本读取 localStorage 优先于系统偏好；颜色必须使用 `global.css` 的设计令牌（`--bg/--fg/--muted/--accent/--surface/--border/--code-bg/--overlay`），组件不出现硬编码颜色。
- 站内搜索：Pagefind 懒加载（构建时生成索引，`import('/pagefind/pagefind.js')`），`data-pagefind-body` 只索引正文区域；导航、页脚、404 页不得成为搜索结果。
- 组件职责边界：BaseLayout（骨架/head/防闪烁）、Header（导航/搜索/主题入口/移动菜单）、SearchDialog（Pagefind 弹窗）、ThemeToggle（theme/accent 读写）、CopyCodeButton（普通代码块复制，不处理 `.code-tabs` 变体）、CodeTabs（多变体交互）、PostCard（纯展示）。不要把业务逻辑散落到页面。
- 字体：MiSans 自托管分片（Regular/Semibold/Bold，字重映射 330/520/630），代码字体 SimSun/宋体 兜底；`public/CNAME`、`robots.txt`、图标属发布契约，不得随意移除或改名。

## 文章写作

- 文章位于 `src/content/blog/`，frontmatter 契约定义在 `src/content.config.ts`：`title`、`description` 必填；`order` 可选（越小越靠前）；`draft` 可选（生产剔除）。
- 保持标题、摘要、文件名和链接语义一致；对破坏性命令、root 权限、远程脚本、清盘等行为保留清晰警告；不擅自改变外部命令的参数、版本、来源或执行顺序。
- 代码块必须在生产构建产物中检查换行、转义、滚动和复制文本。

## 开发规约

- Node.js 必须使用 26；包管理器是 npm，依赖变更必须同时审阅 `package.json` 和 `package-lock.json`。
- 依赖声明遵循"最新稳定版本"政策，但不得在无关任务中升级依赖；升级必须说明原因、兼容性、锁文件变化、回滚方案并运行完整生产构建。
- `@astrojs/markdown-satteri` 由 Astro 依赖链提供，升级 Astro 前必须确认其 API 兼容。
- 优先复用现有组件、CSS 变量、断点和命名；视觉改动要同时检查文章页、首页、关于页、404 页和移动断点（≤480px / ≤640px / 641–1024px / >1024px）。
- 交互控件必须有语义元素、可见焦点、合适的 `aria-*` 状态和键盘操作；页面无客户端路由框架，脚本必须在完整页面加载和无脚本降级下都不破坏正文。
- 用户输入替换必须使用文本节点或安全的 DOM API，不得拼接成可执行 HTML。
- 涉及 `.astro`、`.ts` 或客户端脚本时运行 `npm run check`；涉及页面、内容、路由或构建期插件时至少运行 `npm run build`，并检查 `dist` 中实际 HTML、链接、canonical、RSS、sitemap 和 Pagefind 结果。
- 不自动 commit / push；提交信息简洁、描述实际变更，不含代理工具署名。
