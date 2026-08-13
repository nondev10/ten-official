const parser = require('./build/markdown-parser');

console.log('=== Test Mermaid ===');
const md1 = '```mermaid\ngraph TD\nA --> B\n```';
console.log(parser.mdToHtml(md1));

console.log('\n=== Test Nested List ===');
const md2 = '- 一级\n  - 二级\n    - 三级\n- 一级2';
console.log(parser.mdToHtml(md2));

console.log('\n=== Test Multiline Blockquote ===');
const md3 = '> 第一行\n> 第二行\n> 第三行';
console.log(parser.mdToHtml(md3));
