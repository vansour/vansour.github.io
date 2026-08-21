---
title: Node.js 26 上手笔记
description: 升级到 Node 26 后最值得注意的几个变化，以及一个踩过的坑。
pubDate: 2026-08-18
updatedDate: 2026-08-20
tags: [Node.js, 踩坑]
---

## 写在前面

项目默认锁 Node 26 之后，日常开发一直在它上面跑。这篇记录几个切身感受到的变化。

## TypeScript 直接跑

`node --experimental-strip-types` 在 26 里已经不是实验特性了，`.ts` 文件可以直接执行：

```bash
node ./scripts/hello.ts
```

类型擦除由 Node 自己完成，不需要编译步骤。对写脚本场景来说很舒服——不过项目代码我仍然用 Astro 自带流程，各有各的用武之地。

## 踩过的坑：锁文件与 npm

升级 Node 时最容易翻车的地方不是代码，而是工具链。换版本后务必重新安装一次依赖：

```bash
rm -rf node_modules package-lock.json
npm install
```

Node 26 带的 npm 11 对 lockfile 的处理更严格，旧 lockfile 在个别情况下会报 peer 冲突。删掉重来是最快的解。

## 性能

启动速度和模块加载都有可感知的提升。对一个 Vite 驱动的项目来说，`astro dev` 冷启动快了大约三成，体感明显。

## 小结

Node 26 的升级路径很平，除了清理一次 node_modules 之外没有遇到其他阻碍。工具链升级的通用建议：**先看 release notes，再删依赖重装，最后才查文档**——绝大多数问题都是前两步能解决的。
