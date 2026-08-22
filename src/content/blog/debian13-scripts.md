---
title: Debian13 系统常用脚本
description: 重装系统、初始化环境、重置软件源、安装常用工具的一键命令合集，装完即用。
order: 1
---

每次拿到新 VPS 都要重装系统、改源、装工具，步骤重复又容易忘。整理成一份常用脚本，按顺序执行即可，从裸机到可用环境只需四条命令。

> 以下命令均需 **root** 权限执行。

## 1. 一键重装 Debian（可切换 13 / 12）

```code-tabs bash
版本: Debian13=13 | Debian12=12
---
bash <(curl -fsSL "https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh") debian {版本}
```

- 使用 [bin456789/reinstall](https://github.com/bin456789/reinstall) 开源重装脚本，网络安装官方纯净系统
- 下拉选择 **Debian 13 / 12** 指定目标版本；不输入版本号则安装最新稳定版
- `curl -fsSL`：静默下载、出错即失败、跟随重定向；`<( )` 进程替换把下载内容直接喂给 bash
- ⚠️ 会**清空磁盘所有数据**，执行前确认数据已备份

## 2. 初始化：DNS、motd 与主机名

```bash
echo -e "nameserver 1.1.1.1" > /etc/resolv.conf
> /etc/motd
hostnamectl set-hostname localhost
exec bash
```

一条命令完成四件事：

- 写入 `nameserver 1.1.1.1`，避免默认 DNS 污染或不可用
- 清空 `/etc/motd`，去掉登录时的厂商横幅
- 主机名重置为 `localhost`
- `exec bash` 重载当前 shell，立即生效（替换当前进程，不留多余 shell）

## 3. 重置 apt 软件源（deb822 格式）

```code-tabs bash
版本: Debian13=trixie | Debian12=bookworm
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

- 下拉选择 **Debian 版本（13/12）**、**协议（http/https）** 与 **镜像源（官方 / XTOM / TUNA）**，复制按钮复制当前组合
- 默认写入官方源 `deb.debian.org`，使用 **deb822 格式**（一个文件可声明多套源）
- 覆盖 `main contrib non-free non-free-firmware` 全部组件，含 `deb-src` 源码源
- 签名密钥 `debian-archive-keyring.gpg` 由 `debian-archive-keyring` 包提供

## 4. 更新系统并安装常用工具

```bash
apt -y update
apt -y full-upgrade
apt -y install wget curl jq sudo vim ca-certificates cron unzip git gpg aria2 tmux
```

- `full-upgrade` 会处理依赖变更与内核升级，比 `upgrade` 更彻底，适合系统刚装好时一步到位
- 常用工具清单：
  - `wget` / `curl`：下载与请求
  - `jq`：JSON 解析，脚本神器
  - `sudo` / `vim`：日常管理
  - `ca-certificates`：HTTPS 证书信任链
  - `cron`：定时任务
  - `unzip` / `git` / `gpg`：解压、版本管理、签名校验
  - `aria2`：多线程下载
  - `tmux`：会话保持，跑长任务不丢

## 使用顺序建议

重装 → 初始化 → 换源 → 更新。重装后按 2、3、4 顺序执行，一条龙完成基础环境配置；日常维护只需重复第 4 步。
