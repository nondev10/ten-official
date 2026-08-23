/**
 * TEN Markdown Parser - Final Working Version
 */

var NEWLINE_PLACEHOLDER = '\x00NL\x00';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parseInline(text) {
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  return text;
}

function parseMediaEmbeds(md) {
  return md.replace(/```media\n([\s\S]*?)\n```/g, function(_, block) {
    try {
      var conf = JSON.parse(block.trim());
      return '\n<!-- MEDIA_EMBED:' + Buffer.from(JSON.stringify(conf)).toString('base64') + ' -->\n';
    } catch(e) { return block; }
  });
}

function renderMediaEmbeds(html, assetPrefix) {
  assetPrefix = assetPrefix || '';
  return html.replace(/<!-- MEDIA_EMBED:([A-Za-z0-9+\/=]+) -->/g, function(_, b64) {
    var conf = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
    var type = conf.type, src = conf.src, caption = conf.caption;
    var embed = conf.embed || 'full', alt = conf.alt, poster = conf.poster;
    var lang = conf.lang, rest = {};
    Object.keys(conf).forEach(function(k) {
      if (['type','src','caption','embed','alt','poster','lang'].indexOf(k) === -1) rest[k] = conf[k];
    });
    // Resolve asset paths with prefix
    var resolvedSrc = src || '';
    if (resolvedSrc.startsWith('assets/')) {
      resolvedSrc = assetPrefix + resolvedSrc;
    } else if (resolvedSrc) {
      resolvedSrc = assetPrefix + 'assets/' + resolvedSrc.replace('assets/', '');
    }
    var resolvedPoster = poster || '';
    if (resolvedPoster.startsWith('assets/')) {
      resolvedPoster = assetPrefix + resolvedPoster;
    } else if (resolvedPoster) {
      resolvedPoster = assetPrefix + 'assets/' + resolvedPoster.replace('assets/', '');
    }
    var w = embed === 'third' ? 'style="grid-column:span 4"' : embed === 'half' ? 'style="grid-column:span 8"' : '';

    switch (type) {
      case 'image':
        return '<figure class="post-media" ' + w + '><img src="' + resolvedSrc + '" alt="' + (alt || caption || '') + '" loading="lazy" style="width:100%;height:auto;display:block"><figcaption>' + (caption || '') + '</figcaption></figure>';
      case 'video':
        return '<figure class="post-media video" ' + w + '><video controls preload="metadata" poster="' + (resolvedPoster || '') + '" style="width:100%;height:auto;display:block"><source src="' + resolvedSrc + '"></video>' + (caption ? '<figcaption>' + caption + '</figcaption>' : '') + '</figure>';
      case 'audio':
        return '<figure class="post-media audio"><audio controls src="' + resolvedSrc + '" style="width:100%"></audio>' + (caption ? '<figcaption>' + caption + '</figcaption>' : '') + '</figure>';
      case 'pdf':
        return '<figure class="post-media pdf" ' + w + '><iframe src="' + resolvedSrc + '" title="' + (rest.label || 'PDF') + '" loading="lazy" style="width:100%;height:600px;border:1px solid var(--line-2);background:var(--bg-2)"></iframe>' + (caption ? '<figcaption>' + caption + '</figcaption>' : '') + '</figure>';
      case 'mermaid':
        return '<figure class="post-media"><pre class="mermaid">' + (rest.code || src) + '</pre></figure>';
      case 'math':
        return '<figure class="post-media math"><div class="math-display">' + (rest.code || src) + '</div></figure>';
      case 'code':
        return '<figure class="post-media code"><pre><code class="language-' + (lang || 'text') + '">' + (rest.code || src) + '</code></pre></figure>';
      case 'quote':
        return '<figure class="post-media quote"><blockquote>"' + (rest.code || src) + '"</blockquote></figure>';
      default:
        return '<figure class="post-media"><span class="media-type-badge">' + type + '</span><p>' + src + '</p></figure>';
    }
  });
}

