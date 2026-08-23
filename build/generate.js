/**
 * TEN Content Engine — generate.js
 * Reads markdown + frontmatter from content/posts/, generates static HTML.
 * Astro-style: file-based routing, SSR-like page generation.
 * Usage: node build/generate.js
 */
const fs = require('fs');
const path = require('path');
const { mdToHtml, renderMediaEmbeds } = require('./markdown-parser');

// ─── Config ───────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'posts');
const BUILD_DIR = path.join(ROOT, 'build');

const TYPE_META = {
  work:      { label: '作品', slug: 'work',   color: '#7eb8da' },
  research:  { label: '研究', slug: 'research', color: '#c4a35a' },
  blog:      { label: '洞见', slug: 'blog',   color: '#7dc4a3' },
  translation: { label: '翻译', slug: 'translation', color: '#c47d9a' },
};

// ─── Parse Frontmatter ────────────────────────────────────────
function parseFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const metaStr = match[1];
  const body = match[2];
  const meta = {};
  const lines = metaStr.split('\n');
  let currentKey = null;
  let currentBlock = [];
  let inMultiLine = false;

  for (const line of lines) {
    if (inMultiLine) {
      if (line.startsWith('  ') || line.startsWith('\t')) {
        currentBlock.push(line.trimEnd());
      } else {
        meta[currentKey] = currentBlock.join('\n').replace(/\n$/, '');
        currentBlock = [];
        inMultiLine = false;
        if (!line.trim()) continue;
        const kv = line.match(/^(\w[\w-]*)\s*:\s*(.*)/);
        if (kv) { currentKey = kv[1]; meta[currentKey] = kv[2].trim() || ''; }
      }
      continue;
    }
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.*)/);
    if (kv) {
      const [, key, val] = kv;
      if (val === '|' || val === '>') {
        currentKey = key;
        currentBlock = [];
        inMultiLine = true;
      } else if (val === '' || val === '[]') {
        currentKey = key;
        meta[key] = [];
      } else if (/^\{.*\}$/.test(val) || /^\[.*\]$/.test(val)) {
        try { meta[key] = JSON.parse(val); } catch { meta[key] = val.replace(/^["']|["']$/g, ''); }
      } else {
        meta[key] = val.replace(/^["']|["']$/g, '');
      }
    } else if (line.match(/^\s*-\s/)) {
      if (Array.isArray(meta[currentKey])) {
        const item = line.replace(/^\s*-\s*/, '').trim();
        if (item.includes(':')) {
          const obj = {};
          item.split(',').forEach(p => {
            const [k, v] = p.split(':').map(s => s.trim().replace(/^["']|["']$/g, ''));
            obj[k] = v || '';
          });
          meta[currentKey].push(obj);
        } else {
          meta[currentKey].push(item);
        }
      }
    }
  }
  if (inMultiLine && currentKey) {
    meta[currentKey] = currentBlock.join('\n').replace(/\n$/, '');
  }
  return { meta, body };
}

// ─── Build a Single Post Page ────────────────────────────────
function buildPost(filepath, filename) {
  const raw = fs.readFileSync(filepath, 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const type = meta.type || 'blog';
  const slug = path.basename(filepath, '.md');
  const relPath = `/${TYPE_META[type]?.slug || 'blog'}/${slug}`;
  const assetPrefix = '../';
  const contentHtml = renderMediaEmbeds(mdToHtml(body, assetPrefix), assetPrefix);

  // TOC
  const tocLines = [];
  const headingRegex = /<h([2-3])[^>]*id="([^"]*)"[^>]*>(.+?)<\/h\1>/g;
  let m;
  while ((m = headingRegex.exec(contentHtml)) !== null) {
    tocLines.push({ level: parseInt(m[1]), text: m[3].replace(/<[^>]+>/g, ''), id: m[2] });
  }

  const cssPath = type ? '../assets/styles/styles.css' : 'assets/styles/styles.css';
  const postCssPath = type ? '../assets/styles/post.css' : 'assets/styles/post.css';
  const jsPath = type ? '../assets/scripts/main.js' : 'assets/scripts/main.js';
  const mermaidPath = type ? '../assets/scripts/mermaid.min.js' : 'assets/scripts/mermaid.min.js';
  const coverSrc = meta.cover ? (meta.cover.startsWith('assets/') ? '../' + meta.cover : `../${TYPE_META[type]?.slug || 'blog'}/assets/images/${meta.cover}`) : '';
  const dateStr = meta.date ? new Date(meta.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const updatedStr = meta.updated && meta.updated !== meta.date ? new Date(meta.updated).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  // Nav links with relative paths for subpages
  const navLinks = [
    { href: '../index.html', label: '首页' },
    { href: '../work.html', label: '作品' },
    { href: '../research.html', label: '研究' },
    { href: '../blog.html', label: '洞见' },
    { href: '../translation.html', label: '翻译' },
    { href: '../index.html#contact', label: '联系' },
  ];
  const navItems = navLinks.map(l => `<a href="${l.href}">${l.label}</a>`).join('');

  // Sidebar
  const sidebarLinks = [
    { href: '../work.html', label: '全部作品' },
    { href: '../research.html', label: '全部研究' },
    { href: '../blog.html', label: '全部洞见' },
    { href: '../translation.html', label: '全部翻译' },
  ].filter(l => l.href !== relPath.replace('/', '../') + '.html');
  const sidebarItems = sidebarLinks.map(l => `<a href="${l.href}">${l.label}</a>`).join('');

  const catColor = TYPE_META[type]?.color || '#7eb8da';
  const catLabel = TYPE_META[type]?.label || type;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${meta.title || slug} · TEN</title>
<meta name="description" content="${meta.summary || ''}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Barlow+Condensed:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="${cssPath}" />
<link rel="stylesheet" href="${postCssPath}" />
</head>
<body>

<nav class="nav post-nav" id="nav">
  <a href="../index.html" class="nav-logo">
    <div class="nav-logo-box"></div>
    <span class="nav-logo-name">TEN</span>
  </a>
  <div class="nav-links">${navItems}</div>
  <button class="nav-burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button>
</nav>
<div class="mobile-menu" id="mobileMenu">
  ${navLinks.map(l => `<a href="${l.href}">${l.label}</a>`).join('')}
</div>

<section class="post-hero">
  ${coverSrc ? `<div class="post-hero-img"><img src="${coverSrc}" alt="" /></div>` : ''}
  <div class="post-hero-content">
    <div class="post-meta-row">
      <span class="post-cat-badge" style="--cat-color:${catColor}">${catLabel}</span>
      ${meta.category ? `<span class="post-tag">${meta.category}</span>` : ''}
      <span class="post-date">${dateStr}</span>
      ${updatedStr ? `<span class="post-updated">更新：${updatedStr}</span>` : ''}
    </div>
    <h1 class="post-title">${meta.title || slug}</h1>
    ${meta.author ? `<p class="post-author">作者：${meta.author}</p>` : ''}
    ${meta.summary ? `<p class="post-summary">${meta.summary}</p>` : ''}
  </div>
</section>

<section class="post-body-section">
  <div class="post-layout">
    <main class="post-main">
      ${meta.tldr ? `<div class="post-tldr"><span class="tldr-label">TL;DR</span><p>${meta.tldr}</p></div>` : ''}
      <div class="post-content reveal r1">${contentHtml}</div>
    </main>
    <aside class="post-sidebar">
      <nav class="sidebar-nav">
        <div class="sidebar-section">
          <h4>浏览更多</h4>
          <ul>${sidebarItems}</ul>
        </div>
        ${tocLines.length > 1 ? `<div class="sidebar-section"><h4>目录</h4><ul class="toc-list">${tocLines.map(t => `<li class="toc-item toc-${t.level}"><a href="#${t.id}">${t.text}</a></li>`).join('')}</ul></div>` : ''}
      </nav>
    </aside>
  </div>
</section>

<footer>
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-logo-box"></div>
      <span class="footer-brand-name">Tenth Extra Nexus</span>
      <p class="footer-brand-desc">一个尝试用理性与表达重新组织世界的创作小组</p>
    </div>
    <div class="footer-col"><h4>导航</h4><ul>
      <li><a href="../index.html">首页</a></li>
      <li><a href="../work.html">作品</a></li>
      <li><a href="../research.html">研究</a></li>
      <li><a href="../blog.html">洞见</a></li>
    </ul></div>
    <div class="footer-col"><h4>联系</h4><ul><li><a href="mailto:hello@tenthmedia.example">hello@tenthmedia.example</a></li></ul></div>
  </div>
  <div class="footer-bottom">
    <span class="footer-copy">© 2024–${new Date().getFullYear()} Tenth Extra Nexus</span>
    <span class="footer-slogan">Reform the world.</span>
  </div>
</footer>

<script src="${jsPath}" defer></script>
<script>
  if (document.querySelector('.mermaid')) {
    const ms = document.createElement('script');
    ms.src = '${mermaidPath}';
    document.head.appendChild(ms);
    ms.onload = () => {
      if (typeof mermaid !== 'undefined') {
        mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        mermaid.run();
      }
    };
  }
  if (document.querySelector('pre code')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-twilight.min.css';
    document.head.appendChild(l);
    // Collect unique languages from code blocks
    var langs = new Set();
    document.querySelectorAll('pre code').forEach(el => {
      var m = el.className.match(new RegExp('language-(\\\\w+)'));
      if (m) langs.add(m[1]);
    });
    // Load core first, then each language as a script (ensures correct load order)
    var coreScript = document.createElement('script');
    coreScript.src = 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js';
    coreScript.onload = () => {
      var scripts = Array.from(langs).map(lang => new Promise(resolve => {
        if (Prism.languages[lang]) { resolve(); return; }
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-' + lang + '.min.js';
        s.onload = () => resolve();
        s.onerror = () => { console.warn('[TEN] Failed to load prism language:', lang); resolve(); };
        document.head.appendChild(s);
      }));
      Promise.all(scripts).then(() => {
        document.querySelectorAll('pre code').forEach(el => Prism.highlightElement(el));
      });
    };
    coreScript.onerror = () => console.error('[TEN] Failed to load prism.js');
    document.head.appendChild(coreScript);
  }
  if (document.querySelector('.math-display')) {
    const ks = document.createElement('link');
    ks.rel = 'stylesheet'; ks.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.15/dist/katex.min.css';
    document.head.appendChild(ks);
    const ms = document.createElement('script');
    ms.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.15/dist/katex.min.js';
    ms.onload = () => {
      document.querySelectorAll('.math-display').forEach(el => {
        el.innerHTML = katex.renderToString(el.textContent.trim(), { throwOnError: false, displayMode: true });
      });
    };
    document.head.appendChild(ms);
  }
</script>
</body>
</html>`;

  const outPath = path.join(ROOT, relPath + '.html');
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`  ✓ ${relPath}.html`);
  return { relPath, type, meta };
}

// ─── Build List Pages ─────────────────────────────────────────
function buildListPage(type, filePath) {
  const posts = allPosts.filter(p => p.type === type).sort((a, b) => (b.meta.date || '').localeCompare(a.meta.date || ''));
  const info = TYPE_META[type];
  const listTitle = info?.label || type;
  const color = info?.color || '#7eb8da';

  const cards = posts.map(p => `
    <a href="${p.relPath.replace(/^\//, '')}.html" class="list-card">
      <div class="list-card-meta">
        <span class="list-card-cat" style="color:${color}">${info.label}</span>
        <span class="list-card-date">${p.meta.date || ''}</span>
        ${p.meta.category ? `<span class="list-card-tag">${p.meta.category}</span>` : ''}
      </div>
      <h3 class="list-card-title">${p.meta.title || p.slug}</h3>
      ${p.meta.summary ? `<p class="list-card-summary">${p.meta.summary}</p>` : ''}
      <span class="list-card-arrow">›</span>
    </a>`).join('\n      ');

  const navLinks = [
    { href: 'index.html', label: '首页' },
    { href: 'work.html', label: '作品' },
    { href: 'research.html', label: '研究' },
    { href: 'blog.html', label: '洞见' },
    { href: 'translation.html', label: '翻译' },
    { href: 'index.html#contact', label: '联系' },
  ];
  const navItems = navLinks.map(l => `<a href="${l.href}">${l.label}</a>`).join('');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${listTitle} · TEN</title>
<meta name="description" content="${listTitle} 合集" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Barlow+Condensed:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/styles/styles.css" />
<link rel="stylesheet" href="assets/styles/post.css" />
</head>
<body>

<nav class="nav post-nav" id="nav">
  <a href="index.html" class="nav-logo">
    <div class="nav-logo-box"></div>
    <span class="nav-logo-name">TEN</span>
  </a>
  <div class="nav-links">${navItems}</div>
  <button class="nav-burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button>
</nav>
<div class="mobile-menu" id="mobileMenu">
  ${navLinks.map(l => `<a href="${l.href}">${l.label}</a>`).join('')}
</div>

<section class="list-hero" style="padding-top:160px;padding-bottom:80px;border-bottom:1px solid var(--line-2)">
  <div class="section-inner">
    <div class="section-kicker reveal">${info.label}</div>
    <h2 class="section-title reveal r1">${listTitle}<span style="color:${color}">·</span>${posts.length} 篇</h2>
  </div>
</section>

<section class="list-section">
  <div class="section-inner">
    <div class="list-grid reveal r1">
      ${cards}
    </div>
    ${posts.length === 0 ? '<p class="list-empty" style="padding:80px 0;text-align:center;color:var(--ink-3)">暂无内容。</p>' : ''}
  </div>
</section>

<footer>
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-logo-box"></div>
      <span class="footer-brand-name">Tenth Extra Nexus</span>
      <p class="footer-brand-desc">一个尝试用理性与表达重新组织世界的创作小组</p>
    </div>
    <div class="footer-col"><h4>导航</h4><ul>
      <li><a href="index.html">首页</a></li>
      <li><a href="work.html">作品</a></li>
      <li><a href="research.html">研究</a></li>
      <li><a href="blog.html">洞见</a></li>
    </ul></div>
    <div class="footer-col"><h4>联系</h4><ul><li><a href="mailto:hello@tenthmedia.example">hello@tenthmedia.example</a></li></ul></div>
  </div>
  <div class="footer-bottom">
    <span class="footer-copy">© 2024–${new Date().getFullYear()} Tenth Extra Nexus</span>
    <span class="footer-slogan">Reform the world.</span>
  </div>
</footer>

<script src="assets/scripts/main.js"></script>
<script>
  document.querySelectorAll('.reveal').forEach(el => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    obs.observe(el);
  });
</script>
</body>
</html>`;

  const outPath = path.join(ROOT, filePath);
  if (!fs.existsSync(path.dirname(outPath))) fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`  ✓ /${filePath}`);
}

// ─── Main ─────────────────────────────────────────────────────
function main() {
  [CONTENT_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  console.log('\n🔧 TEN Content Engine v1');
  console.log('   Scanning content/posts/ ...\n');

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('   ⚠ 暂无内容文件。在 content/posts/ 中添加 .md 文件。\n');
  }

  allPosts = [];
  files.forEach(f => {
    const fp = path.join(CONTENT_DIR, f);
    try {
      const { relPath, type, meta } = buildPost(fp, f);
      allPosts.push({ filepath: fp, relPath, type, meta, slug: f.replace('.md', '') });
    } catch (e) {
      console.error(`  ✗ ${f}: ${e.message}`);
    }
  });

  ['work.html', 'research.html', 'blog.html', 'translation.html'].forEach(fp => buildListPage(fp.replace('.html', ''), fp));

  console.log(`\n✅ 构建完成 — ${allPosts.length} 篇文章，4 个列表页`);
  console.log(`   输出: ${ROOT}\n`);
}

let allPosts = [];
main();
