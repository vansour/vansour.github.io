---
title: Node.js 安装（nvm）
description: 用 nvm 安装与切换 Node.js 版本，LTS / 22 / 24 / 26 一键切换。
order: 4
---

[nvm](https://github.com/nvm-sh/nvm) 是社区标准的 Node 版本管理器：一个工具管全部版本，装过的版本可随时切换，换项目换版本不用重装。

> 以下命令均需 **root** 权限执行。

先安装 nvm 本体（只需一次）：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
```

然后选择版本安装：

```code-tabs bash
版本: LTS=--lts | Node22=22 | Node24=24 | Node26=26
---
source ~/.bashrc
nvm install {版本}
node -v
npm -v
```

- 下拉选择 **Node 版本（LTS / 22 / 24 / 26）**；`nvm install --lts` 安装当前长期支持版，`nvm install 22` 安装指定大版本（自动取该版本最新补丁）
- `nvm install` 会把 Node 与 npm 装进 `~/.nvm` 并切换当前 shell 使用；`nvm ls` 查看已装版本，`nvm use 22` 随时切换
- 装过的版本都可保留，切换不影响全局 `~/.nvm` 之外的文件
