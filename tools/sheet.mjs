// Labelled contact sheet. usage: node sheet.mjs out.png cols cell file1 file2 ...
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire('D:/VISTOFY/60-Tools/package.json');
const sharp = require('sharp');

const [out, colsS, cellS, ...files] = process.argv.slice(2);
const cols = +colsS, cell = +cellS, lab = 22;
const rows = Math.ceil(files.length / cols);
const W = cols * cell, H = rows * (cell + lab);

const comps = [];
for (const [i, f] of files.entries()) {
  const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + lab);
  try {
    const buf = await sharp(f, { limitInputPixels: false })
      .resize(cell - 8, cell - 8, { fit: 'contain', background: '#222' }).png().toBuffer();
    comps.push({ input: buf, left: x + 4, top: y + 4 });
  } catch (e) { console.error('skip', f, e.message); }
  const name = `${i + 1}. ${path.basename(f)}`.slice(0, Math.floor(cell / 7))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;');
  comps.push({ input: Buffer.from(
    `<svg width="${cell}" height="${lab}"><text x="4" y="15" font-family="Arial" font-size="12" fill="#fff">${name}</text></svg>`),
    left: x, top: y + cell });
}
await sharp({ create: { width: W, height: H, channels: 3, background: '#111' } })
  .composite(comps).png().toFile(out);
console.log('wrote', out, W, 'x', H);
