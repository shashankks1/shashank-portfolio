// Build website/system.html (design system v3 proposal) from tools/pages/system-src.html.
// Inlines the real SKS mark drawings from LOGO.svg and draws the career thread.
// usage: node tools/build-system.mjs [path-to-LOGO.svg]   (run from the repo root)
import fs from 'node:fs';

const LOGO = process.argv[2] || 'C:/Users/shash/Downloads/LOGO.svg';
const src = fs.readFileSync('tools/pages/system-src.html', 'utf8');
const t = fs.readFileSync(LOGO, 'utf8');

// LOGO.svg holds eight separately drawn sizes, each clipped to its own box.
const paths = Object.fromEntries([...t.matchAll(/<g clip-path="url\(#(clip[^)]+)\)">\s*<path d="([^"]+)"/g)].map(m => [m[1], m[2]]));
const boxes = Object.fromEntries([...t.matchAll(/<clipPath id="([^"]+)">\s*<rect width="([\d.]+)" height="([\d.]+)" fill="white"(?: transform="translate\(([\d.]+) ([\d.]+)\)")?/g)]
  .map(m => [m[1], [+(m[4] || 0), +(m[5] || 0), +m[2], +m[3]]]));
const bySize = Object.fromEntries(Object.entries(boxes).map(([id, b]) => [Math.round(b[2]), id]));
const mark = (size, label = 'SKS') => {
  const id = bySize[size];
  const [x, y, w, h] = boxes[id];
  return `<svg viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${label}"><path fill="currentColor" d="${paths[id]}"/></svg>`;
};

// The thread: horizontal runs joined by 45° risers, turns rounded like the mark's joints.
const steps = [
  ['2016', 'Pearl Global', 'Ann Taylor collection'],
  ['2017', 'Studio Novature', 'Assistant designer'],
  ['2018', 'Digambar Kamini', 'Founder · textiles'],
  ['2021', 'Tech Pro Lab', 'UI designer'],
  ['2022', 'Learnet Skills', 'UX consultant'],
  ['2023', 'Independent', 'Brand & web'],
  ['2026', 'Vistofy', 'Design lead'],
];
const W = 1200, x0 = 24, y0 = 300, rise = 40, r = 12, c = r * Math.SQRT1_2;
const run = (W - 2 * x0 - (steps.length - 1) * rise) / steps.length;
let d = `M${x0} ${y0}`, x = x0, y = y0;
const nodes = [];
steps.forEach((s, i) => {
  nodes.push([x + run / 2, y, s, i === steps.length - 1]);
  if (i < steps.length - 1) {
    const cx = x + run;                                           // corner: run → riser
    d += ` H${(cx - r).toFixed(1)} Q${cx.toFixed(1)} ${y} ${(cx + c).toFixed(1)} ${(y - c).toFixed(1)}`;
    const tx = cx + rise, ty = y - rise;                          // corner: riser → next run
    d += ` L${(tx - c).toFixed(1)} ${(ty + c).toFixed(1)} Q${tx.toFixed(1)} ${ty} ${(tx + r).toFixed(1)} ${ty}`;
    x = tx; y = ty;
  } else d += ` H${(x + run).toFixed(1)}`;
});
const esc = s => s.replace(/&/g, '&amp;');
const thread = `<svg viewBox="0 0 ${W} 380" role="img" aria-label="Career path, 2016 to 2026">
  <path class="line" d="${d}"/>
  ${nodes.map(([nx, ny, [yr, co, ro], now]) => `<circle class="node${now ? ' node--now' : ''}" cx="${nx.toFixed(1)}" cy="${ny}" r="8"/>
  <text class="yr" x="${nx.toFixed(1)}" y="${ny + 30}" text-anchor="middle">${yr}</text>
  <text class="co" x="${nx.toFixed(1)}" y="${ny + 52}" text-anchor="middle">${esc(co)}</text>
  <text class="ro" x="${nx.toFixed(1)}" y="${ny + 70}" text-anchor="middle">${esc(ro)}</text>`).join('\n  ')}
</svg>`;

const out = src
  .replaceAll('{{MARK52}}', mark(52))
  .replaceAll('{{MARK400}}', mark(400))
  .replace('{{MARK400B}}', mark(400, 'SKS, 400 drawing'))
  .replace('{{MARK52B}}', mark(52, 'SKS, 52 drawing'))
  .replace('{{MARK32B}}', mark(32, 'SKS, 32 drawing'))
  .replace('{{THREAD}}', thread);
fs.writeFileSync('website/system.html', out);
console.log('wrote website/system.html', (out.length / 1024).toFixed(0) + 'KB', 'sizes found:', Object.keys(bySize).join(','));
