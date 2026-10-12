// Apply the v2 site shell (fonts, header, footer) to every page, keeping each page's <main>.
// usage: node tools/reshell.mjs        (run from the repo root; safe to re-run)
import fs from 'node:fs';
import path from 'node:path';

const SITE = path.resolve('website');
const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">';
const LOGO = fs.readFileSync(path.join(SITE, 'Asset/LOGO/Logo=52.svg'), 'utf8').match(/ d="([^"]+)"/)[1];

const header = (p, current) => `  <!-- ── HEADER ── -->
  <header class="site-header">
    <div class="container site-header-inner">
      <a href="${p}index.html" class="brand" aria-label="Shashank Kumar Sinha — home">
        <svg width="52" height="36" viewBox="0 0 52 36" aria-hidden="true"><path fill="currentColor" d="${LOGO}"/></svg>
        <span>Shashank Kumar Sinha</span>
      </a>
      <p class="site-header-role">Brand &amp; Product Designer · India</p>
      <nav class="site-nav" aria-label="Main">
        <ul class="nav-links">
          <li><a href="${p}index.html#work"${current === 'work' ? ' aria-current="page"' : ''}>Work</a></li>
          <li><a href="${p}about.html"${current === 'about' ? ' aria-current="page"' : ''}>About</a></li>
          <li><a href="${p}index.html#contact">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>`;

const footer = `  <!-- ── FOOTER ── -->
  <footer class="site-footer">
    <div class="container site-footer-inner">
      <span>© 2026 Shashank Kumar Sinha</span>
      <span>Set in Inter, Instrument Serif &amp; IBM Plex Mono</span>
      <a href="#top">Back to top ↑</a>
    </div>
  </footer>`;

function reshell(file, prefix, current) {
  let h = fs.readFileSync(file, 'utf8');
  h = h.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet">/, FONTS);
  h = h.replace(/<body[^>]*>/, '<body id="top">');
  // old nav (v1) or header (v2), with its comment line
  h = h.replace(/[ \t]*<!-- ── (NAVIGATION|HEADER) ── -->\s*\n[\s\S]*?<\/(nav|header)>\n(?=\s*\n?\s*<main>)/, header(prefix, current) + '\n');
  h = h.replace(/[ \t]*<!-- ── FOOTER ── -->\s*\n\s*<footer[\s\S]*?<\/footer>/, footer);
  fs.writeFileSync(file, h);
  const ok = h.includes('class="site-header"') && h.includes('class="site-footer"');
  console.log(ok ? 'ok  ' : 'FAIL', path.relative(SITE, file));
}

for (const f of ['index.html', 'about.html']) reshell(path.join(SITE, f), '', f === 'about.html' ? 'about' : '');
for (const f of fs.readdirSync(path.join(SITE, 'work'))) reshell(path.join(SITE, 'work', f), '../', 'work');
// keep the assembly template in step
const tpl = path.resolve('tools/pages/_head.html');
if (fs.existsSync(tpl)) {
  let t = fs.readFileSync(tpl, 'utf8').replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet">/, FONTS)
    .replace(/<body[^>]*>/, '<body id="top">')
    .replace(/[ \t]*<!-- ── (NAVIGATION|HEADER) ── -->\s*\n[\s\S]*?<\/(nav|header)>\n/, header('../', 'work') + '\n');
  fs.writeFileSync(tpl, t);
  fs.writeFileSync(path.resolve('tools/pages/_foot.html'), '\n' + footer + '\n\n</body>\n</html>\n');
  console.log('ok   tools/pages templates');
}
