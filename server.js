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
  async fetch(request, env) {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);

    // 安全路径检查
    if (pathname.includes('..') || pathname.includes('%2e%2e')) {
      return new Response('Forbidden', { status: 403 });
    }

    // 默认页面
    if (pathname === '/' || pathname.endsWith('/')) {
      pathname += 'index.html';
    }

    try {
      // 从 ASSETS 获取文件
      const asset = await env.ASSETS.fetch(`https://dummy${pathname}`);

      if (asset.status !== 200) {
        return new Response('Not Found', { status: 404 });
      }

      const ext = pathname.slice(pathname.lastIndexOf('.'));
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      return new Response(await asset.text(), {
        headers: { 'Content-Type': contentType },
      });
    } catch (e) {
      console.error('Fetch error:', e.message);
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }
};
