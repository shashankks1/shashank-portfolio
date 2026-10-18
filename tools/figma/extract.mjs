// Read the live case pages and write one Figma payload per case: out/case-<slug>.json
// (hero, body blocks with inline runs, figures with their Figma imageHash and pixel size).
// usage: node extract.mjs [slug …]      (run from tools/figma; default = all six)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('D:/VISTOFY/60-Tools/code-to-figma/package.json');
const puppeteer = require('puppeteer-core');
const sharp = createRequire('D:/VISTOFY/60-Tools/package.json')('sharp');
const SITE = path.resolve('../../website');
const NAMES = { 'vistofy-identity': 'Vistofy Identity', 'indi-teppich': 'Indi Teppich', learnet: 'Learnet Skills', 'vistofy-festivals': 'Vistofy Festival Line', copo: 'COPO', aarna: 'Aarna', 'mb-consulting': 'MB Consulting' };
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(NAMES);
const hashes = JSON.parse(fs.readFileSync('image-hashes.json', 'utf8'));
fs.mkdirSync('out', { recursive: true });

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const im = async p => {
  if (!hashes[p]) throw new Error(`no Figma image for ${p}: upload it first (upload-images.mjs)`);
  const m = await sharp(path.join(SITE, 'assets/images', p)).metadata();
  return [hashes[p], m.width, m.height];
};

for (const slug of slugs) {
  await page.goto('file:///' + path.join(SITE, 'work', slug + '.html').split(path.sep).join('/'), { waitUntil: 'networkidle0' });
  const c = await page.evaluate(() => {
    // inline runs: plain strings, or [text, flags] with e = em, s = strong, l = link, c = code
    const runs = el => {
      const r = [];
      const walk = (n, f) => {
        if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, ' '); if (t) r.push([t, f]); return; }
        if (n.nodeType !== 1) return;
        const tg = n.tagName;
        if (tg === 'BR') { r.push(['\n', f]); return; }
        let g = f;
        if (tg === 'EM' || tg === 'I') g += 'e';
        if (tg === 'STRONG' || tg === 'B') g += 's';
        if (tg === 'A') g += 'l';
        if (tg === 'CODE') g += 'c';
        n.childNodes.forEach(x => walk(x, g));
      };
      el.childNodes.forEach(x => walk(x, ''));
      if (r.length) { r[0][0] = r[0][0].replace(/^\s+/, ''); r[r.length - 1][0] = r[r.length - 1][0].replace(/\s+$/, ''); }
      const m = [];
      for (const x of r) { if (m.length && m[m.length - 1][1] === x[1]) m[m.length - 1][0] += x[0]; else m.push(x); }
      return m.map(([t, f]) => (f ? [t, f] : t));
    };
    const txt = el => el.innerText.replace(/\s+/g, ' ').trim();
    const img = el => { const i = el.querySelector('img'); return i ? decodeURI(i.getAttribute('src')).replace('../assets/images/', '') : null; };
    const hero = document.querySelector('.case-hero');
    const title = hero.querySelector('.case-hero-title').innerHTML
      .replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ')
      .split('\n').map(s => s.trim()).join('\n');
    const H = {
      back: txt(hero.querySelector('.case-hero-back')),
      tags: [...hero.querySelectorAll('.tag')].map(txt),
      title,
      desc: runs(hero.querySelector('.case-hero-desc')),
      meta: [...hero.querySelectorAll('.meta-item')].map(m => [txt(m.querySelector('.meta-label')), txt(m.querySelector('.meta-value')), m.querySelector('a') ? 1 : 0]),
    };
    const full = document.querySelector('main > .case-img-full');
    const B = [], unknown = [];
    for (const el of document.querySelector('.case-body > .container').children) {
      const c = el.className || '', tg = el.tagName;
      if (tg === 'H2') B.push(['h2', txt(el)]);
      else if (tg === 'H3') B.push(['h3', txt(el)]);
      else if (tg === 'BLOCKQUOTE') B.push(['quote', txt(el)]);
      else if (c.includes('scope-note')) B.push(['credits', runs(el)]);
      else if (tg === 'P') B.push(['p', runs(el)]);
      else if (c.includes('meta-row')) B.push(['figs', [...el.querySelectorAll('.meta-item')].map(m => [txt(m.querySelector('.meta-label')), txt(m.querySelector('.meta-value'))])]);
      else if (c.includes('case-img')) { const cap = el.querySelector('.img-caption'); B.push(['fig', c.includes('narrow') ? 'narrow' : c.includes('offset') ? 'offset' : 'full', img(el), cap ? runs(cap) : null]); }
      else unknown.push(tg + '.' + c);
    }
    const nx = document.querySelector('.case-next');
    return { hero: H, heroImg: full ? img(full) : null, body: B, next: txt(nx.querySelector('.case-next-title')), nextLabel: txt(nx.querySelector('.case-next-label')), unknown };
  });
  if (c.unknown.length) console.warn(slug, 'has blocks the builder does not know yet:', c.unknown.join(', '));
  const body = [];
  for (const b of c.body) body.push(b[0] === 'fig' ? ['fig', b[1], ...(await im(b[2])), b[3]] : b);
  const out = { slug, name: NAMES[slug], hero: c.hero, heroImg: c.heroImg ? await im(c.heroImg) : null, body, next: c.next, nextLabel: c.nextLabel };
  fs.writeFileSync(`out/case-${slug}.json`, JSON.stringify(out));
  console.log(slug, JSON.stringify(out).length, 'chars ->', `out/case-${slug}.json`);
}
await browser.close();
