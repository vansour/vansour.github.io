---
title: claude code 安装
description: 用官方脚本或 npm 安装 Claude Code，配置 ~/.claude/settings.json，并附 IS_SANDBOX 一键运行命令。
order: 4
---

## 1. 安装

**官方脚本**：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**npm 安装**：

```bash
npm install -g @anthropic-ai/claude-code
```

安装后验证：

```bash
claude --version
```

## 2. 配置 ~/.claude/settings.json

> 在输入框中填写你的密钥、网关与模型，代码会自动替换生成；`[1m]` 为固定后缀，保留不替换。

```code-tabs bash
密钥: 输入 sk-你的API密钥
网关: 输入 https://你的网关域名
模型: 输入 deepseek/deepseek-v4-flash
---
mkdir -p ~/.claude
cat > ~/.claude/settings.json <<'EOF'
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "{密钥}",
    "ANTHROPIC_BASE_URL": "{网关}",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "{模型}[1m]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "{模型}[1m]",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "{模型}[1m]",
    "CLAUDE_CODE_EFFORT_LEVEL": "max",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "API_TIMEOUT_MS": "3000000"
  },
  "tui": "default",
  "skipDangerousModePermissionPrompt": true,
  "theme": "dark"
}
EOF
```

## 3. 一键运行

```bash
IS_SANDBOX=1 claude --dangerously-skip-permissions
```

> 跳过权限确认提示，适合在隔离环境或自动化的场景使用。
