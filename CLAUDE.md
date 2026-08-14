# CLAUDE.md — TEN 官网项目指南

## 项目概述
TEN (Tenth Extra Nexus) 静态网站，Node.js 构建，无外部依赖。

## 目录结构（已整理）
```
ten-site/
├── assets/           ← CSS/JS/图片/视频/PDF 统一放这里
│   ├── css/styles.css
│   ├── js/main.js
│   ├── images/
│   ├── documents/
│   └── videos/
├── styles/post.css   ← 内容页专用样式
├── build/            ← 构建脚本
│   ├── generate.js
│   └── markdown-parser.js
├── content/posts/    ← Markdown 源文件
├── index.html        ← 主页（手动维护）
├── work.html / research.html / blog.html / translation.html ← 列表页（生成）
├── work/ / research/ / blog/               ← 文章页（生成）
└── scripts/libs/     ← （保留）未来 CDN 本地缓存用
```

## 关键约束
1. **所有资源在 `assets/` 下**，路径引用使用 `assets/css/`、`assets/js/` 等
2. **不要移动用户已整理的文件结构**，先确认再改动
3. **HISTORY.md** (`E:/Desktop/TEN/HISTORY.md`) 记录所有用户反馈和历史，每次对话前必读
4. 用户多次强调：assets 应按类型分目录（但后来改为根目录 assets/，以最终结构为准）

## 生成路径规则
- 列表页（根目录）：`href="assets/css/styles.css"`、`src="assets/js/main.js"`
- 文章页（子目录）：`href="../assets/css/styles.css"`、`src="../assets/js/main.js"`
- 文章内资源：`assets/images/xxx.jpg`（相对解析，因为 src 已有 assets/ 前缀）

## Mermaid
- 自动从 ```mermaid``` 块转换为 ```media``` embed
- 页面加载时动态引入 CDN: https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js
- 渲染调用: mermaid.run()

## 已积累的历史教训（来自 HISTORY.md）
- 不要在 file:// 协议下用绝对路径
- 子页面的导航链接要用相对路径 ../xxx.html
- 媒体文件路径要相对于生成页面位置正确解析
- TOC 分级要用 CSS 实现，不是 JS 加 class
- 不要把 assets 分散到各类型子目录，统一到根 assets/
- 不要创建无意义的测试文件
