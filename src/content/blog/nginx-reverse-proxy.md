---
title: nginx 反向代理配置模板
description: 一套开箱即用的反代配置：WebSocket 支持、TLS 1.2/1.3、HTTP 强制跳 HTTPS，域名与端口可直接填写生成。
order: 5
---

一套自用的 nginx 反向代理默认配置：HTTP 强制跳转 HTTPS、仅 TLS 1.2/1.3、WebSocket 升级支持、回源超时与请求头齐备。**在上方输入框填入你的域名与后端端口，配置即自动生成**，复制后放到 `/etc/nginx/conf.d/` 即可。

> 以下命令均需 **root** 权限执行；证书文件请放在 `/etc/nginx/ssl/`。

```code-tabs nginx
域名: 输入 substore.vansour.org
端口: 输入 9011
---
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      '';
}

upstream substore_backend {
    server 127.0.0.1:{端口};
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
    ssl_certificate     /etc/nginx/ssl/vansour.org.pem;
    ssl_certificate_key /etc/nginx/ssl/vansour.org.key;

    # ----- TLS：仅允许 1.2 / 1.3 -----
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:20m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # ----- 日志 -----
    access_log /var/log/nginx/substore.access.log;
    error_log  /var/log/nginx/substore.error.log warn;

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
        proxy_pass http://substore_backend;
    }
}
```

- **域名 / 端口**：上方输入框填写后自动生成对应配置；域名建议用 `acme.sh` / `certbot` 申请证书后放入 `/etc/nginx/ssl/`（证书路径也按需修改）
- **`map` 块**：为 WebSocket 透传 `Upgrade`/`Connection` 头，`upstream` 用 `keepalive` 复用长连接，适合 SSE / WebSocket 场景
- **HTTP→HTTPS**：80 端口 301 跳转；`server_tokens off` 隐藏版本号
- **TLS 1.2/1.3**：仅开放现代协议与安全套件，`ssl_session_tickets off` 配合共享缓存，兼顾性能与安全
- **回源调优**：`client_max_body_size 100m` 允许大文件上传；关闭 `proxy_buffering` 让响应流式转发；回源读写超时放宽到 600s，适合长任务接口
- 校验配置：`nginx -t`，然后 `systemctl reload nginx` 生效
