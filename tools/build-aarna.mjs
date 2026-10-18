// Builds the AARNA case-study images: website/assets/images/aarna/*.webp
// usage: node build-aarna.mjs        (run from tools/; needs the intermediates in aarna-src/)
//
// Rebuilding aarna-src/ from the source files in D:\WORK\Freelance\AARNA INDIAN FOODS:
//   node pdfpages.mjs "<A>/Stickers/Sticker Final.pdf" aarna-src/label all 6     -> label-01..05 (mango, lemon, chili, chili-garlic, mix)
//   node pdfpages.mjs "<A>/AARNA INDIAN FOOD LOGO.ai" aarna-src/logo all 6       -> logo-01 (cuts), logo-02 (final)
//   node pdfpages.mjs "<A>/AARNA INDIAN FOOD LOGO colors.ai" aarna-src/logocol all 6
//   blender -b --factory-startup --python aarna-jars.py -- aarna-src aarna-src/jars-row.png 2400 1300 256
//   ONLY=0 U_FRONT=0.125 CAM=0,-0.36,0.105 TZ=0.05 blender -b --factory-startup --python aarna-jars.py -- aarna-src aarna-src/jar-mango.png 1600 1600 256
// (blender = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"; the jar renders are mockups, not photographs.)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const sharp = createRequire('D:/VISTOFY/60-Tools/package.json')('sharp');
const puppeteer = createRequire('D:/VISTOFY/60-Tools/code-to-figma/package.json')('puppeteer-core');

const SRC = path.resolve('aarna-src');
const A = 'D:/WORK/Freelance/AARNA INDIAN FOODS';
const OUT = path.resolve('../website/assets/images/aarna');
const BG = '#ECE8DF';                 // --surface, the colour behind every image on the site
const Q = { quality: 84, effort: 5 };
fs.mkdirSync(OUT, { recursive: true });
const src = f => path.join(SRC, f);
const save = async (img, name) => {
  const f = path.join(OUT, name + '.webp');
  await img.webp(Q).toFile(f);
  const m = await sharp(f).metadata();
  console.log(`aarna/${name}.webp ${m.width}x${m.height} ${(fs.statSync(f).size / 1024) | 0}KB`);
};
const LABELS = ['label-01.png', 'label-02.png', 'label-03.png', 'label-04.png', 'label-05.png'];

/** Stack images vertically, each scaled to `inner` px wide, on the surface colour. */
async function stack(files, { width = 2400, pad = 144, gap = 48 } = {}) {
  const inner = width - 2 * pad, bufs = [];
  for (const f of files) bufs.push(await sharp(f).resize({ width: inner }).png().toBuffer());
  const hs = await Promise.all(bufs.map(async b => (await sharp(b).metadata()).height));
  const H = hs.reduce((a, h) => a + h, 0) + gap * (files.length - 1) + 2 * pad;
  let y = pad;
  const comp = bufs.map((b, i) => { const c = { input: b, left: pad, top: y }; y += hs[i] + gap; return c; });
  return sharp({ create: { width, height: H, channels: 3, background: BG } }).composite(comp);
}

// 1. Cover: the five jars (Blender mockup), trimmed of empty backdrop
await save(sharp(src('jars-row.png')).extract({ left: 0, top: 120, width: 2400, height: 1100 }), 'cover');

// 2. Close-up: the mango jar turned to its illustration
await save(sharp(src('jar-mango.png')).extract({ left: 250, top: 120, width: 1100, height: 1360 }), 'closeup');

// 3. The five labels, flat
await save(await stack(LABELS.map(src)), 'labels');

// 4. The five badges, cropped from the labels' first panel (a quarter of the 4:1 label = a square)
{
  const S = 432, gap = 24, pad = 72;
  const comp = [];
  for (const [i, f] of LABELS.entries()) {
    const m = await sharp(src(f)).metadata();
    const b = await sharp(src(f)).extract({ left: 0, top: 0, width: m.height, height: m.height }).resize(S).png().toBuffer();
    comp.push({ input: b, left: pad + i * (S + gap), top: pad });
  }
  await save(sharp({ create: { width: 2 * pad + 5 * S + 4 * gap, height: 2 * pad + S, channels: 3, background: BG } }).composite(comp), 'badges');
}

// 5. Wordmark: exploration cuts, the heavier display option, the final mark
{
  const S = 784, gap = 24;
  const comp = [];
  for (const [i, f] of ['logo-01.png', 'logocol-01.png', 'logo-02.png'].entries())
    comp.push({ input: await sharp(src(f)).resize(S).flatten({ background: '#ffffff' }).png().toBuffer(), left: i * (S + gap), top: 0 });
  await save(sharp({ create: { width: 3 * S + 2 * gap, height: S, channels: 3, background: BG } }).composite(comp), 'wordmark');
}

// 6. Earlier rounds: mango-only strips from the working files
await save(await stack(['Asset 6@4x.png', 'Asset 9@4x.png', 'Asset 12@4x.png', 'Asset 14@4x.png'].map(f => `${A}/Stickers/PNG/${f}`), { gap: 56 }), 'iterations');

// 7. Anatomy: one label with its three zones and its size, drawn in the site's own type
{
  const label = 'data:image/png;base64,' + fs.readFileSync(src('label-01.png')).toString('base64');
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  body { margin: 0; background: ${BG}; font-family: Inter, sans-serif; }
  .wrap { width: 1200px; padding: 64px 72px 72px; box-sizing: border-box; }
  .zones { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 0; margin-bottom: 14px; }
  .zone { border-bottom: 2px solid #2C57CA; padding: 0 12px 10px 0; position: relative; }
  .zone::before, .zone::after { content: ''; position: absolute; bottom: -2px; width: 2px; height: 12px; background: #2C57CA; }
  .zone::before { left: 0; } .zone::after { right: 0; }
  .zone + .zone { margin-left: 8px; }
  .no { font-size: 12px; font-weight: 600; letter-spacing: .08em; color: #A62D99; }
  .name { font-size: 15px; font-weight: 500; color: #111A33; margin-top: 2px; }
  .note { font-size: 13px; color: #4A5068; margin-top: 2px; line-height: 1.4; }
  .row { display: flex; align-items: stretch; gap: 16px; }
  .row img { width: 1000px; display: block; }
  .v { display: flex; align-items: center; gap: 8px; border-left: 2px solid #2C57CA; padding-left: 10px; font-size: 13px; color: #4A5068; }
  .h { width: 1000px; margin-top: 14px; border-top: 2px solid #2C57CA; padding-top: 8px; text-align: center; font-size: 13px; color: #4A5068; }
  b { font-weight: 600; color: #111A33; }
</style></head><body><div class="wrap">
  <div class="zones" style="width:1000px">
    <div class="zone"><div class="no">01</div><div class="name">Flavour badge</div><div class="note">Illustration in a shape of its own</div></div>
    <div class="zone"><div class="no">02</div><div class="name">Wordmark + flavour</div><div class="note">Fixed on every label</div></div>
    <div class="zone"><div class="no">03</div><div class="name">Two information panels</div><div class="note">Stamp-edged, in the flavour's brightest colour</div></div>
  </div>
  <div class="row"><img src="${label}"><div class="v"><span><b>51 mm</b><br>2 in</span></div></div>
  <div class="h"><b>203 mm</b> · 8 in</div>
</div></body></html>`;
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 600, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { await document.fonts.ready; });
  const el = await page.$('.wrap');
  const png = await el.screenshot({ type: 'png' });
  await browser.close();
  await save(sharp(png), 'anatomy');
}
