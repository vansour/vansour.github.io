---
title: debian 常用脚本
description: 重装系统、初始化环境、重置软件源、安装常用工具的一键命令合集，装完即用。
order: 1
---

## 1. 一键重装

```code-tabs bash
版本: Debian12=12 | Debian13=13
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

## 3. 重置软件源

```code-tabs bash
版本: Debian12=bookworm | Debian13=trixie
---
rm -rf /etc/apt/mirrors/
> /etc/apt/sources.list
cat > /etc/apt/sources.list.d/debian.sources <<'EOF'
Types: deb
URIs: http://deb.debian.org/debian
Suites: {版本} {版本}-updates {版本}-backports
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb-src
URIs: http://deb.debian.org/debian
Suites: {版本} {版本}-updates {版本}-backports
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb
URIs: http://deb.debian.org/debian-security
Suites: {版本}-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb-src
URIs: http://deb.debian.org/debian-security
Suites: {版本}-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
EOF
```

## 4. 更新与安装

```bash
apt -y update
apt -y full-upgrade
apt -y install wget curl jq sudo vim ca-certificates cron unzip git gpg aria2 tmux
```

## 5. BBR

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/vansour/bbr/main/bbr.sh)
```
