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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);

    // 安全路径检查
    if (pathname.includes('..')) {
      return new Response('Forbidden', { status: 403 });
    }

    // 读取文件
    try {
      const filePath = new URL(`./${pathname}`, import.meta.url);
      const file = await env.ASSETS?.get(filePath.pathname) || null;

      if (!file) {
        // 尝试默认页面
        if (pathname === '/' || pathname.endsWith('/')) {
          pathname += 'index.html';
          const defaultFile = await env.ASSETS?.get(pathname);
          if (defaultFile) {
            return defaultFile;
          }
        }
        return new Response('Not Found', { status: 404 });
      }

      const contentType = MIME_TYPES[path.extname(pathname)] || 'application/octet-stream';
      const body = await file.text();

      return new Response(body, {
        headers: { 'Content-Type': contentType },
      });
    } catch (e) {
      console.error('Error:', e);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};
