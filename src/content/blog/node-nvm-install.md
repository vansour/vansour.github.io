---
title: Node.js 安装
description: 用 nvm 安装与切换 Node.js 版本，LTS / 22 / 24 / 26 一键切换。
order: 4
---

> 以下命令均需 **root** 权限执行。

```code-tabs bash
版本: LTS=--lts | Node22=22 | Node24=24 | Node26=26
---
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/latest/install.sh | bash
source ~/.bashrc
nvm install {版本}
node -v
npm -v
```
