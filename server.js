const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

// Cloudflare Workers 静态文件服务器
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);

    // 静态文件路径
    const filePath = path.join(process.cwd(), pathname);
    if (!existsSync(filePath)) {
      return new Response('Not Found', { status: 404 });
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    try {
      const data = readFileSync(filePath);
      return new Response(data, {
        headers: { 'Content-Type': contentType },
      });
    } catch (e) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