function convertMermaidToMedia(lines) {
  var result = [];
  var i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === '```mermaid') {
      var code = '';
      i++;
      while (i < lines.length && lines[i].trim() !== '```') {
        code += lines[i] + '\n';
        i++;
      }
      i++; // skip closing ```
      var conf = JSON.stringify({ type: 'mermaid', code: code });
      result.push('```media');
      result.push(conf);
      result.push('```');
    } else {
      result.push(lines[i]);
      i++;
    }
  }
  return result;
}

function parseTables(lines) {
  var result = [];
  var i = 0;
  while (i < lines.length) {
    if (lines[i].trim().startsWith('|')) {
      var tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2 && tableLines[1].indexOf('---') !== -1) {
        tableLines.splice(1, 1);
      }
      var parseRow = function(line) {
        return line.trim().split('|').filter(function(c) { return c.trim() !== ''; }).map(function(c) { return c.trim(); });
      };
      var headers = parseRow(tableLines[0]);
      var rows = tableLines.slice(1).map(parseRow);
      var tableHtml = '<table><thead><tr>';
      headers.forEach(function(h) { tableHtml += '<th>' + parseInline(h) + '</th>'; });
      tableHtml += '</tr></thead><tbody>';
      rows.forEach(function(row) {
        tableHtml += '<tr>';
        row.forEach(function(cell) { tableHtml += '<td>' + parseInline(cell) + '</td>'; });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table>';
      result.push(tableHtml);
    } else {
      result.push(lines[i]);
      i++;
    }
  }
  return result;
}

function parseCodeBlocks(lines) {
  var result = [];
  var i = 0;
  var inCodeBlock = false;
  var codeContent = '';
  var codeLang = '';
  while (i < lines.length) {
    var line = lines[i];
    if (!inCodeBlock && line.trim().startsWith('```')) {
      inCodeBlock = true;
      codeLang = line.trim().slice(3).trim();
      if (codeLang === 'media') {
        var mediaLines = [line];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          mediaLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) mediaLines.push(lines[i]);
        result.push(mediaLines.join('\n'));
        inCodeBlock = false;
        continue;
      }
      codeContent = '';
    } else if (inCodeBlock && line.trim().startsWith('```')) {
      inCodeBlock = false;
      var escaped = escapeHtml(codeContent.replace(/\n$/, ''));
      var placeholderCode = escaped.replace(/\n/g, NEWLINE_PLACEHOLDER);
      var langClass = codeLang ? ' class="language-' + codeLang + '"' : '';
      var langLabel = codeLang ? '<span class="code-lang">' + codeLang + '</span>' : '';
      result.push('<div class="code-block">' + langLabel + '<pre><code' + langClass + '>' + placeholderCode + '</code></pre></div>');
      codeLang = '';
      codeContent = '';
    } else if (inCodeBlock) {
      codeContent += line + '\n';
    } else {
      result.push(line);
    }
    i++;
  }
  return result;
}

function parseLists(lines) {
  var result = [];
  var i = 0;
  while (i < lines.length) {
    var line = lines[i];
    var listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)/);
    if (listMatch) {
      var baseIndent = listMatch[1].length;
      var items = [{indent: baseIndent, ordered: /^\d+\./.test(listMatch[2]), content: listMatch[3]}];
      i++;
      while (i < lines.length) {
        var nextMatch = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)/);
        if (!nextMatch) break;
        var nextIndent = nextMatch[1].length;
        if (nextIndent < baseIndent) break;
        items.push({indent: nextIndent, ordered: /^\d+\./.test(nextMatch[2]), content: nextMatch[3]});
        i++;
      }
      result.push(renderList(items));
      continue;
    }
    result.push(line);
    i++;
  }
  return result;
}


