// Stage the site for publishing as a claude.ai Artifact (for comment-based review).
// Copies every file the pages actually reference into <out>, and rewrites the home page
// for the Artifact skeleton (it is wrapped in its own <html>/<head>/<body> at publish time).
// usage: node tools/build-artifact.mjs <out-dir>        (run from the repo root)
import fs from 'node:fs';
import path from 'node:path';

const SITE = path.resolve('website');
const OUT = path.resolve(process.argv[2] || 'artifact-build');
fs.rmSync(OUT, { recursive: true, force: true });

const pages = ['index.html', 'about.html', 'system.html', ...fs.readdirSync(path.join(SITE, 'work')).map(f => `work/${f}`)];
const files = new Set(pages);
for (const p of pages) {
  const h = fs.readFileSync(path.join(SITE, p), 'utf8');
  for (const m of h.matchAll(/(?:href|src)="([^"#?]+)/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|data:)/.test(u)) continue;
    files.add(path.posix.normalize(path.posix.join(path.posix.dirname(p), decodeURI(u))));
  }
}
// stylesheets pull in their @imports, and the images they reference with url()
for (const f of [...files].filter(f => f.endsWith('.css'))) {
  const css = fs.readFileSync(path.join(SITE, f), 'utf8');
  for (const m of css.matchAll(/@import\s+'([^']+)'/g)) files.add(path.posix.join(path.posix.dirname(f), m[1]));
}
for (const f of [...files].filter(f => f.endsWith('.css'))) {
  const css = fs.readFileSync(path.join(SITE, f), 'utf8');
  for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    if (m[1].startsWith('data:')) continue;
    files.add(path.posix.normalize(path.posix.join(path.posix.dirname(f), m[1])));
  }
}

let bytes = 0;
for (const f of files) {
  const from = path.join(SITE, f), to = path.join(OUT, f);
  if (!fs.existsSync(from)) { console.error('missing', f); continue; }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  bytes += fs.statSync(from).size;
}

// Home page: drop the document wrapper the Artifact adds itself; title first.
let home = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
home = home
  .replace(/<!DOCTYPE html>\s*/i, '').replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*/i, '')
  .replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '')
  .replace(/\s*<meta charset="[^"]*" \/>/i, '').replace(/\s*<meta name="viewport"[^>]*\/>/i, '')
  .replace(/\s*<meta name="description"[^>]*\/>/i, '')
  .replace(/<title>[^<]*<\/title>\s*/i, '')
  .replace(/<body[^>]*>/i, '<span id="top"></span>').replace(/<\/body>\s*/i, '');
home = '<title>SKS Portfolio</title>\n' + home.trimStart();
fs.writeFileSync(path.join(OUT, 'index.html'), home);

const list = [...files].filter(f => f !== 'index.html' && fs.existsSync(path.join(SITE, f))).sort();
fs.writeFileSync(path.join(OUT, '_files.json'), JSON.stringify(list));
console.log(`staged ${files.size} files, ${(bytes / 1e6).toFixed(1)} MB → ${OUT}`);
console.log(list.join('\n'));
