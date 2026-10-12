// Full-page screenshot with every lazy image loaded. usage: node fullshot.mjs <html> <out.png> [width=1440] [dpr=1]
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire('D:/VISTOFY/60-Tools/code-to-figma/package.json');
const puppeteer = require('puppeteer-core');
const [src, out, w = '1440', dpr = '1'] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: +w, height: 900, deviceScaleFactor: +dpr });
await page.goto('file:///' + path.resolve(src).split(path.sep).join('/'), { waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager'));
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); });
await page.screenshot({ path: out, fullPage: true });
const h = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('wrote', out, w, 'x', h);
await browser.close();