function renderList(items) {
  if (items.length === 0) return '';

  var html = '';
  var stack = []; // Stack of {tag, indent}

  items.forEach(function(item) {
    var tag = item.ordered ? 'ol' : 'ul';
    var indent = item.indent;

    // Close lists at deeper indent levels
    while (stack.length > 0 && stack[stack.length - 1].indent > indent) {
      var last = stack.pop();
      html += '</li></' + last.tag + '>';
    }

    // If same level, just close previous li
    if (stack.length > 0 && stack[stack.length - 1].indent === indent) {
      html += '</li>';
    }
    // If going deeper, close previous li and open nested list
    else if (stack.length > 0 && stack[stack.length - 1].indent < indent) {
      html += '</li>';
      html += '<' + tag + '>';
      stack.push({tag: tag, indent: indent});
    }
    // If stack is empty, open new list
    else if (stack.length === 0) {
      html += '<' + tag + '>';
      stack.push({tag: tag, indent: indent});
    }

    // Start new li
    html += '<li>' + parseInline(item.content);
  });

  // Close all remaining
  while (stack.length > 0) {
    var last = stack.pop();
    html += '</li></' + last.tag + '>';
  }

  return html;
}

function parseBlockquotes(lines) {
  var result = [];
  var i = 0;
  while (i < lines.length) {
    var line = lines[i];
    if (line.startsWith('>')) {
      var quoteLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        var content = lines[i].replace(/^>\s?/, '');
        quoteLines.push(content);
        i++;
      }
      var quoteText = quoteLines.join('\n');
      quoteText = parseInline(quoteText);
      quoteText = quoteText.replace(/\n/g, '<br>');
      result.push('<blockquote><p>' + quoteText + '</p></blockquote>');
    } else {
      result.push(line);
      i++;
    }
  }
  return result;
}

function mdToHtml(markdown, assetPrefix) {
  var md = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Step 1: Convert mermaid to media embeds
  var lines = md.split('\n');
  lines = convertMermaidToMedia(lines);
  md = lines.join('\n');

  // Step 2: Parse media embeds
  md = parseMediaEmbeds(md);

  // Step 3: Parse code blocks
  lines = md.split('\n');
  lines = parseCodeBlocks(lines);
  md = lines.join('\n');

  // Step 4: Re-parse media embeds (including converted mermaid)
  md = parseMediaEmbeds(md);

  // Step 5: Parse tables
  lines = md.split('\n');
  lines = parseTables(lines);
  md = lines.join('\n');

  // Step 6: Parse blockquotes
  lines = md.split('\n');
  lines = parseBlockquotes(lines);
  md = lines.join('\n');

  // Step 7: Parse lists
  lines = md.split('\n');
  lines = parseLists(lines);
  md = lines.join('\n');

  // Step 8: Process remaining lines
  md = lines.map(function(line) {
    if (line.startsWith('<h') || line.startsWith('<p') || line.startsWith('<ul') ||
        line.startsWith('<ol') || line.startsWith('<li') || line.startsWith('<table') ||
        line.startsWith('<blockquote') || line.startsWith('<hr') || line.startsWith('<pre') ||
        line.startsWith('<div') || line.startsWith('<!--')) return line;
    var headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      var level = headingMatch[1].length;
      var text = parseInline(headingMatch[2]);
      var id = 'h-' + headingMatch[2].toLowerCase().replace(/[^\w一-龥]+/g, '-').replace(/^-+|-+$/g, '');
      return '<h' + level + ' id="' + id + '">' + text + '</h' + level + '>';
    }
    if (line.startsWith('>')) {
      return '<blockquote><p>' + parseInline(line.slice(1).trim()) + '</p></blockquote>';
    }
    if (line.match(/^---+$/)) return '<hr>';
    if (line.trim() === '') return '';
    return '<p>' + parseInline(line) + '</p>';
  }).join('\n');

  // Clean up
  md = md.replace(/<p><\/p>/g, '');
  md = md.replace(/\n{3,}/g, '\n\n');

  // Step 9: Render media embeds
  md = renderMediaEmbeds(md, assetPrefix);

  // Step 10: Restore newlines in code blocks
  md = md.replace(new RegExp(NEWLINE_PLACEHOLDER, 'g'), '\n');

  return md;
}

module.exports = { mdToHtml, parseInline, escapeHtml, renderMediaEmbeds };
