// Element screenshots at 2x. usage: node grab.mjs <html> <width> '<json [{sel,i,out,pad}]>'
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire('D:/VISTOFY/60-Tools/code-to-figma/package.json');
const puppeteer = require('puppeteer-core');

const [src, width, jobsJson] = process.argv.slice(2);
const jobs = JSON.parse(jobsJson);
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: +width, height: 1200, deviceScaleFactor: 2 });
await page.goto('file:///' + path.resolve(src).replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
for (const j of jobs) {
  const root = j.page != null ? (await page.$$(".page"))[j.page] : page;
  const els = await root.$$(j.sel);
  const el = els[j.i ?? 0];
  if (!el) { console.error('missing', j.sel, j.i); continue; }
  await el.screenshot({ path: j.out });
  console.log('wrote', j.out);
}
await browser.close();
