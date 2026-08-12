# TEN Content Engine v1

## Directory Structure

```
content/
  posts/
    work-video-concept.md      → /work/video-concept
    work-whitepaper.md         → /work/whitepaper
    work-toolkit.md            → /work/toolkit
    research-ai-strategy.md    → /research/ai-strategy
    research-cyber-defense.md  → /research/cyber-defense
    blog-tactical-patience.md  → /blog/tactical-patience
    translation-tech-glossary.md → /translation/tech-glossary
scripts/
  libs/                      ← CDN imports for browser-side rendering
styles/
  post.css                   ← Shared post page styles (injected into each generated page)
build/                       ← Generated output
index.html                   ← Main landing page (existing)
work.html                    ← Works list
research.html                ← Research list
blog.html                    ← Blog list
translation.html             ← Translation list
package.json
generate.js                  ← Build script
```

## Frontmatter Format

```yaml
---
title: "Title in display"
date: 2026-07-12
updated: 2026-08-10
type: work          # work | research | blog | translation
category: Video     # visible tag
author: TEN Team
cover: cover.jpg     # assets/images/cover.jpg
summary: "One-line summary"
tldr: |
  Optional TL;DR box content
media:
  - type: image
    src: assets/images/hero.jpg
    caption: "Alt text here"
    embed: full      # full | half | third
  - type: video
    src: video.mp4
    poster: poster.jpg
  - type: pdf
    src: doc.pdf
    label: "Full PDF"
  - type: mermaid
    code: |
      graph TD
        A --> B
  - type: math
    code: "\int_0^\\infty e^{-x} dx = 1"
  - type: code
    lang: python
    code: |
      print("hello")
---
```

## Embed Types

| Type | Rendering | Behavior |
|------|-----------|----------|
| `image` | `<img>` | lazy-loaded, responsive, optional caption |
| `video` | `<video controls>` | requires src, optional poster |
| `audio` | `<audio controls>` | optional title |
| `pdf` | iframe/embed viewer | opens in new tab fallback |
| `mermaid` | Mermaid.js render | auto-detected from code block |
| `math` | KaTeX render | inline or display mode |
| `code` | Syntax highlight | using marked highlight |
| `quote` | Blockquote embed | special styling |

## Math Mode

- Inline: `$E = mc^2$`
- Display: `$$\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}$$`

## Scripts (browser side)

```html
<script src="scripts/libs/marked.min.js"></script>
<script src="scripts/libs/katex.min.js"></script>
<script src="scripts/libs/mermaid.min.js"></script>
<script src="post-runtime.js"></script>
```
