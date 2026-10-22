// Export the whole site as one PDF: desktop layout on 1440 × 900 pages (like a screen), real text,
// links that jump inside the PDF, bookmarks from the headings. Nothing is cut across a page: each block
// (row, paragraph, figure, a heading with its first paragraph) moves to the next page if it would split,
// and a figure taller than a page is scaled down whole (never cropped or re-proportioned).
// usage: node tools/export-pdf.mjs [out.pdf]        (run from the repo root)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const sharp = createRequire('D:/VISTOFY/60-Tools/package.json')('sharp');
const puppeteer = createRequire('D:/VISTOFY/60-Tools/code-to-figma/package.json')('puppeteer-core');

const SITE = path.resolve('website');
const TMP = path.join(os.tmpdir(), 'sks-portfolio-pdf');
const day = new Date().toISOString().slice(0, 10);
const OUT = path.resolve(process.argv[2] || `D:/PORTFOLIO/exports/Shashank-Kumar-Sinha-Portfolio-${day}.pdf`);
// Home order, then About. system.html (the working design-system spec) is left out on purpose.
const ORDER = [['home', 'index.html'], ['vistofy-identity', 'work/vistofy-identity.html'], ['indi-teppich', 'work/indi-teppich.html'],
  ['learnet', 'work/learnet.html'], ['vistofy-festivals', 'work/vistofy-festivals.html'], ['copo', 'work/copo.html'],
  ['aarna', 'work/aarna.html'], ['mb-consulting', 'work/mb-consulting.html'], ['about', 'about.html']];
const PAGE_W = 1440, PAGE_H = 900;

// 1. Images as JPEG: Chrome embeds JPEG as-is but stores WebP losslessly, which would make the PDF huge
fs.rmSync(TMP, { recursive: true, force: true });
fs.cpSync(path.join(SITE, 'CSS'), path.join(TMP, 'CSS'), { recursive: true });
const imgRoot = path.join(SITE, 'assets/images');
let nImg = 0;
for (const dir of fs.readdirSync(imgRoot)) {
  if (!fs.statSync(path.join(imgRoot, dir)).isDirectory()) continue;
  fs.mkdirSync(path.join(TMP, 'assets/images', dir), { recursive: true });
  for (const f of fs.readdirSync(path.join(imgRoot, dir)).filter(f => f.endsWith('.webp'))) {
    await sharp(path.join(imgRoot, dir, f)).resize({ width: 2000, withoutEnlargement: true }).flatten({ background: '#ECE8DF' })
      .jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(TMP, 'assets/images', dir, f.replace('.webp', '.jpg')));
    nImg++;
  }
}

// 2. One document: each page's header + main, links rewritten to jump inside the PDF
const link = href => {
  if (/^(https?:|mailto:)/.test(href)) return href;
  const [file, hash] = href.replace(/^(\.\.\/)+/, '').split('#');
  const name = path.posix.basename(file || '', '.html');
  if (!file) return hash === 'top' ? '#p-home' : `#home-${hash}`;
  if (name === 'index') return hash ? `#home-${hash}` : '#p-home';
  if (name === 'about') return '#p-about';
  if (ORDER.some(([k]) => k === name)) return `#p-${name}`;
  return null;   // system.html and anything else not in the PDF
};
let body = '';
for (const [key, file] of ORDER) {
  const h = fs.readFileSync(path.join(SITE, file), 'utf8');
  let part = h.match(/<header class="site-header">[\s\S]*?<\/header>/)[0] + '\n' + h.match(/<main>[\s\S]*?<\/main>/)[0];
  part = part.replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/(src|href)="(\.\.\/)?(assets\/images\/[^"]+)\.webp"/g, '$1="$3.jpg"')
    .replace(/\sid="([^"]+)"/g, (m, id) => ` id="${key}-${id}"`)
    .replace(/href="([^"]*)"/g, (m, href) => { const l = link(href); return l ? `href="${l}"` : 'data-nolink=""'; });
  body += `<div class="pdf-page" id="p-${key}">\n${part}\n</div>\n`;
}
const footer = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8').match(/<footer[\s\S]*?<\/footer>/)[0]
  .replace(/\s*<a href="system\.html">Design system<\/a>/, '').replace('href="#top"', 'href="#p-home"').replace('href="index.html"', 'href="#p-home"');
