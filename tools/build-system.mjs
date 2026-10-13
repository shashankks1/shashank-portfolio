// Build website/system.html (design system v3 specimen) from tools/pages/system-src.html.
// usage: node tools/build-system.mjs        (run from the repo root)
import fs from 'node:fs';
import { mark, thread } from './sks.mjs';

const out = fs.readFileSync('tools/pages/system-src.html', 'utf8')
  .replaceAll('{{MARK52}}', mark(52))
  .replaceAll('{{MARK400}}', mark(400))
  .replace('{{MARK400B}}', mark(400, 'SKS, 400 drawing'))
  .replace('{{MARK52B}}', mark(52, 'SKS, 52 drawing'))
  .replace('{{MARK32B}}', mark(32, 'SKS, 32 drawing'))
  .replace('{{THREAD}}', thread());
fs.writeFileSync('website/system.html', out);
console.log('wrote website/system.html', (out.length / 1024).toFixed(0) + 'KB');
