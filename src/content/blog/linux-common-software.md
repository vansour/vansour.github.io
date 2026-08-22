---
title: Linux 安装常用软件（nginx / Rust / Node）
description: 用官方源安装 nginx、rustup 安装 Rust、nvm 安装 Node.js，装完即用。
order: 2
---

新装系统后除了基础工具，还经常要装 nginx、Rust、Node.js。这里统一整理：**nginx 用官方源**（避开发行版旧版本），**Rust 用 rustup**，**Node.js 用 nvm**，全程不用编译源码。

> 以下命令均需 **root** 权限执行。

## 1. nginx（官方源）

```code-tabs bash
系统: Debian12=bookworm | Debian13=trixie
分支: 稳定版=debian | 主线版=mainline/debian
---
curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor | tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/{分支} {系统} nginx" > /etc/apt/sources.list.d/nginx.list
echo -e "Package: *\nPin: origin nginx.org\nPin-Priority: 900" > /etc/apt/preferences.d/99nginx
apt update
apt -y install nginx
nginx -v
```

- 下拉选择 **系统（Debian 12/13）** 与 **分支（稳定版 / 主线版）**，复制按钮复制当前组合
- 官方源打包了最新稳定版（stable）与主线版（mainline），比 Debian 自带版本新得多；mainline 含最新功能，日常使用选 stable
- `gpg --dearmor` 把密钥转成二进制格式存入 `/usr/share/keyrings/`，apt 源用 `signed-by=` 显式指定，只信任该密钥
- 优先级文件 `99nginx` 让官方包（`origin nginx.org`）优先于发行版自带包
- 验证：`nginx -v` 输出版本号即安装成功；`systemctl enable --now nginx` 可设为开机自启

## 2. Rust（rustup）

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustc -V
cargo -V
```

- [rustup](https://rustup.rs) 是官方推荐的 Rust 工具链管理器，默认安装 **stable** 版本
- `--proto '=https' --tlsv1.2` 强制走 HTTPS，避免脚本被中间人篡改
- 安装脚本会把 `~/.cargo/bin` 加入 PATH；`source ~/.cargo/env` 立即生效（或重开 shell）
- 日常更新：`rustup update`；切换工具链：`rustup toolchain install nightly && rustup default nightly`
- 卸载：`rustup self uninstall`

## 3. Node.js（nvm）

```code-tabs bash
版本: LTS=--lts | Node22=22 | Node24=24 | Node26=26
---
source ~/.bashrc
nvm install {版本}
node -v
npm -v
```

- 先执行一次安装脚本，nvm 本体只需装一次：

  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
  ```

- 下拉选择 **Node 版本（LTS / 22 / 24 / 26）**；`nvm install --lts` 安装当前长期支持版，`nvm install 22` 安装指定大版本（自动取该版本最新补丁）
- `nvm install` 会自动把 Node 与 npm 装进 `~/.nvm`，并切换当前 shell 使用；`nvm ls` 查看已装版本，`nvm use 22` 随时切换
- 装过的版本都可保留，换项目换版本不需要卸载重装
