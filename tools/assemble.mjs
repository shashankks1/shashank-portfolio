// Assemble a case-study page: node assemble.mjs <body.html> <out.html> <title> <desc>
import fs from 'node:fs';
const [body, out, title, desc] = process.argv.slice(2);
const head = fs.readFileSync('pages/_head.html', 'utf8')
  .replace('@@NOTICE@@\n', '')
  .replace('@@ROBOTS@@\n', '')
  .replace('@@TITLE@@', title).replace('@@DESC@@', desc);
fs.writeFileSync(out, head + fs.readFileSync(body, 'utf8') + fs.readFileSync('pages/_foot.html', 'utf8'));
console.log('wrote', out);
