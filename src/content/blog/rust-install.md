---
title: rust 安装
description: 用官方 rustup 脚本安装 Rust 工具链，配置 mold 链接器并安装常用 cargo 工具。
order: 3
---

> 以下命令均需 **root** 权限执行。

## 1. rust 安装

```bash
bash <(curl -fsSL https://sh.rustup.rs)
source ~/.cargo/env
rustc -V
cargo -V
```

## 2. mold 链接器

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

## 3. cargo install

```bash
cargo install <crate>            # 从 crates.io 安装
cargo install --git <url>        # 从 Git 仓库安装
cargo install --list             # 已安装列表
cargo uninstall <crate>          # 卸载
```

```bash
cargo install cargo-edit         # cargo add / cargo upgrade 依赖管理
cargo install cargo-binstall     # 二进制安装（GitHub Releases 直接下载）
cargo install cargo-nextest      # 高性能测试运行器
cargo install cargo-audit        # 依赖漏洞审计
cargo install cargo-outdated     # 依赖版本过期检查
cargo install ripgrep            # rg 全文搜索
cargo install fd-find            # fd 文件查找
cargo install bat                # cat 增强
cargo install hyperfine          # 命令耗时基准
```
