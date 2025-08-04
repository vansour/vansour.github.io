# 快速开始

本章将帮助您快速开始使用我们的文档系统。

## 先决条件

在开始之前，请确保您具备以下条件：

- 基本的 Markdown 语法知识
- Git 的基本使用经验
- 文本编辑器（推荐 VS Code）

## 安装 mdBook

### 方法 1：使用 Cargo 安装

```bash
cargo install mdbook
```

### 方法 2：从 GitHub 下载

访问 [mdBook 发布页面](https://github.com/rust-lang/mdBook/releases) 下载预编译的二进制文件。

## 创建新书

```bash
mdbook init my-book
cd my-book
```

## 预览书籍

```bash
mdbook serve
```

这将在 `http://localhost:3000` 启动一个本地服务器来预览您的书籍。

## 构建书籍

```bash
mdbook build
```

构建的静态文件将生成在 `book` 目录中（或配置文件中指定的目录）。
