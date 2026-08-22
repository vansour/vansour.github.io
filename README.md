# Vansour Blog

基于 [Astro](https://astro.build) 的个人技术博客，部署在 GitHub Pages（根路径）。

## 技术栈

- Astro（静态输出）+ GitHub Pages Actions 部署
- Content Collections 管理文章（zod 校验 frontmatter）
- Pagefind 站内搜索（构建时生成索引）
- 代码区颜色由 CSS 变量控制，随站点明暗/主题联动
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
   order: 1                  # 可选，越小越靠前；不写则排在最后
   draft: false               # 可选，true 时生产构建剔除
   ---
   ```

2. `git push` 到 `main`，GitHub Actions 自动构建并部署。

## 部署说明

- Pages 来源选 **GitHub Actions**（部署流程见 `.github/workflows/deploy.yml`）
- 自定义域名 `mhy.im`：仓库已含 `public/CNAME`，另需在域名服务商配置 DNS：

  ```
  A       mhy.im      185.199.108.153
  A       mhy.im      185.199.109.153
  A       mhy.im      185.199.110.153
  A       mhy.im      185.199.111.153
  （可选）CNAME  www    → vansour.github.io
  ```

  DNS 生效后在 GitHub 仓库 Settings → Pages → Custom domain 填 `mhy.im` 并勾选 Enforce HTTPS。