const head = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8').match(/<head>[\s\S]*?<\/head>/)[0]
  .replace(/<title>[^<]*<\/title>/, '<title>Shashank Kumar Sinha — Portfolio</title>')
  .replace('</head>', `<style>
  .site-header { position: relative !important; }
  .collage-hint { display: none !important; }          /* "drag the pieces" means nothing on paper */
  .pdf-page .hero { min-height: ${PAGE_H - 89}px; }  /* header + hero = exactly the first page */
  .piece, .piece * { transition: none !important; }
  .pdf-page { display: flow-root; }
  .pdf-spacer { display: block; grid-column: 1 / -1; margin: 0 !important; padding: 0 !important; border: 0 !important; }
  [data-nolink] { cursor: default; }
</style>\n</head>`);
body = body.replace(/<\/div>\n$/, `${footer}\n</div>\n`);   // the footer closes the last page instead of taking one of its own
fs.writeFileSync(path.join(TMP, 'index.html'), `<!DOCTYPE html>\n<html lang="en">\n${head}\n<body>\n${body}\n</body>\n</html>\n`);

// 3. Paginate in the browser, then print
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: PAGE_W, height: PAGE_H, deviceScaleFactor: 1 });
await page.emulateMediaType('screen');
await page.goto('file:///' + path.join(TMP, 'index.html').split(path.sep).join('/'), { waitUntil: 'networkidle0' });
await page.evaluate(async () => { document.querySelectorAll('img').forEach(i => (i.loading = 'eager')); await document.fonts.ready;
  await Promise.all([...document.images].map(i => (i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))); });

