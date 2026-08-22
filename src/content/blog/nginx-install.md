---
title: nginx 安装（官方源）
description: 用 nginx 官方源安装最新版 nginx，支持 Debian 12/13 与稳定版/主线版切换。
order: 2
---

用 apt 从发行版源装 nginx，版本往往偏旧。nginx 官方源直接提供最新稳定版（stable）与主线版（mainline）二进制包，配置一次，之后 `apt upgrade` 即可持续跟进。

> 以下命令均需 **root** 权限执行。

```code-tabs bash
系统: Debian12=bookworm | Debian13=trixie
分支: 稳定版=debian | 主线版=mainline/debian
---
curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor | tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/{分支} {系统} nginx" > /etc/apt/sources.list.d/nginx.list
echo -e "Package: *\nPin: origin nginx.org\nPin-Priority: 900" > /etc/apt/preferences.d/99nginx
apt update
apt -y install nginx
nginx -v
```

- 下拉选择 **系统（Debian 12/13）** 与 **分支（稳定版 / 主线版）**，复制按钮复制当前组合
- 官方源打包了最新 stable 与 mainline；mainline 含最新功能，日常使用选 stable
- `gpg --dearmor` 把密钥转成二进制格式存入 `/usr/share/keyrings/`，apt 源用 `signed-by=` 显式指定，只信任该密钥
- 优先级文件 `99nginx` 让官方包（`origin nginx.org`）优先于发行版自带包
- 验证：`nginx -v` 输出版本号即安装成功；`systemctl enable --now nginx` 可设为开机自启
