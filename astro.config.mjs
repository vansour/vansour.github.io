// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // 部署在 GitHub Pages + 自定义域名
  site: 'https://mhy.im',
  integrations: [sitemap()],
  markdown: {
    // 代码高亮：浅色/暗色各一套主题，随页面主题切换
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
    },
  },
});
