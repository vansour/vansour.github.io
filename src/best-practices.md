# 最佳实践

以下是使用 mdBook 的一些最佳实践建议。

## 文档组织

### 目录结构

保持清晰的目录结构：

```
src/
├── SUMMARY.md
├── introduction.md
├── tutorials/
│   ├── basic.md
│   └── advanced.md
├── reference/
│   ├── api.md
│   └── config.md
└── assets/
    ├── images/
    └── videos/
```

### 命名约定

- 使用小写字母和连字符：`getting-started.md`
- 避免特殊字符和空格
- 保持文件名简洁且描述性强

## 内容编写

### Markdown 最佳实践

1. **使用清晰的标题层次**
   ```markdown
   # 一级标题
   ## 二级标题
   ### 三级标题
   ```

2. **合理使用列表**
   - 使用无序列表表示不相关的项目
   - 使用有序列表表示步骤或优先级

3. **代码块格式化**
   ```markdown
   \`\`\`语言名称
   代码内容
   \`\`\`
   ```

### 图片和媒体

- 将图片存放在专门的目录中
- 使用相对路径引用图片
- 提供替代文本（alt text）

```markdown
![描述文字](./images/screenshot.png)
```

## 维护和更新

### 版本控制

1. 使用 Git 进行版本控制
2. 编写清晰的提交信息
3. 定期备份重要内容

### 持续集成

设置 GitHub Actions 自动构建和部署：

```yaml
name: Deploy mdBook
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup mdBook
      uses: peaceiris/actions-mdbook@v1
    - name: Build
      run: mdbook build
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./book
```

## 性能优化

### 图片优化

- 压缩图片以减少文件大小
- 使用适当的图片格式（WebP、PNG、JPG）
- 提供不同分辨率的图片版本

### 内容优化

- 避免过长的页面
- 合理分割内容
- 使用目录和索引提高导航性

## 可访问性

- 提供清晰的标题结构
- 使用语义化的 Markdown
- 确保颜色对比度足够
- 添加适当的替代文本
