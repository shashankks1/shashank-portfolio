// Render PDF pages to PNG via pdf.js in headless Chrome.
// usage: node pdfpages.mjs <pdf> <outPrefix> <pages e.g. 1,2,15-18|all> [scale=2]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('D:/VISTOFY/60-Tools/code-to-figma/package.json');
const puppeteer = require('puppeteer-core');

const [pdf, prefix, pagesArg = 'all', scaleS = '2'] = process.argv.slice(2);
const b64 = fs.readFileSync(pdf).toString('base64');
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setContent(`<html><body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script></body></html>`,
  { waitUntil: 'networkidle0' });
const n = await page.evaluate(async (b64) => {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  window._doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  return window._doc.numPages;
}, b64);
const want = pagesArg === 'all' ? [...Array(n)].map((_, i) => i + 1)
  : pagesArg.split(',').flatMap(p => { const [a, b] = p.split('-').map(Number); return b ? [...Array(b - a + 1)].map((_, i) => a + i) : [a]; });
console.log('pages', n);
for (const p of want.filter(p => p <= n)) {
  const dataUrl = await page.evaluate(async (p, scale) => {
    const pg = await window._doc.getPage(p);
    const vp = pg.getViewport({ scale });
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    return c.toDataURL('image/png');
  }, p, +scaleS);
  const out = `${prefix}-${String(p).padStart(2, '0')}.png`;
  fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('wrote', out);
}
await browser.close();
