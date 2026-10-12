// 3x3 overlay-rule diagram on a square template.
// usage: node overlay.mjs <in.webp> <out.png> [size=1200]
import { createRequire } from 'node:module';
const require = createRequire('D:/VISTOFY/60-Tools/package.json');
const sharp = require('sharp');

const [src, out, sizeS = '1200'] = process.argv.slice(2);
const S = +sizeS, c = S / 3;
// The five reserved cells: top-left, top-right and the whole bottom row.
const reserved = [[0, 0, 'logo'], [2, 0, 'logo'], [0, 2, 'footer'], [1, 2, 'footer'], [2, 2, 'footer']];
const fs = Math.round(S / 40);
const svg = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
  ${reserved.map(([x, y]) => `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}" fill="#111110" fill-opacity="0.55"/>`).join('')}
  ${[1, 2].map(i => `<line x1="${i * c}" y1="0" x2="${i * c}" y2="${S}" stroke="#F7F7F5" stroke-opacity="0.85" stroke-width="2" stroke-dasharray="10 8"/>
     <line x1="0" y1="${i * c}" x2="${S}" y2="${i * c}" stroke="#F7F7F5" stroke-opacity="0.85" stroke-width="2" stroke-dasharray="10 8"/>`).join('')}
  ${reserved.map(([x, y, t]) => `<text x="${x * c + fs}" y="${y * c + fs * 1.8}" font-family="Inter, Arial" font-size="${fs}" letter-spacing="2" fill="#F7F7F5">${t.toUpperCase()}</text>`).join('')}
</svg>`;
await sharp(src).resize(S, S).composite([{ input: Buffer.from(svg) }]).png().toFile(out);
console.log('wrote', out);
