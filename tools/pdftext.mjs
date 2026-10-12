// Extract text from a PDF via pdf.js. usage: node pdftext.mjs <pdf>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('D:/VISTOFY/60-Tools/code-to-figma/package.json');
const puppeteer = require('puppeteer-core');
const [pdf] = process.argv.slice(2);
const b64 = fs.readFileSync(pdf).toString('base64');
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setContent(`<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>`, { waitUntil: 'networkidle0' });
const text = await page.evaluate(async (b64) => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const doc = await pdfjsLib.getDocument({ data: Uint8Array.from(atob(b64), c => c.charCodeAt(0)) }).promise;
  const out = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const tc = await (await doc.getPage(p)).getTextContent();
    out.push(`--- p${p}: ` + tc.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim());
  }
  return out.join('\n');
}, b64);
console.log(text);
await browser.close();
