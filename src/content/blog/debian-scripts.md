---
title: Debian 常用脚本
description: 重装系统、初始化环境、重置软件源、安装常用工具的一键命令合集，装完即用。
order: 1
---

> 以下命令均需 **root** 权限执行。

## 1. 一键重装

```code-tabs bash
版本: Debian12=12 | Debian13=13 | Debian14=14
---
bash <(curl -fsSL "https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh") debian {版本}
```

⚠️ 会**清空磁盘所有数据**，执行前确认数据已备份。

## 2. 初始化

```bash
echo -e "nameserver 1.1.1.1" > /etc/resolv.conf
> /etc/motd
hostnamectl set-hostname localhost
exec bash
```

## 3. BBR

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/vansour/bbr/main/bbr.sh)
```

## 4. 重置软件源

```code-tabs bash
版本: Debian12=bookworm | Debian13=trixie | Debian14=forky
协议: http | https
镜像: 官方=deb.debian.org | XTOM=mirrors.xtom.com | TUNA=mirrors.tuna.tsinghua.edu.cn
---
rm -rf /etc/apt/mirrors/
> /etc/apt/sources.list
cat > /etc/apt/sources.list.d/debian.sources <<'EOF'
Types: deb
URIs: {协议}://{镜像}/debian
Suites: {版本} {版本}-updates {版本}-backports
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb-src
URIs: {协议}://{镜像}/debian
Suites: {版本} {版本}-updates {版本}-backports
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb
URIs: {协议}://{镜像}/debian-security
Suites: {版本}-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb-src
URIs: {协议}://{镜像}/debian-security
Suites: {版本}-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
EOF
```

⚠️ Debian 14 尚在 testing，仅 `forky` / `forky-security` 套件；`-updates` / `-backports` 报错时把 Suites 行精简为 `Suites: forky`。

## 5. 更新与安装

```bash
apt -y update
apt -y full-upgrade
apt -y install wget curl jq sudo vim ca-certificates cron unzip git gpg aria2 tmux
```
