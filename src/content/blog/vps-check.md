---
title: vps 检测
description: VPS 常用检测命令：IP/网络/硬件信息、TCP 质量、路由追踪、端口连通性。
order: 5
---

## 1. 基础信息（Check.Place）

```bash
bash <(curl -fsSL Check.Place) -I
```

```bash
bash <(curl -fsSL Check.Place) -N
```

```bash
bash <(curl -fsSL Check.Place) -H
```

## 2. TCP 质量

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/ibsgss/TcpQuality/main/runTcpQuality.sh)
```

## 3. 路由追踪（NextTrace）

```bash
bash <(curl -fsSL nxtrace.org/nt)
```

## 4. 端口连通性（tcping）

```bash
bash <(curl -fsSL "https://raw.githubusercontent.com/nodeseeker/tcping/main/install.sh") --force
```
