---
title: Rust 安装（rustup）
description: 用官方 rustup 脚本安装 Rust 工具链，一行命令装完即用。
order: 3
---

Rust 官方推荐用 [rustup](https://rustup.rs) 安装工具链，默认安装 **stable** 版本。脚本会配置 PATH，装完直接 `rustc` / `cargo` 可用。

> 以下命令均需 **root** 权限执行（脚本本身安装到用户目录，root 只是避免环境限制）。

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustc -V
cargo -V
```

- `--proto '=https' --tlsv1.2` 强制走 HTTPS，避免脚本被中间人篡改
- 安装脚本会把 `~/.cargo/bin` 加入 PATH；`source ~/.cargo/env` 立即生效（或重开 shell）
- 日常更新：`rustup update`；切换工具链：`rustup toolchain install nightly && rustup default nightly`
- 卸载：`rustup self uninstall`
