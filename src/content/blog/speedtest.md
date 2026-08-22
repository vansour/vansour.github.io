---
title: speedtest 测速
description: 安装 Ookla speedtest-cli 并附常用子命令示例。
order: 6
---

> 安装命令需 **root** 权限执行。

## 1. 安装

```bash
bash <(curl -fsSL https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh) && apt -y install speedtest
```

## 2. 测速

```bash
speedtest                     # 默认测速
speedtest -s 12345            # 指定服务器 ID
speedtest -I eth0             # 指定网卡
speedtest -P 16               # 并发连接数
speedtest -u Mbps             # 显示单位
speedtest -a -A               # 接受许可与 GDPR（脚本化使用）
```

## 3. 服务器列表

```bash
speedtest -L                  # 列出最近的服务器
speedtest -S 北京             # 按关键词搜索服务器
```

## 4. 输出格式

```bash
speedtest -f json             # JSON 格式输出
speedtest -x result.json      # 导出结果到 JSON 文件
speedtest -v                  # 版本号
```
