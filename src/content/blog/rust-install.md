---
title: Rust 安装
description: 用官方 rustup 脚本安装 Rust 工具链，一行命令装完即用。
order: 3
---

> 以下命令均需 **root** 权限执行。

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustc -V
cargo -V
```
