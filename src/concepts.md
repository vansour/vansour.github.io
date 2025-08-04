# 基本概念

了解 mdBook 的核心概念将帮助您更好地组织和管理文档。

## 书籍结构

mdBook 项目具有以下基本结构：

```
my-book/
├── book.toml          # 配置文件
├── src/              # 源文件目录
│   ├── SUMMARY.md    # 目录结构
│   ├── chapter_1.md  # 章节文件
│   └── images/       # 图片资源
└── book/             # 构建输出目录
```

## 配置文件 (book.toml)

`book.toml` 是 mdBook 的主要配置文件，包含：

- **[book]** 部分：书籍的基本信息
- **[build]** 部分：构建相关设置
- **[output]** 部分：输出格式配置

## 目录文件 (SUMMARY.md)

`SUMMARY.md` 定义了书籍的目录结构和导航。它支持：

- 嵌套章节
- 链接到外部资源
- 分割线和分组

## Markdown 扩展

mdBook 支持标准 Markdown 语法，同时还提供了一些扩展功能：

### 代码块

支持语法高亮：

```rust
fn main() {
    println!("Hello, mdBook!");
}
```

### 数学公式

支持 KaTeX 数学公式（需要启用）：

\\[ \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} \\]

### 提示框

> **注意：** 这是一个重要的提示信息。

### 链接

- 内部链接：`[章节名称](./chapter.md)`
- 外部链接：`[网站](https://example.com)`
