---
title: Docker 使用
description: 安装 Docker 并附常用子命令示例，重点覆盖 docker compose。
order: 7
---

> 安装命令需 **root** 权限执行。

## 1. 安装

```bash
bash <(curl -fsSL "https://get.docker.com")
```

## 2. 镜像

```bash
docker pull nginx               # 拉取镜像
docker images                   # 镜像列表
docker rmi nginx                # 删除镜像
docker search nginx             # 搜索镜像
docker tag nginx mynginx:1      # 打标签
docker save -o nginx.tar nginx  # 导出镜像
docker load -i nginx.tar        # 导入镜像
docker build -t myapp .         # 构建镜像
```

## 3. 容器

```bash
docker ps                                 # 运行中的容器
docker ps -a                              # 全部容器
docker run -d --name web -p 80:80 nginx   # 运行
docker start web                          # 启动
docker stop web                           # 停止
docker restart web                        # 重启
docker rm -f web                          # 删除
docker exec -it web bash                  # 进入容器
docker logs -f web                        # 日志
docker cp web:/etc/nginx/nginx.conf ./    # 复制文件
docker inspect web                        # 详情
docker stats                              # 资源占用
```

## 4. Compose

```bash
docker compose up -d             # 启动服务（后台）
docker compose up -d --build     # 构建并启动
docker compose down              # 停止并删除容器与网络
docker compose down -v           # 连同数据卷一并删除
docker compose ps                # 服务状态
docker compose logs -f           # 服务日志
docker compose exec app bash     # 进入指定服务容器
docker compose restart           # 重启全部服务
docker compose stop              # 停止服务（保留容器）
docker compose start             # 启动已停止的服务
docker compose pull              # 拉取最新镜像
docker compose build             # 构建镜像
docker compose config            # 校验并显示配置
docker compose top               # 各服务进程
docker compose images            # 服务镜像列表
docker compose rm -f             # 删除停止的服务容器
docker compose version           # 版本
```

## 5. 其他

```bash
docker system df                 # 磁盘占用
docker system prune -af          # 清理全部无用资源
docker network ls                # 网络列表
docker volume ls                 # 数据卷列表
docker info                      # 系统信息
docker version                   # 版本
```
