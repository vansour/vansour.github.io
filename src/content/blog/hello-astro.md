---
title: 你好，Astro
description: 用 Astro + GitHub Pages 从零搭一个个人博客，记录踩坑与心得。这是第一篇。
pubDate: 2026-08-15
tags: [Astro, 博客, 前端]
---

## 为什么是 Astro

个人博客的内容形态很固定：一堆 Markdown 文件 + 列表页 + 详情页。它不需要交互，只需要快。

Astro 的核心理念——「默认零 JS」——正好命中这个场景：构建时把所有内容渲染成静态 HTML，页面在浏览器里没有任何框架运行时。

对比过的方案：

- **Next.js / Nuxt**：为应用而生，对纯内容站点是杀鸡用牛刀
- **Hexo / Hugo**：生态成熟，但自定义主题要写模板语言
- **Astro**：用组件语法写页面，Markdown 即内容，升级 MDX 平滑

## 内容即文件

在 Astro 里写文章，就是往 `src/content/blog/` 放一个 Markdown 文件：

```md
---
title: 你好，Astro
description: 文章摘要
pubDate: 2026-08-15
tags: [Astro]
---

正文...
```

配合 Content Collections，每篇文章的 frontmatter 都会经过 schema 校验，写错字段构建时直接报错，比「发布后才发现」好太多。

## 静态站点的代价与回报

代价：没有运行时，意味着没有动态内容。个人博客根本不需要——文章发布前是静态的，发布后还是静态的。

回报：部署简单（一个 `dist/` 目录），托管便宜（GitHub Pages 免费），速度快到没有「优化」可做。

写这篇的时候，全站唯一的 JavaScript 是暗色切换和搜索弹窗。就这样，够了。
