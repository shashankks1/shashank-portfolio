// Builds every web image for the portfolio case studies (WebP, sized for 2x screens).
// usage: node build-images.mjs   (paths below are absolute; re-runnable)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('D:/VISTOFY/60-Tools/package.json');
const sharp = require('sharp');

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const SITE = 'D:/PORTFOLIO/assets/portfolio-latest/Shashank portfolio website/website/assets/images';
const V = 'D:/VISTOFY';
const F = `${V}/templates/_FESTIVALS`;
const LN = 'D:/PORTFOLIO/assets/portfolio-latest';
const CP = 'D:/CREATIVE/Explorations/EXPLORATIONS-WORKS/WORK/COPO BRANDING/DRAFT';
const S = p => path.join(HERE, p);  // scratchpad intermediates (grabs/, hi/)

const W = 2400;          // full-width image: 1184 css px container x ~2
const Q = { quality: 82, effort: 5 };
const out = (dir, name) => { fs.mkdirSync(`${SITE}/${dir}`, { recursive: true }); return `${SITE}/${dir}/${name}.webp`; };
const save = async (img, dir, name) => { const f = out(dir, name); await img.webp(Q).toFile(f); const m = await sharp(f).metadata(); console.log(`${dir}/${name}.webp ${m.width}x${m.height} ${(fs.statSync(f).size / 1024) | 0}KB`); };

/** Lay images out in rows on a flat canvas. rows: [[file|buffer,...],...]; every row is scaled to `width`. */
async function grid(rows, { width = W, gap = 24, pad = 0, bg = '#EFEDE8' } = {}) {  // paper — matches the v2 site
  const placed = []; let y = pad;
  for (const row of rows) {
    const metas = await Promise.all(row.map(async f => sharp(f, { limitInputPixels: false }).metadata()));
    const inner = width - 2 * pad - gap * (row.length - 1);
    const h = Math.floor(inner / metas.reduce((a, m) => a + m.width / m.height, 0));
    let x = pad;
    for (const [i, f] of row.entries()) {
      // never let rounding push the last image past the canvas edge
      const w = Math.min(Math.round(h * metas[i].width / metas[i].height), width - pad - x);
      placed.push({ input: await sharp(f, { limitInputPixels: false }).resize(w, h).toBuffer(), left: x, top: y });
      x += w + gap;
    }
    y += h + gap;
  }
  const height = y - gap + pad;
  return sharp({ create: { width, height, channels: 3, background: bg } }).composite(placed);
}
const fit = (f, w) => sharp(f, { limitInputPixels: false }).resize({ width: w, withoutEnlargement: true });

// ── VISTOFY · IDENTITY ───────────────────────────────────────────────
{
  const d = 'vistofy-identity';
  // Cover: the mark on a deep violet field, 3:2.
  const mark = await sharp(`${V}/20-Brand/LOGO/png/vistofy-mark-primary-2048.png`).resize({ height: 1060 }).toBuffer();
  const field = Buffer.from(`<svg width="2400" height="1600" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g" cx="50%" cy="48%" r="60%"><stop offset="0" stop-color="#2A1340"/><stop offset="1" stop-color="#120A19"/></radialGradient></defs>
    <rect width="2400" height="1600" fill="url(#g)"/></svg>`);
  const mm = await sharp(mark).metadata();
  await save(sharp(field).composite([{ input: mark, left: Math.round((2400 - mm.width) / 2), top: Math.round((1600 - mm.height) / 2) }]), d, 'cover');
  await save(await grid([[S('grabs/old-logo.png'), S('grabs/new-logo.png')]], { gap: 24 }), d, 'before-after');
  await save(await grid([[S('grabs/test-stamp.png')], [S('grabs/test-photocopy.png')], [S('grabs/test-tab.png')]], { width: 1316, gap: 0, bg: '#ffffff' }), d, 'three-tests');
  await save(fit(S('grabs/gap-vs-colour.png'), 1316), d, 'gap-not-colour');
  await save(fit(`${V}/20-Brand/logo-guidelines/size-ladder-d3/ladder.png`, 1500), d, 'size-ladder');
  await save(await grid([[S('grabs/where-digital.png'), S('grabs/where-physical.png')]], { gap: 24 }), d, 'applications');
  await save(fit(S('grabs/exp-p0.png'), 1400), d, 'explainer-cover');
  const st = `${V}/20-Brand/Stationery`;
  await save(await grid([
    [`${st}/letterhead/proof.png`, `${st}/business-card/proof.png`, `${st}/id-card-employee/proof.png`],
    [`${st}/certificate-internship/proof.png`, `${st}/envelope/proof.png`],
  ], { gap: 40, pad: 40, bg: '#E9E8E4' }), d, 'stationery');
  await save(sharp(`${V}/30-Design/magazine/preview-cover.png`), d, 'handbook-cover');
}

