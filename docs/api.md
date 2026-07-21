# quick-press API 文档

## 概述

quick-press 提供 RESTful API 和 Server Actions 两种接口。

- **RESTful API**：适用于外部客户端、AI Agent、第三方集成
- **Server Actions**：适用于前端页面交互（表单提交等）

## 认证

所有 API 请求需要在 Header 中携带 API Key：

```http
Authorization: Bearer <api_key>
```

### 获取 API Key

1. 登录管理后台 → 设置 → API Keys
2. 点击"生成密钥"
3. 复制密钥并安全保存

## API 端点

### 文章 (Posts)

#### 获取文章列表

```http
GET /api/v1/posts?page=1&pageSize=10
```

**参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| page | int | 页码，默认 1 |
| pageSize | int | 每页条数，默认 10，最大 50 |
| status | string | 筛选状态：draft / published |
| tag | string | 按标签 slug 筛选 |

**响应**
```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "文章标题",
      "slug": "article-slug",
      "status": "published",
      "published_at": "2026-07-15T00:00:00Z",
      "tags": [{ "name": "技术", "slug": "tech" }]
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

#### 获取单篇文章

```http
GET /api/v1/posts/:slug
```

**响应**
```json
{
  "id": "uuid",
  "title": "文章标题",
  "slug": "article-slug",
  "content": "# Markdown 内容...",
  "status": "published",
  "tags": [],
  "categories": [],
  "created_at": "2026-07-15T00:00:00Z"
}
```

#### 创建文章

```http
POST /api/v1/posts
```

**请求体**
```json
{
  "title": "文章标题",
  "content": "# Markdown 内容",
  "slug": "optional-slug",
  "status": "draft",
  "tag_ids": ["uuid1", "uuid2"],
  "category_ids": ["uuid3"]
}
```

#### 更新文章

```http
PUT /api/v1/posts/:slug
```

**请求体**（同创建，所有字段可选）

#### 删除文章

```http
DELETE /api/v1/posts/:slug
```

### 页面 (Pages)

#### 获取页面列表

```http
GET /api/v1/pages
```

#### 获取单页面

```http
GET /api/v1/pages/:slug
```

#### 创建页面

```http
POST /api/v1/pages
```

**请求体**
```json
{
  "title": "页面标题",
  "content": "Markdown 内容",
  "slug": "page-slug",
  "template": "default",
  "parent_id": null
}
```

### 标签 (Tags)

#### 获取标签列表

```http
GET /api/v1/tags
```

#### 创建标签

```http
POST /api/v1/tags
```

**请求体**
```json
{
  "name": "标签名",
  "slug": "tag-slug",
  "color": "#3B82F6"
}
```

### 分类 (Categories)

#### 获取分类列表

```http
GET /api/v1/categories
```

#### 创建分类

```http
POST /api/v1/categories
```

**请求体**
```json
{
  "name": "分类名",
  "slug": "category-slug",
  "parent_id": null
}
```

### 评论 (Comments)

#### 获取文章评论

```http
GET /api/v1/posts/:slug/comments
```

#### 提交评论

```http
POST /api/v1/posts/:slug/comments
```

**请求体**
```json
{
  "content": "评论内容",
  "parent_id": null,
  "author_name": "游客名（可选）",
  "author_email": "guest@email.com（可选）"
}
```

### 媒体 (Media)

#### 上传文件

```http
POST /api/v1/media
```

**请求体**：`multipart/form-data`
| 字段 | 类型 | 说明 |
|------|------|------|
| file | File | 图片文件 |

**响应**
```json
{
  "id": "uuid",
  "url": "https://storage.supabase.co/..."
}
```

## 错误码

| 状态码 | error_code | 说明 |
|--------|------------|------|
| 400 | VALIDATION | 参数校验失败 |
| 401 | UNAUTHORIZED | 未提供或无效的 API Key |
| 403 | FORBIDDEN | 没有操作权限 |
| 404 | NOT_FOUND | 资源不存在 |
| 429 | RATE_LIMITED | 请求频率超限（60次/分钟） |
| 500 | SERVER_ERROR | 服务端错误 |

**错误响应格式**
```json
{
  "error": "错误描述",
  "error_code": "VALIDATION"
}
```

## 频率限制

- 普通用户：60 次/分钟
- 管理员：300 次/分钟
- 限制基于 API Key 统计

## OpenAPI 规范

完整 API 规范见 `/api/v1/openapi.json`（Swagger/OpenAPI 3.0 格式）。
