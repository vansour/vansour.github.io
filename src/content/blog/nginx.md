---
title: nginx
description: 官方源或国内镜像源安装最新版 nginx，附开箱即用的反代配置模板，域名与端口可直接填写生成。
order: 2
---

> 以下命令均需 **root** 权限执行。

> 国内服务器可优先使用 163 / USTC 镜像源安装（选择对应 code-tabs 标签页）。

## 1. 安装

**官方源**（默认）：

```code-tabs bash
系统: Debian12=bookworm | Debian13=trixie
分支: 稳定版=debian | 主线版=mainline/debian
---
curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor | tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/{分支} {系统} nginx" > /etc/apt/sources.list.d/nginx.list
apt update
apt -y install nginx
nginx -v
```

**国内镜像源**（163 / USTC）：

```code-tabs bash
镜像: 网易=mirrors.163.com | USTC=mirrors.ustc.edu.cn
系统: Debian12=bookworm | Debian13=trixie
分支: 稳定版=debian | 主线版=mainline/debian
---
curl https://{镜像}/nginx/keys/nginx_signing.key | gpg --dearmor | tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://{镜像}/nginx/packages/{分支} {系统} nginx" > /etc/apt/sources.list.d/nginx.list
apt update
apt -y install nginx
nginx -v
```

> 镜像源的 `nginx_signing.key` 与官方一致（同一签名密钥）；若国内镜像不可用，可直接使用官方源。

## 2. 反代配置

```code-tabs nginx
后端地址: 输入 127.0.0.1:8080
域名: 输入 example.vansour.org
---
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      '';
}

upstream example_backend {
    server {后端地址};
    keepalive 128;
    keepalive_requests 1000;
    keepalive_timeout 60s;
}

# ---------- HTTP 强制跳转 HTTPS ----------
server {
    listen 80;
    server_name {域名};
    return 301 https://$host$request_uri;
}

# ---------- HTTPS 主配置 ----------
server {
    listen 443 ssl;
    http2 on;

    server_name {域名};
    server_tokens off;

    gzip on;
    gzip_proxied any;

    # ----- 证书 -----
    ssl_certificate     /etc/nginx/ssl/example.vansour.org.pem;
    ssl_certificate_key /etc/nginx/ssl/example.vansour.org.key;

    # ----- TLS：仅允许 1.2 / 1.3 -----
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:20m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # ----- 日志 -----
    access_log /var/log/nginx/example.access.log;
    error_log  /var/log/nginx/example.error.log warn;

    # ----- 上传阈值 & 请求缓冲 -----
    client_max_body_size        100m;
    client_body_buffer_size     256k;
    large_client_header_buffers 8 64k;
    client_header_timeout       60s;
    client_body_timeout         60s;
    send_timeout                600s;

    # ----- 回源超时 -----
    proxy_connect_timeout 10s;
    proxy_send_timeout    600s;
    proxy_read_timeout    600s;

    # ----- 关闭缓冲 -----
    proxy_buffering         off;
    proxy_request_buffering off;

    # ----- 回源协议 & 请求头 -----
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    location / {
        proxy_pass http://example_backend;
    }
}
```
