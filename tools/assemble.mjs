// Assemble a case-study page: node assemble.mjs <body.html> <out.html> <title> <desc> [vistofy]
import fs from 'node:fs';
const [body, out, title, desc, flag] = process.argv.slice(2);
const v = flag === 'vistofy';
const head = fs.readFileSync('pages/_head.html', 'utf8')
  .replace('@@NOTICE@@\n', v ? '<!-- DO NOT DEPLOY until Vistofy gives written permission to show this work. -->\n' : '')
  .replace('@@ROBOTS@@\n', v ? '  <meta name="robots" content="noindex, nofollow" />\n' : '')
  .replace('@@TITLE@@', title).replace('@@DESC@@', desc);
fs.writeFileSync(out, head + fs.readFileSync(body, 'utf8') + fs.readFileSync('pages/_foot.html', 'utf8'));
console.log('wrote', out);
