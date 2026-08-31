---
title: 国内镜像源
description: nvm、node、npm、pypi、rustup、cargo、go 等常用国内镜像源配置命令，每个工具一个下拉框，点击即生成对应源配置。
order: 8
---

> 以下命令需在终端执行；下拉框选择镜像源后，命令中的镜像地址会自动切换。

## cargo（Rust 包管理器）

写入 `~/.cargo/config.toml` 后，`cargo build` / `cargo install` 走稀疏索引镜像。

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

Go 1.13+ 全局写入 `go env`：

```code-tabs bash
镜像: 七牛云=goproxy.cn | 腾讯云=goproxy.io | 阿里云=mirrors.aliyun.com/goproxy
---
go env -w GO111MODULE=on
go env -w GOPROXY=https://{镜像},direct
```

## nvm（Node 版本管理器）

`nvm install` 从镜像下载 Node 二进制：

```code-tabs bash
镜像: 官方=nodejs.org/dist | 阿里云=npmmirror.com/mirrors/node | 清华=mirrors.tuna.tsinghua.edu.cn/nodejs-release
---
export NVM_NODEJS_ORG_MIRROR="https://{镜像}"
nvm install --lts
```

## node（Node 官方二进制）

直接从镜像下载 Node 二进制压缩包（Linux x64）：

```code-tabs bash
镜像: 官方=nodejs.org/dist | 阿里云=npmmirror.com/mirrors/node | 清华=mirrors.tuna.tsinghua.edu.cn/nodejs-release
---
curl -fsSL "https://{镜像}/v20.11.0/node-v20.11.0-linux-x64.tar.xz" -o node.tar.xz
tar -xJf node.tar.xz
```

## npm（Node 包管理器）

`npm` 全局 registry：

```code-tabs bash
镜像: 阿里云=registry.npmmirror.com | 腾讯云=mirrors.cloud.tencent.com/npm | 官方=registry.npmjs.org
---
npm config set registry https://{镜像}
npm config get registry
```

## pip（Python 包管理器）

`pip` 全局 index-url：

```code-tabs bash
镜像: 阿里云=mirrors.aliyun.com/pypi/simple | 清华=pypi.tuna.tsinghua.edu.cn/simple | 腾讯云=mirrors.cloud.tencent.com/pypi/simple | 官方=pypi.org/simple
---
pip config set global.index-url https://{镜像}
```

## rustup（Rust 工具链管理器）

安装前导出环境变量，安装后写入 shell 配置：

```code-tabs bash
镜像: 字节跳动=rsproxy.cn | 清华=mirrors.tuna.tsinghua.edu.cn/rustup
---
export RUSTUP_DIST_SERVER="https://{镜像}"
export RUSTUP_UPDATE_ROOT="https://{镜像}/rustup"
curl --proto '=https' --tlsv1.2 -sSf https://{镜像}/rustup-init.sh | sh
```

> 提示：镜像源地址与官方源不同步是正常现象；切换镜像后若出现校验失败，可先恢复官方源重试。
