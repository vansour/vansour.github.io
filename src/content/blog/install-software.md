---
title: 安装常用软件
description: Node.js、Rust、Docker、speedtest 的官方安装命令合集。
order: 3
---

> Docker 与 speedtest 的安装命令需 **root** 权限执行。

## 1. node.js（nvm）

```code-tabs bash
版本: LTS=--lts | Node22=22 | Node24=24 | Node26=26
---
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.bashrc
nvm install {版本}
node -v
npm -v
```

## 2. rust

```bash
bash <(curl -fsSL https://sh.rustup.rs)
source ~/.cargo/env
rustc -V
cargo -V
```

### mold 链接器

```bash
apt -y install mold clang
```

```bash
# 全局切换到 mold（写入 ~/.cargo/config.toml）
mkdir -p ~/.cargo
cat > ~/.cargo/config.toml <<'EOF'
[target.x86_64-unknown-linux-gnu]
rustflags = ["-C", "link-arg=-fuse-ld=mold"]
EOF
# 或仅当前会话：export RUSTFLAGS="-C link-arg=-fuse-ld=mold"
```

### cargo-edit

```bash
cargo install cargo-edit
```

## 3. docker

```bash
bash <(curl -fsSL "https://get.docker.com")
docker --version
```

## 4. speedtest

```bash
bash <(curl -fsSL https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh) && apt -y install speedtest
```
