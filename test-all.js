const parser = require('./build/markdown-parser');

console.log('=== Nested Lists ===');
const result1 = parser.mdToHtml('- 一级\n  - 二级\n    - 三级\n- 一级2');
console.log(result1);

console.log('\n=== Blockquote ===');
const result2 = parser.mdToHtml('> 第一行\n> 第二行\n> 第三行');
console.log(result2);

console.log('\n=== Mermaid ===');
const result3 = parser.mdToHtml('```mermaid\ngraph TD\nA --> B\n```');
console.log(result3);

console.log('\n=== Code Block ===');
const result4 = parser.mdToHtml('```js\nconst x = 1;\nconst y = 2;\n```');
console.log(result4);
