# 配置说明

本章详细介绍 mdBook 的各种配置选项。

## 基本配置

### [book] 部分

```toml
[book]
title = "我的书籍"
authors = ["作者姓名"]
language = "zh-cn"
description = "书籍描述"
src = "src"
```

### [build] 部分

```toml
[build]
build-dir = "book"    # 输出目录
create-missing = true # 自动创建缺失的文件
use-default-preprocessors = true
```

## 输出配置

### HTML 输出

```toml
[output.html]
theme = "light"                    # 默认主题
default-theme = "light"            # 默认主题
preferred-dark-theme = "navy"      # 暗黑主题
curly-quotes = true               # 智能引号
mathjax-support = false           # MathJax 支持
copy-fonts = true                 # 复制字体文件
google-analytics = "UA-XXXXXX"    # Google Analytics
additional-css = ["theme/custom.css"]  # 自定义CSS
additional-js = ["theme/custom.js"]    # 自定义JS
```

### Git 集成

```toml
[output.html]
git-repository-url = "https://github.com/user/repo"
git-repository-icon = "fa-github"
edit-url-template = "https://github.com/user/repo/edit/main/src/{path}"
```

## 预处理器

### 链接检查

```toml
[preprocessor.links]
# 启用链接检查
```

### 索引

```toml
[preprocessor.index]
# 生成索引页面
```

## 自定义主题

可以通过以下方式自定义主题：

1. 创建 `theme` 目录
2. 添加自定义 CSS 和 JS 文件
3. 修改 HTML 模板

### 目录结构

```
theme/
├── index.hbs          # 主页模板
├── css/
│   └── variables.css  # CSS 变量
└── js/
    └── custom.js      # 自定义脚本
```
