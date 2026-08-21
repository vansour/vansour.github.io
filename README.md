# Vansour 的博客

基于 [Astro](https://astro.build) 的个人技术博客，部署在 GitHub Pages（根路径）。

## 技术栈

- Astro（静态输出）+ GitHub Pages Actions 部署
- Content Collections 管理文章（zod 校验 frontmatter）
- Pagefind 站内搜索（构建时生成索引）
- Shiki 代码高亮（浅色 / 暗色双主题）
- RSS / Sitemap / 暗色模式，全站零框架运行时 JS

## 本地开发

```bash
nvm use          # Node 26（见 .nvmrc）
npm install
npm run dev      # 开发预览 http://localhost:4321
npm run build    # 构建 + 生成搜索索引
npm run preview  # 预览构建产物
```

## 写文章

1. 在 `src/content/blog/` 新建 Markdown 文件，frontmatter 字段：

   ```yaml
   ---
   title: 文章标题
   description: 摘要（列表页与 SEO 用）
   pubDate: 2026-08-21
   updatedDate: 2026-08-22   # 可选
   tags: [标签1, 标签2]        # 可选
   draft: false               # 可选，true 时生产构建剔除
   ---
   ```

2. `git push` 到 `main`，GitHub Actions 自动构建并部署。

## 部署说明

- 仓库需命名为 `vansour.github.io`，Pages 来源选 **GitHub Actions**
- 部署流程见 `.github/workflows/deploy.yml`
