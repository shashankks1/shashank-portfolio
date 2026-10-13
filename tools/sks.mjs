// Shared drawing helpers: the SKS mark (from the hand-corrected size ladder) and the career thread.
import fs from 'node:fs';

export const LADDER = 'website/Asset/LOGO/SKS-ladder.svg';

/** One of the eight drawings in LOGO.svg (32, 52, 72, 104, 144, 204, 284, 400) as inline SVG. */
export function mark(size, label = 'SKS', file = LADDER) {
  const t = fs.readFileSync(file, 'utf8');
  const paths = Object.fromEntries([...t.matchAll(/<g clip-path="url\(#(clip[^)]+)\)">\s*<path d="([^"]+)"/g)].map(m => [m[1], m[2]]));
  const boxes = Object.fromEntries([...t.matchAll(/<clipPath id="([^"]+)">\s*<rect width="([\d.]+)" height="([\d.]+)" fill="white"(?: transform="translate\(([\d.]+) ([\d.]+)\)")?/g)]
    .map(m => [m[1], [+(m[4] || 0), +(m[5] || 0), +m[2], +m[3]]]));
  const id = Object.keys(boxes).find(k => Math.round(boxes[k][2]) === size);
  if (!id) throw new Error(`no ${size}px drawing in ${file}`);
  const [x, y, w, h] = boxes[id];
  return `<svg viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${label}"><path fill="currentColor" d="${paths[id]}"/></svg>`;
}

/** Career path from the CV, 2016 → 2026. */
export const PATH = [
  ['2016', 'Pearl Global', 'Ann Taylor collection'],
  ['2017', 'Studio Novature', 'Assistant designer'],
  ['2018', 'Digambar Kamini', 'Founder · textiles'],
  ['2021', 'Tech Pro Lab', 'UI designer'],
  ['2022', 'Learnet Skills', 'UX consultant'],
  ['2023', 'Independent', 'Brand & web'],
  ['2026', 'Vistofy', 'Design lead'],
];

/** The thread: horizontal runs joined by 45° risers, turns rounded like the mark's joints. */
export function thread(steps = PATH) {
  const W = 1200, x0 = 24, y0 = 300, rise = 40, r = 12, c = r * Math.SQRT1_2;
  const run = (W - 2 * x0 - (steps.length - 1) * rise) / steps.length;
  let d = `M${x0} ${y0}`, x = x0, y = y0;
  const nodes = [];
  steps.forEach((s, i) => {
    nodes.push([x + run / 2, y, s, i === steps.length - 1]);
    if (i < steps.length - 1) {
      const cx = x + run;
      d += ` H${(cx - r).toFixed(1)} Q${cx.toFixed(1)} ${y} ${(cx + c).toFixed(1)} ${(y - c).toFixed(1)}`;
      const tx = cx + rise, ty = y - rise;
      d += ` L${(tx - c).toFixed(1)} ${(ty + c).toFixed(1)} Q${tx.toFixed(1)} ${ty} ${(tx + r).toFixed(1)} ${ty}`;
      x = tx; y = ty;
    } else d += ` H${(x + run).toFixed(1)}`;
  });
  const esc = s => s.replace(/&/g, '&amp;');
  return `<svg viewBox="0 0 ${W} 380" role="img" aria-label="Career path, ${steps[0][0]} to ${steps.at(-1)[0]}">
  <path class="line" d="${d}"/>
  ${nodes.map(([nx, ny, [yr, co, ro], now]) => `<circle class="node${now ? ' node--now' : ''}" cx="${nx.toFixed(1)}" cy="${ny}" r="8"/>
  <text class="yr" x="${nx.toFixed(1)}" y="${ny + 30}" text-anchor="middle">${yr}</text>
  <text class="co" x="${nx.toFixed(1)}" y="${ny + 52}" text-anchor="middle">${esc(co)}</text>
  <text class="ro" x="${nx.toFixed(1)}" y="${ny + 70}" text-anchor="middle">${esc(ro)}</text>`).join('\n  ')}
</svg>`;
}

/** The same path as a plain list, for phones. */
export function threadList(steps = PATH) {
  const esc = s => s.replace(/&/g, '&amp;');
  return `<ol class="thread-list">\n${steps.map(([yr, co, ro]) =>
    `          <li><span class="label">${yr}</span><span><b>${esc(co)}</b><span class="small">${esc(ro)}</span></span></li>`).join('\n')}\n        </ol>`;
}
