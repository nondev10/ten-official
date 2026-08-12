# TEN 内容系统使用指南

## 快速开始

### 构建内容页面

```bash
# 构建所有页面（从 content/posts/*.md 生成）
node build/generate.js

# 监听模式（文件变化时自动重建）
node build/generate.js --watch
```

### 本地预览

```bash
# 用 Python 开一个简单服务器
python -m http.server 8080
# 然后用浏览器打开 http://localhost:8080
```

---

## 目录结构

```
content/posts/
  work-video-concept.md      → /work/video-concept
  work-whitepaper.md         → /work/whitepaper
  research-ai-strategy.md    → /research/ai-strategy
  blog-tactical-patience.md  → /blog/tactical-patience

build/generate.js            ← 构建脚本（运行它生成页面）
styles/post.css              ← 内容页样式
```

---

## 添加新内容

### 1. 创建 markdown 文件

在 `content/posts/` 下新建 `.md` 文件，命名规则：`{type}-{slug}.md`

```
content/posts/work-my-project.md
content/posts/research-my-topic.md
content/posts/blog-my-essay.md
content/posts/translation-my-article.md
```

### 2. 填写 frontmatter

```markdown
---
title: "标题"
date: 2026-08-12
updated: ""          # 可选，有变更时填写
type: work           # work | research | blog | translation
category: "分类名"    # 可选
author: "作者名"      # 可选
cover: "cover.jpg"   # 可选，assets/images/cover.jpg
summary: "一句话摘要"
tldr: "TL;DR 内容"   # 可选，短内容摘要
---

正文内容...
```

### 3. 运行构建

```bash
node build/generate.js
```

---

## 媒体嵌入语法

在正文中使用 `` ```media `` 代码块嵌入多媒体内容：

### 图片
```markdown
```media
{"type":"image","src":"assets/images/photo.jpg","caption":"图片说明","embed":"full"}
```

`embed` 可选值：`full`（全宽）| `half`（半宽）| `third`（三分之一宽）

### 视频
```markdown
```media
{"type":"video","src":"assets/videos/my-video.mp4","poster":"assets/images/poster.jpg","caption":"视频说明"}
```

### PDF
```markdown
```media
{"type":"pdf","src":"assets/documents/report.pdf","label":"完整报告"}
```

### Mermaid 图表
```markdown
```media
{"type":"mermaid","code":"graph TD\n  A --> B"}
```

### 数学公式（KaTeX）
```markdown
$$\int_0^\infty e^{-x} dx = 1$$

或行内公式：$E = mc^2$
```

### 代码块
```markdown
```javascript
const x = 42;
```
```

---

## Markdown 支持

标准 Markdown 语法全部支持：
- `# 标题` / `## 标题` / `### 标题`
- **粗体** / *斜体* / ***粗斜***
- `[链接](url)`
- `> 引用`
- `- 列表项` / `1. 有序列表`
- `---` 水平线
- `| 表格 | 格式 |`
- `代码` / 多行代码块

---

## 发布到生产

构建完成后，将以下文件/目录复制到服务器：

```
index.html         ← 主页
work.html          ← 作品列表
research.html      ← 研究列表
blog.html          ← 洞见列表
translation.html   ← 翻译列表
work/              ← 作品文章
research/          ← 研究文章
blog/              ← 洞见文章
css/               ← 样式
js/                ← 脚本
assets/            ← 图片/视频等资源
styles/            ← 内容页样式
```

不需要 Node.js 运行环境——所有页面都是静态 HTML。