// I set every page break myself: a block (row, paragraph, figure, a heading with its first block) that would
// cross a page edge moves to the next page, and a figure taller than a page is scaled down whole (never cropped
// or re-proportioned). Chrome's print engine drops margins at a break and won't split a box's top padding (it
// moves the whole box instead), and either would shift everything after it. So each page edge is made to fall
// inside a spacer placed before the outermost box that opens the new page; margins at the edge are removed and
// whitespace that would hang across it is trimmed.
const report = await page.evaluate((PH) => {
  const TOP = 56, BOT = 44, AVAIL = PH - TOP - BOT;
  const Y = el => el.getBoundingClientRect().top + scrollY, B = el => el.getBoundingClientRect().bottom + scrollY;
  const span = els => [Math.min(...els.map(Y)), Math.max(...els.map(B))];
  const out = { moved: 0, shrunk: [], starts: {}, crossing: [] };
  const set = (el, prop, v) => el.style.setProperty(prop, v, 'important');
  const shrink = el => {
    const img = el.querySelector('img'); if (!img) return;
    const extra = el.getBoundingClientRect().height - img.getBoundingClientRect().height;
    img.style.height = Math.floor(AVAIL - 4 - extra) + 'px'; img.style.width = 'auto'; img.style.maxWidth = '100%';
    out.shrunk.push(img.getAttribute('src'));
  };
  // put the block on the page that starts at `edge`, its top at `y` (or lower, if its own section's padding says so)
  const moveTo = (els, edge, y, prevEl) => {
    let first = els[0].tagName === 'A' && els[0].parentNode.tagName === 'LI' ? els[0].parentNode : els[0];
    let A = first;                                  // the outermost box that opens the new page
    while (prevEl && A.parentElement && !A.parentElement.contains(prevEl) && !A.parentElement.classList.contains('pdf-page')) A = A.parentElement;
    for (let n = first; ; n = n.parentElement) { set(n, 'margin-top', '0px'); if (n === A) break; }
    for (const e of els) set(e, 'margin-top', '0px');
    if (prevEl) for (let n = prevEl; n && !n.contains(A); n = n.parentElement) {       // the boxes that close before the edge
      set(n, 'margin-bottom', '0px');
      if (n !== prevEl && B(n) > edge - 2) set(n, 'padding-bottom', '0px');
    }
    const inner = span(els)[0] - Y(A);              // A's own top padding above the block
    const aTop = Math.max(edge, y - inner);
    const sp = document.createElement('div'); sp.className = 'pdf-spacer'; sp.style.height = '0px';
    A.parentNode.insertBefore(sp, A);
    for (let k = 0; k < 6; k++) { const d = aTop - Y(A); if (Math.abs(d) < 0.25) break; sp.style.height = Math.max(0, parseFloat(sp.style.height) + d) + 'px'; }
  };
  const SEL = '.site-header, .hero, .collage, .work-row, .about-pull > .container, .about-hero > .container, .thread .section-head, .thread svg, .about-main .grid, .case-hero-back, .case-hero .tags, .case-hero-title, .case-hero-desc, .case-hero .meta-row, main > .case-img-full, .case-body > .container > *, .case-next, .contact > .container, .site-footer';
  for (const pg of document.querySelectorAll('.pdf-page')) {
    const units = [];
    pg.querySelectorAll(SEL).forEach(el => {
      if (el.matches('.case-body > .container > *')) {
        const prev = el.previousElementSibling;
        if (prev && prev.tagName === 'H2' && !el.matches('.case-img-full')) return;     // travels with its heading
        if (el.tagName === 'H2') { const nx = el.nextElementSibling; units.push({ els: nx && !nx.matches('.case-img-full') ? [el, nx] : [el] }); return; }
      }
      units.push({ els: [el], full: el.matches('main > .case-img-full, .hero') });    // these may fill a page to its edge
    });
    let prev = null, prevPage = Math.floor(Y(pg) / PH);
    for (const u of units) {
      let [t, b] = span(u.els);
      if (!u.full && b - t > AVAIL) { u.els.forEach(shrink); [t, b] = span(u.els); }
      if (u.full && b - t > PH) { u.els.forEach(shrink); [t, b] = span(u.els); }
      const p = Math.floor(t / PH);
      const fits = b <= (p + 1) * PH - (u.full ? 0 : BOT);
      if (!(fits && p === prevPage)) {             // this block opens a page: either it crossed the edge, or the edge fell just before it
        const target = fits ? p : p + 1;
        moveTo(u.els, target * PH, target * PH + (u.full ? 0 : TOP), prev && prev.els[prev.els.length - 1]);
        out.moved++;
      }
      [t, b] = span(u.els);
      prevPage = Math.floor((b - 1) / PH);
      if (Math.floor(t / PH) !== prevPage) out.crossing.push(pg.id + ': ' + (u.els[0].textContent || u.els[0].tagName).trim().slice(0, 40));
      prev = u;
    }
    const endY = B(pg), next = Math.ceil((endY - 0.5) / PH) * PH;   // the next site page starts on a fresh page
    pg.style.paddingBottom = Math.max(0, next - endY) + 'px';
    out.starts[pg.id] = Math.round(Y(pg) / PH) + 1;
  }
  out.total = Math.ceil(document.documentElement.scrollHeight / PH - 0.01);
  return out;
}, PAGE_H);
if (process.env.PDF_DEBUG) {                     // the planned layout, one screen per page, for checking the PDF against
  fs.mkdirSync(process.env.PDF_DEBUG, { recursive: true });
  for (let i = 0; i < report.total; i++) { await page.evaluate(y => window.scrollTo(0, y), i * PAGE_H); await page.screenshot({ path: path.join(process.env.PDF_DEBUG, `plan-${i + 1}.png`) }); }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
await page.pdf({ path: OUT, width: `${PAGE_W}px`, height: `${PAGE_H}px`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, outline: true, tagged: true });
await browser.close();
console.log(`${nImg} images as JPEG · ${report.moved} blocks start a new page · ${report.shrunk.length} tall figures scaled to fit`);
console.log('sections start on pages', JSON.stringify(report.starts), '· expected total', report.total);
if (report.crossing.length) console.log('STILL CROSSING A PAGE EDGE:', report.crossing);
console.log(`wrote ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB)`);
