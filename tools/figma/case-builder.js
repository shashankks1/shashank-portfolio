// use_figma body that builds case-study frames on the Website page (0:1) from components.
// Usage: paste this whole file as the use_figma `code`, replacing __CASES__ with an array of
// payloads from out/case-<slug>.json and __X__ with matching x positions. Frames that already
// exist (same name) are skipped, so delete or rename a frame first to rebuild it.
// Layout mirrors CSS/case-study.css at a 1440 viewport: 12 columns of 84.267 + gap 28.8 in a
// 1328 container; an h2 sits in columns 1–3 beside its first block; grid-item margins add up.
const page = await figma.getNodeByIdAsync('0:1');
await figma.setCurrentPageAsync(page);
for (const f of [['Libre Baskerville','Regular'],['Libre Baskerville','Italic'],['Inter','Regular'],['Inter','Medium'],['Inter','Semi Bold'],['Inter','Bold']]) await figma.loadFontAsync({ family: f[0], style: f[1] });
let mono = null; for (const fam of ['Roboto Mono', 'Source Code Pro', 'JetBrains Mono']) { try { await figma.loadFontAsync({ family: fam, style: 'Regular' }); mono = fam; break; } catch (e) {} }
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const col = n => cols.find(c => c.name === n);
const vr = (c, n) => vars.find(v => v.name === n && v.variableCollectionId === col(c).id);
const styles = await figma.getLocalTextStylesAsync();
const ts = n => styles.find(s => s.name === n);
const paint = n => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', vr('Color', n));
const SP = { 4: 'sp-1', 8: 'sp-2', 12: 'sp-3', 16: 'sp-4', 24: 'sp-6', 32: 'sp-8', 48: 'sp-12', 64: 'sp-16', 96: 'sp-24', 128: 'sp-32' };
const num = (node, field, value) => { node[field] = value; if (SP[value]) node.setBoundVariable(field, vr('Spacing', SP[value])); };
async function T(chars, style, color, name, w) { const t = figma.createText(); await t.setTextStyleIdAsync(ts(style).id); t.characters = chars; t.fills = [paint(color)]; t.name = name || chars.slice(0, 24); if (w) { t.resize(w, t.height); t.textAutoResize = 'HEIGHT'; } return t; }
const AL = (dir, name, parent) => { const f = figma.createAutoLayout(dir); f.fills = []; f.name = name; if (parent) parent.appendChild(f); return f; };
const fixW = (f, w) => { f.resize(w, Math.max(f.height, 1)); if (f.layoutMode === 'VERTICAL') { f.counterAxisSizingMode = 'FIXED'; f.primaryAxisSizingMode = 'AUTO'; } else { f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'AUTO'; } };
const gutters = f => { f.paddingLeft = f.paddingRight = 56; f.setBoundVariable('paddingLeft', vr('Layout', 'gutter-desktop')); f.setBoundVariable('paddingRight', vr('Layout', 'gutter-desktop')); };
const setText = (inst, name, v) => { const t = inst.findOne(n => n.type === 'TEXT' && n.name === name); if (t) t.characters = v; return t; };
const get = id => figma.getNodeByIdAsync(id);
const variant = async (setId, name) => (await get(setId)).children.find(v => v.name === name);
const cap = s => s.charAt(0) + s.slice(1).toLowerCase();
const joinRuns = runs => runs.map(r => typeof r === 'string' ? r : r[0]).join('');
// run flags: e = <em> (Baskerville italic), s = <strong>, l = link (blue, underlined), c = <code>
function applyRuns(t, runs, base) { let i = 0; for (const r of runs) { const s = typeof r === 'string' ? r : r[0], f = typeof r === 'string' ? '' : r[1], e = i + s.length; if (f && e > i) { if (f.includes('s')) t.setRangeFontName(i, e, { family: 'Inter', style: 'Bold' }); if (f.includes('e')) t.setRangeFontName(i, e, { family: 'Libre Baskerville', style: 'Italic' }); if (f.includes('l')) { t.setRangeFills(i, e, [paint('brand/blue')]); t.setRangeTextDecoration(i, e, 'UNDERLINE'); } if (f.includes('c') && mono) { t.setRangeFontName(i, e, { family: mono, style: 'Regular' }); t.setRangeFontSize(i, e, Math.round(base * 9) / 10); } } i = e; } }
async function R(runs, style, color, name, w) { const t = await T(joinRuns(runs), style, color, name, w); applyRuns(t, runs, ts(style).fontSize); return t; }
// component / variant IDs: see state.json
const K = { header: await variant('7:35', 'Device=Desktop'), footer: await variant('7:57', 'Device=Desktop'), back: await get('6:80'), tag: await get('6:65'), metaText: await variant('7:105', 'Kind=Text'), metaFig: await variant('7:105', 'Kind=Figure'), sec: await get('7:109'), quote: await get('7:114'), credits: await get('7:122'), next: await get('7:128') };
// measured at 1440: col 4 start, cols 4–10, cols 4–12, cols 4–7, 65ch at 17px, 65ch at 14px
const OFF = 339.2, READ = 762.7, WIDE = 988.8, NARROW = 423.5, PW = 697.1, CAPW = 574.1, GAP = 28.8;
const gapBind = f => { f.itemSpacing = GAP; f.setBoundVariable('itemSpacing', vr('Layout', 'gap-desktop')); };
const rule = (f, w) => { f.strokes = [paint('line/rule')]; f.strokeAlign = 'INSIDE'; f.strokeTopWeight = w; f.strokeBottomWeight = f.strokeLeftWeight = f.strokeRightWeight = 0; };
function cell(name, left, top, bottom, w) { const c = AL('VERTICAL', name); c.paddingLeft = left; num(c, 'paddingTop', top); num(c, 'paddingBottom', bottom); if (w) fixW(c, w); return c; }
function image(hash, iw, ih, w) { const r = figma.createRectangle(); r.name = 'Image'; r.resize(w, Math.round(w * ih / iw * 100) / 100); r.fills = [paint('bg/surface'), { type: 'IMAGE', imageHash: hash, scaleMode: 'FILL' }]; return r; }
// top/bottom paddings = the CSS margins of each block (grid items: margins never collapse)
async function block(b, beside, afterH2) {
  const L = beside ? 0 : OFF, top = t => afterH2 ? 82 : t, k = b[0];
  if (k === 'p') { const c = cell('Paragraph', L, top(0), 24, L + READ); c.appendChild(await R(b[1], 'Body', 'text/ink', 'Text', PW)); return c; }
  if (k === 'h3') { const c = cell('Subhead — ' + b[1], L, top(24), 12, L + READ); c.appendChild(await T(b[1], 'Subhead', 'text/ink', 'Text', READ)); return c; }
  if (k === 'quote') { const c = cell('Pull quote', L, top(24), 48); const q = K.quote.createInstance(); c.appendChild(q); setText(q, 'Quote', b[1]); return c; }
  if (k === 'credits') { const c = cell('Credits', L, top(48), 24); const q = K.credits.createInstance(); c.appendChild(q); const t = setText(q, 'Body', joinRuns(b[1])); applyRuns(t, b[1], 14); return c; }
  if (k === 'figs') { const c = cell('Figures', L, top(24), 48); const row = AL('HORIZONTAL', 'Meta row', c); fixW(row, WIDE); gapBind(row); row.paddingTop = 17; rule(row, 1); for (const [l, v] of b[1]) { const m = K.metaFig.createInstance(); row.appendChild(m); setText(m, 'Label', cap(l)); setText(m, 'Value', v); } return c; }
  if (k === 'fig') { const [, kind, hash, iw, ih, capRuns] = b; const w = kind === 'full' ? 1328 : kind === 'offset' ? WIDE : NARROW; const c = cell(`Figure (${kind})`, kind === 'full' ? 0 : L, top(48), 48); c.appendChild(image(hash, iw, ih, w)); if (capRuns) { const cw = AL('VERTICAL', 'Caption', c); cw.paddingTop = 12; num(cw, 'paddingBottom', 24); cw.appendChild(await R(capRuns, 'Small', 'text/ink-2', 'Caption', Math.min(CAPW, w))); } return c; }
  throw new Error('unknown block ' + k);
}
async function buildCase(C, X, Y) {
  const nm = `Case — ${C.name} — Desktop 1440`; const ex = page.findOne(n => n.type === 'FRAME' && n.name === nm); if (ex) return { skipped: nm, id: ex.id };
  const pg = AL('VERTICAL', nm); pg.fills = [paint('bg/paper')]; fixW(pg, 1440); pg.clipsContent = true; pg.x = X; pg.y = Y;
  const hdr = K.header.createInstance(); pg.appendChild(hdr); hdr.layoutSizingHorizontal = 'FILL'; hdr.findOne(n => n.type === 'INSTANCE' && n.name === 'Work').setProperties({ State: 'Current' });
  const hero = AL('VERTICAL', 'Case hero', pg); hero.layoutSizingHorizontal = 'FILL'; num(hero, 'paddingTop', 48); num(hero, 'paddingBottom', 64); gutters(hero); num(hero, 'itemSpacing', 48);
  const bk = K.back.createInstance(); hero.appendChild(bk); setText(bk, 'Label', C.hero.back);
  const mid = AL('VERTICAL', 'Intro', hero); mid.layoutSizingHorizontal = 'FILL'; num(mid, 'itemSpacing', 24);
  const tags = AL('HORIZONTAL', 'Tags', mid); num(tags, 'itemSpacing', 8); for (const tg of C.hero.tags) { const i = K.tag.createInstance(); tags.appendChild(i); setText(i, 'Label', tg); }
  mid.appendChild(await T(C.hero.title, 'Heading 1', 'brand/blue', 'Title', 839));
  mid.appendChild(await R(C.hero.desc, 'Lead', 'text/ink', 'Description', 632.3));
  const meta = AL('HORIZONTAL', 'Meta row', hero); meta.layoutSizingHorizontal = 'FILL'; gapBind(meta); meta.paddingTop = 17; rule(meta, 1);
  for (const [l, v, link] of C.hero.meta) { const m = K.metaText.createInstance(); meta.appendChild(m); setText(m, 'Label', cap(l)); const t = setText(m, 'Value', v); if (link) { t.fills = [paint('brand/blue')]; t.textDecoration = 'UNDERLINE'; } }
  if (C.heroImg) { const [h, iw, ih] = C.heroImg; const w = AL('VERTICAL', 'Hero image', pg); num(w, 'paddingBottom', 32); w.appendChild(image(h, iw, ih, 1440)); }
  const body = AL('VERTICAL', 'Case body', pg); body.layoutSizingHorizontal = 'FILL'; num(body, 'paddingTop', 32); num(body, 'paddingBottom', 64); gutters(body);
  const B = C.body; let i = 0;
  while (i < B.length) { const b = B[i];
    if (b[0] === 'h2') { const row = AL('HORIZONTAL', 'Section — ' + b[1], body); gapBind(row); const hc = cell('Heading', 0, 64, 0); row.appendChild(hc); const sh = K.sec.createInstance(); hc.appendChild(sh); setText(sh, 'Title', b[1]);
      const nx = B[i + 1]; if (nx && nx[0] !== 'h2' && !(nx[0] === 'fig' && nx[1] === 'full')) { row.appendChild(await block(nx, true, true)); i += 2; } else if (nx && nx[0] === 'fig') { body.appendChild(await block(nx, false, true)); i += 2; } else i += 1; continue; }
    body.appendChild(await block(b, false, false)); i++; }
  const nw = AL('VERTICAL', 'Next', pg); nw.layoutSizingHorizontal = 'FILL'; gutters(nw); const nx = K.next.createInstance(); nw.appendChild(nx); nx.layoutSizingHorizontal = 'FILL'; setText(nx, 'Label', cap(C.nextLabel)); setText(nx, 'Title', C.next);
  const ft = K.footer.createInstance(); pg.appendChild(ft); ft.layoutSizingHorizontal = 'FILL';
  return { name: nm, id: pg.id, h: Math.round(pg.height) };
}
const CASES = __CASES__;
const XS = __X__;
const res = [];
for (const [i, C] of CASES.entries()) res.push(await buildCase(C, XS[i], 3800));
return { res, mono };
