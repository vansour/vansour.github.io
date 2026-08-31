---
title: 国内镜像源
description: nvm、npm、pypi、rustup、cargo、go 等常用国内镜像源配置命令，每个工具一个下拉框，点击即生成对应源配置。
order: 8
---

> 以下命令需在终端执行；下拉框选择镜像源后，命令中的镜像地址会自动切换。

## cargo（Rust 包管理器）

写入 `~/.cargo/config.toml`（本身即持久化），`cargo build` / `cargo install` 走稀疏索引镜像。

```code-tabs bash
镜像: 官方=crates.io | 字节跳动=rsproxy.cn | 清华=mirrors.tuna.tsinghua.edu.cn
---
mkdir -vp ${CARGO_HOME:-$HOME/.cargo}
cat >> ${CARGO_HOME:-$HOME/.cargo}/config.toml <<'EOF'
[source.crates-io]
replace-with = 'mirror'

[source.mirror]
registry = "sparse+https://{镜像}/crates.io-index/"
EOF
```

## go（Go 模块代理）

Go 1.13+ 全局写入 `go env`（`go env -w` 本身即持久化，无需写 shell 配置）：

```code-tabs bash
镜像: 七牛云=goproxy.cn | 社区源=goproxy.io
---
go env -w GO111MODULE=on
go env -w GOPROXY=https://{镜像},direct
```

## nvm（Node 版本管理器）

nvm 安装脚本从 GitHub 下载，可用 gh-proxy.com 代理加速；Node 二进制下载走国内镜像，环境变量写入 `~/.bashrc` 持久生效：

```code-tabs bash
安装源: 官方=raw.githubusercontent.com/nvm-sh/nvm | gh-proxy=gh-proxy.com/https://raw.githubusercontent.com/nvm-sh/nvm
镜像: 淘宝=npmmirror.com/mirrors/node | 清华=mirrors.tuna.tsinghua.edu.cn/nodejs-release
---
# 幂等写入 bashrc：先删旧行再加新值，重复运行/已配过其他镜像都不会堆积重复行
sed -i '/^export NVM_NODEJS_ORG_MIRROR=/d' ~/.bashrc
echo 'export NVM_NODEJS_ORG_MIRROR="https://{镜像}"' >> ~/.bashrc
export NVM_NODEJS_ORG_MIRROR="https://{镜像}"   # 当前会话立即生效，无需等 source
curl -o- "https://{安装源}/v0.39.7/install.sh" | bash
source ~/.bashrc   # 加载 bashrc 中的 nvm 初始化代码
nvm install --lts
```

## npm（Node 包管理器）

`npm config set` 写入 `~/.npmrc`，本身即持久化：

```code-tabs bash
镜像: 淘宝=registry.npmmirror.com | 腾讯云=mirrors.cloud.tencent.com/npm | 官方=registry.npmjs.org
---
npm config set registry https://{镜像}
npm config get registry
```

## pip（Python 包管理器）

`pip config set` 写入 `~/.config/pip/pip.conf`，本身即持久化：

```code-tabs bash
镜像: 阿里云=mirrors.aliyun.com/pypi/simple | 清华=pypi.tuna.tsinghua.edu.cn/simple | 腾讯云=mirrors.cloud.tencent.com/pypi/simple | 官方=pypi.org/simple
---
pip config set global.index-url https://{镜像}
```

## rustup（Rust 工具链管理器）

安装前导出环境变量，安装后写入 `~/.bashrc` 持久生效：

```code-tabs bash
镜像: 字节跳动=rsproxy.cn | 清华=mirrors.tuna.tsinghua.edu.cn/rustup
---
# 幂等写入 bashrc：先删旧行再加新值，重复运行/已配过其他镜像都不会堆积重复行
sed -i '/^export RUSTUP_DIST_SERVER=/d' ~/.bashrc
sed -i '/^export RUSTUP_UPDATE_ROOT=/d' ~/.bashrc
echo 'export RUSTUP_DIST_SERVER="https://{镜像}"' >> ~/.bashrc
echo 'export RUSTUP_UPDATE_ROOT="https://{镜像}/rustup"' >> ~/.bashrc
export RUSTUP_DIST_SERVER="https://{镜像}"   # 当前会话立即生效
export RUSTUP_UPDATE_ROOT="https://{镜像}/rustup"
curl --proto '=https' --tlsv1.2 -sSf https://{镜像}/rustup-init.sh | sh
```

> 提示：镜像源地址与官方源不同步是正常现象；切换镜像后若出现校验失败，可先恢复官方源重试。
