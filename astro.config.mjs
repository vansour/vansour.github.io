// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import codeTabs from './src/plugins/code-tabs.ts';

// https://astro.build/config
export default defineConfig({
  // 部署在 GitHub Pages + 自定义域名
  site: 'https://mhy.im',
  // 输出 .html 文件：链接为 /blog/debian13-scripts.html
  build: {
    format: 'file',
  },
  integrations: [
    sitemap({
      // format: 'file' 下路由 URL 不含 .html，统一补充（首页除外）
      serialize(item) {
        if (
          item.url !== 'https://mhy.im' &&
          item.url !== 'https://mhy.im/' &&
          !item.url.endsWith('.html')
        ) {
          item.url += '.html';
        }
        return item;
      },
    }),
  ],
  markdown: {
    // 保持 Astro 7 默认 Sätteri 处理器，并挂载多变体代码框插件
    processor: satteri({ hastPlugins: [codeTabs()] }),
    // code-tabs 围栏由插件自行高亮，排除在内置高亮器之外（避免未知语言警告）
    syntaxHighlight: { excludeLangs: ['code-tabs'] },
    // 代码高亮：浅色/暗色各一套主题，随页面主题切换
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
    },
  },
});
