import { defineConfig } from 'astro/config';

export default defineConfig({
  // 用户站点，部署在根路径；将来换自定义域名只改这里
  site: 'https://vansour.github.io',
  build: {
    // 静态输出，GitHub Pages 直接托管
    format: 'directory',
  },
});