// ── VISTOFY · FESTIVAL LINE ──────────────────────────────────────────
{
  const d = 'vistofy-festivals';
  const set = slug => [1, 2, 3, 4, 5, 6, 7].map(n => `${F}/${slug}/${slug}-00${n}.webp`);
  const tile = 'sq';
  // Cover 3:2 — six templates from six different sets.
  await save(await grid([
    [`${F}/indian-air-force-day-2026/indian-air-force-day-2026-003.webp`, `${F}/munshi-premchand-punyatithi-2026/munshi-premchand-punyatithi-2026-004.webp`, `${F}/world-habitat-day-2026/world-habitat-day-2026-002.webp`],
    [`${F}/maa-katyayani-16-october-2026/maa-katyayani-16-october-2026-007.webp`, `${F}/world-teachers-day-2026/world-teachers-day-2026-003.webp`, `${F}/dussehra-2026/dussehra-2026-001.webp`],
  ], { width: 2400, gap: 16 }), d, 'cover');
  // One complete set, with a language legend underneath.
  const row = await grid([set('world-habitat-day-2026')], { width: 2400, gap: 16 });
  const rowBuf = await row.png().toBuffer(); const rm = await sharp(rowBuf).metadata();
  const tw = (2400 - 16 * 6) / 7;
  const labels = ['EN', 'EN', 'EN', 'HI', 'HI', 'GU', 'GU'];
  const legend = Buffer.from(`<svg width="2400" height="90" xmlns="http://www.w3.org/2000/svg">${labels.map((l, i) =>
    `<text x="${i * (tw + 16) + tw / 2}" y="56" text-anchor="middle" font-family="Inter, Arial" font-size="30" letter-spacing="4" fill="#57554F">${l}</text>`).join('')}</svg>`);
  await save(sharp({ create: { width: 2400, height: rm.height + 90, channels: 3, background: '#EFEDE8' } })
    .composite([{ input: rowBuf, left: 0, top: 0 }, { input: legend, left: 0, top: rm.height }]), d, 'one-set');
  // The 3x3 rule: clean template beside the same template with the grid.
  const src = `${F}/indian-air-force-day-2026/indian-air-force-day-2026-003.webp`;
  const { execFileSync } = await import('node:child_process');
  execFileSync(process.execPath, [S('overlay.mjs'), src, S('ov/rule-airforce.png'), '1200']);
  await save(await grid([[src, S('ov/rule-airforce.png')]], { width: 2400, gap: 24 }), d, 'the-rule');
  // Scale: four complete sets, seven across.
  await save(await grid(['indian-air-force-day-2026', 'munshi-premchand-punyatithi-2026', 'world-teachers-day-2026', 'maa-katyayani-16-october-2026'].map(set),
    { width: 2400, gap: 12 }), d, 'four-sets');
}

// ── LEARNET ──────────────────────────────────────────────────────────
{
  const d = 'learnet';
  await save(fit(`${LN}/3x/Artboard 2 v2@3x-100.jpg`, W), d, 'journey-map');
  const pg = p => S(`hi/learnet-${String(p).padStart(2, '0')}.png`);
  // Research pages: drop the left quote column — it names real participants.
  for (const [p, name] of [[5, 'research-language'], [6, 'research-geography'], [7, 'research-urban-rural']]) {
    const buf = await sharp(pg(p)).extract({ left: 500, top: 0, width: 3000, height: 2000 }).toBuffer();
    await save(sharp(await sharp(buf).trim({ threshold: 10 }).toBuffer()).extend({ top: 80, bottom: 80, left: 80, right: 80, background: '#ffffff' }).resize({ width: W, withoutEnlargement: true }), d, name);
  }
  // Everything else: trim the slide's empty margins, then give it an even border.
  for (const [p, name] of [[14, 'sitemap'], [15, 'design-system-type'], [16, 'design-system-colour'], [17, 'screens-onboarding'], [18, 'screens-tiers']]) {
    const t = await sharp(pg(p)).trim({ threshold: 10 }).toBuffer();
    await save(sharp(t).extend({ top: 120, bottom: 120, left: 120, right: 120, background: '#ffffff' }).resize({ width: W, withoutEnlargement: true }), d, name);
  }
}

// ── COPO ─────────────────────────────────────────────────────────────
{
  const d = 'copo';
  await save(fit(`${CP}/PROJECT PORTFOLIO PRESENTATION/3d logo CENTER.jpg`, W), d, 'cover');
  await save(await grid([[S('hi/copo-options-01.png'), S('hi/copo-options-02.png')], [S('hi/copo-options-03.png'), S('hi/copo-options-04.png')]], { gap: 16 }), d, 'logo-options');
  await save(await grid([[S('hi/copo-final-01.png'), S('hi/copo-final-02.png'), S('hi/copo-final-03.png')]], { gap: 24, pad: 0, bg: '#ffffff' }), d, 'final-mark');
  // Manual page 10 is used as copo-manual-10r: the owner's name is whited out of the sample letter.
  // Page 11 (business card) is never used — it carries the owner's phone and email.
  await save(await grid([[S('hi/copo-manual-03.png'), S('hi/copo-manual-04.png'), S('hi/copo-manual-05.png'), S('hi/copo-manual-06.png')],
    [S('hi/copo-manual-07.png'), S('hi/copo-manual-08.png'), S('hi/copo-manual-10r.png'), S('hi/copo-manual-13.png')]], { gap: 24, pad: 24, bg: '#E9E8E4' }), d, 'logo-manual');
  await save(fit(S('grabs/copo-palette.png'), W), d, 'palette');
  const R = `${CP}/PROJECT PORTFOLIO PRESENTATION`;
  // Shashank's Cinema 4D renders, laid out the way his earlier COPO page planned them.
  await save(await grid([[`${R}/VISITING CARD BEAUTY FINAL.jpg`, `${R}/TAGS BEAUTY.tif`, `${R}/STICKER.tif`]], { width: 1600, gap: 16 }), d, 'renders');
  await save(sharp(`${R}/LETTERHEAD.tif`), d, 'letterhead');
  await save(await grid([[S('hi/copo-banner-01.png')], [S('hi/copo-banner-02.png')]], { gap: 16 }), d, 'banners');
  // Not used any more: the Instagram mockup (its post grid shows real customers) — delete if present.
  for (const old of ['social', 'collateral', 'mark-render']) fs.rmSync(`${SITE}/${d}/${old}.webp`, { force: true });
}
console.log('done');
