import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // 用户站点，部署在根路径；将来换自定义域名只改这里
  site: 'https://vansour.github.io',
  build: {
    // 静态输出，GitHub Pages 直接托管
    format: 'directory',
  },
  // Tailwind 4 是 Vite 插件（@astrojs/tailwind 是 v3 时代的 integration，不要装）。
  // 样式入口是 src/styles/global.css，无需 tailwind.config.js
  vite: { plugins: [tailwindcss()] },
});
