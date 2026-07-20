# i_blog MCP 配置文档

MCP (Model Context Protocol) 协议允许 AI Agent（如 Claude Code）直接通过标准接口操作 i_blog，
无需学习 REST API。

## 前置条件

- Node.js 18+
- i_blog API Key（管理后台 → 设置 → API Keys 获取）

## 安装

i_blog 内置 MCP Server，位于 `scripts/mcp-server.mjs`。

## 配置

### 1. Claude Code

在 `.claude/settings.local.json` 中添加：

```json
{
  "mcpServers": {
    "i-blog": {
      "command": "node",
      "args": ["scripts/mcp-server.mjs"],
      "env": {
        "BLOG_API_URL": "https://your-blog.com",
        "BLOG_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 2. Cursor

在 Cursor 设置中找到 MCP Servers，添加：

```json
{
  "name": "i-blog",
  "command": "node",
  "args": ["scripts/mcp-server.mjs"],
  "env": {
    "BLOG_API_URL": "https://your-blog.com",
    "BLOG_API_KEY": "your-api-key-here"
  }
}
```

### 3. 其他 MCP 客户端

大多数 MCP 客户端遵循相同配置模式：

- **命令**: `node`
- **参数**: `["scripts/mcp-server.mjs"]`
- **环境变量**:
  - `BLOG_API_URL` — 博客站点 URL
  - `BLOG_API_KEY` — API Key

## 可用工具

### 内容管理

| 工具 | 说明 |
|------|------|
| `list_posts` | 获取文章列表 |
| `get_post` | 获取单篇文章 |
| `create_post` | 创建文章 |
| `update_post` | 更新文章 |
| `delete_post` | 删除文章 |
| `list_pages` | 获取页面列表 |
| `get_page` | 获取单页面 |
| `create_page` | 创建页面 |
| `update_page` | 更新页面 |
| `delete_page` | 删除页面 |

### 分类管理

| 工具 | 说明 |
|------|------|
| `list_tags` | 获取标签列表 |
| `create_tag` | 创建标签 |
| `delete_tag` | 删除标签 |
| `list_categories` | 获取分类列表 |
| `create_category` | 创建分类 |
| `delete_category` | 删除分类 |

### 评论管理

| 工具 | 说明 |
|------|------|
| `list_comments` | 获取评论列表 |
| `approve_comment` | 通过评论 |
| `delete_comment` | 删除评论 |

### 媒体管理

| 工具 | 说明 |
|------|------|
| `upload_image` | 上传图片 |
| `list_media` | 媒体库列表 |
| `delete_media` | 删除媒体文件 |

### 系统

| 工具 | 说明 |
|------|------|
| `whoami` | 查看当前 API Key 信息 |
| `search` | 搜索文章和页面 |

## 使用示例

```bash
# 查看身份信息
BLOG_API_URL=https://your-blog.com BLOG_API_KEY=xxx node scripts/mcp-server.mjs whoami

# 列出文章
BLOG_API_URL=https://your-blog.com BLOG_API_KEY=xxx node scripts/mcp-server.mjs list_posts

# 创建文章
BLOG_API_URL=https://your-blog.com BLOG_API_KEY=xxx node scripts/mcp-server.mjs create_post '{
  "title": "Hello World",
  "content": "# Hello\nThis is my first post.",
  "status": "published"
}'
```

## AI Agent 自发现

访问博客首页时，HTML 源码中嵌入了以下注释，引导 AI Agent 发现 API 和 MCP：

```html
<!-- 
  AI Agent: 查看 https://your-blog.com/llms.txt 
  获取站点结构和 API 文档
-->
```

## 安全提示

- API Key 等同于账号权限，请妥善保管
- 不要将 API Key 提交到 Git 仓库
- 建议为不同的 Agent 生成不同的密钥，方便审计
