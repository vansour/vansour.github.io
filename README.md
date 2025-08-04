# vansour.github.io

这是一个使用 [mdBook](https://rust-lang.github.io/mdBook/) 构建的文档网站，托管在 GitHub Pages 上。

## 🚀 快速开始

### 本地开发

1. **安装 Rust 和 mdBook**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   cargo install mdbook
   ```

2. **克隆仓库**
   ```bash
   git clone https://github.com/vansour/vansour.github.io.git
   cd vansour.github.io
   ```

3. **本地预览**
   ```bash
   mdbook serve
   ```
   
   访问 http://localhost:3000 查看网站。

4. **构建静态文件**
   ```bash
   mdbook build
   ```

### 添加新内容

1. 在 `src/` 目录下创建新的 Markdown 文件
2. 在 `src/SUMMARY.md` 中添加链接
3. 使用 `mdbook serve` 预览更改
4. 提交并推送到 main 分支

## 📁 项目结构

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions 部署配置
├── src/                    # 源文件目录
│   ├── SUMMARY.md         # 目录结构
│   ├── introduction.md    # 介绍页面
│   ├── getting-started.md # 快速开始
│   ├── concepts.md        # 基本概念
│   ├── configuration.md   # 配置说明
│   ├── best-practices.md  # 最佳实践
│   ├── faq.md            # 常见问题
│   └── references.md     # 参考资料
├── docs/                  # 构建输出目录（GitHub Pages 源）
├── book.toml             # mdBook 配置文件
└── README.md             # 项目说明
```

## 🔧 配置

主要配置在 `book.toml` 文件中：

- **语言设置**: 中文 (zh-cn)
- **输出目录**: `docs/` (用于 GitHub Pages)
- **主题**: 支持明暗主题切换
- **Git 集成**: 显示编辑链接和仓库信息

## 📝 写作指南

### Markdown 语法

支持标准 Markdown 语法以及 mdBook 扩展功能：

- 代码高亮
- 数学公式 (需启用)
- 提示框
- 交叉引用

### 文件命名

- 使用小写字母和连字符
- 避免特殊字符和空格
- 保持文件名描述性强

## 🚀 部署

网站使用 GitHub Actions 自动部署：

1. 推送到 `main` 分支时自动触发
2. 安装 Rust 和 mdBook
3. 构建静态文件
4. 部署到 GitHub Pages

## 🔗 相关链接

- [在线文档](https://vansour.github.io)
- [mdBook 官方文档](https://rust-lang.github.io/mdBook/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交 issue 和 pull request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request
