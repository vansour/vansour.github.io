# 常见问题

这里收集了使用 mdBook 时的常见问题和解决方案。

## 安装问题

### Q: 无法安装 mdBook

**A:** 确保您已安装 Rust 和 Cargo：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
cargo install mdbook
```

### Q: mdbook 命令未找到

**A:** 确保 Cargo 的 bin 目录在您的 PATH 中：

```bash
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## 构建问题

### Q: 构建失败，提示链接错误

**A:** 检查 SUMMARY.md 中的链接是否正确，确保所有引用的文件都存在。

### Q: 图片无法显示

**A:** 
1. 检查图片路径是否正确
2. 确保使用相对路径
3. 验证图片文件是否存在于 src 目录中

## 部署问题

### Q: GitHub Pages 显示 404 错误

**A:** 
1. 确保构建输出目录设置正确
2. 检查 GitHub Pages 设置中的源分支
3. 确认 index.html 文件存在于根目录

### Q: 样式丢失或显示异常

**A:**
1. 检查基础 URL 设置
2. 确保所有 CSS 和 JS 文件都被正确复制
3. 检查浏览器控制台是否有错误信息

## 内容问题

### Q: 数学公式不显示

**A:** 在 book.toml 中启用 MathJax 支持：

```toml
[output.html]
mathjax-support = true
```

### Q: 代码高亮不工作

**A:** 确保代码块指定了正确的语言：

```markdown
\`\`\`rust
fn main() {
    println!("Hello, world!");
}
\`\`\`
```

### Q: 中文字符显示异常

**A:** 确保文件以 UTF-8 编码保存，并在 book.toml 中设置正确的语言：

```toml
[book]
language = "zh-cn"
```

## 自定义问题

### Q: 如何修改主题颜色

**A:** 创建自定义 CSS 文件并在配置中引用：

```toml
[output.html]
additional-css = ["theme/custom.css"]
```

### Q: 如何添加自定义 JavaScript

**A:** 类似于 CSS，添加 JS 文件：

```toml
[output.html]
additional-js = ["theme/custom.js"]
```

## 获取帮助

如果上述解决方案都不能解决您的问题，可以：

1. 查看 [mdBook 官方文档](https://rust-lang.github.io/mdBook/)
2. 在 [GitHub Issues](https://github.com/rust-lang/mdBook/issues) 搜索相关问题
3. 参与 [Rust 社区讨论](https://users.rust-lang.org/)
