// Side-by-side check: the live page (left) against a Figma frame render (right).
// usage: node compare.mjs <page> <figma.png> [width 1440|390] [y0] [y1] [out.png]
//   <page> is relative to website/, e.g. index.html or work/copo.html
//   <figma.png>: get_screenshot(nodeId, maxDimension = the frame's height), then curl it into out/
// Prints both page heights and the difference.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('D:/VISTOFY/60-Tools/code-to-figma/package.json');
const puppeteer = require('puppeteer-core');
const sharp = createRequire('D:/VISTOFY/60-Tools/package.json')('sharp');

const [pg, fig, w = '1440', y0 = '0', y1 = '1200', out = 'out/compare.png'] = process.argv.slice(2);
const W = +w, VH = W <= 400 ? 844 : 900;   // the hero is 100svh, so the viewport height matters
fs.mkdirSync('out', { recursive: true });
const site = `out/site-${path.basename(pg, '.html')}-${W}.png`;

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: W, height: VH, deviceScaleFactor: 1 });
await page.goto('file:///' + path.resolve('../../website', pg).split(path.sep).join('/'), { waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach(i => (i.loading = 'eager')));
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => (i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
});
await page.screenshot({ path: site, fullPage: true });
const siteH = await page.evaluate(() => document.documentElement.scrollHeight);
await browser.close();

const figH = (await sharp(fig).metadata()).height;
const h = +y1 - +y0;
const cut = (f, fh) => sharp(f).extract({ left: 0, top: +y0, width: W, height: Math.max(1, Math.min(h, fh - +y0)) }).toBuffer();
const buf = await sharp({ create: { width: W * 2 + 20, height: h, channels: 4, background: '#888888ff' } })
  .composite([{ input: await cut(site, siteH), left: 0, top: 0 }, { input: await cut(fig, figH), left: W + 20, top: 0 }])
  .png().toBuffer();
await sharp(buf).resize(Math.min(1450, W * 2 + 20)).toFile(out);
console.log(`site ${siteH}px, figma ${figH}px (${figH - siteH >= 0 ? '+' : ''}${figH - siteH}) -> ${out}`);
