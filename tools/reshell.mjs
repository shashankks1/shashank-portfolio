// Apply the v3 site shell (fonts, header, footer) to every page, keeping each page's <main>.
// Also rebuilds the Home and About <main> from tools/pages/*-main.html (mark + thread filled in).
// usage: node tools/reshell.mjs        (run from the repo root; safe to re-run)
import fs from 'node:fs';
import path from 'node:path';
import { mark, thread, threadList } from './sks.mjs';

const SITE = path.resolve('website');
const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">';
const MARK52 = mark(52, 'Shashank Kumar Sinha').replace('role="img" aria-label="Shashank Kumar Sinha"', 'aria-hidden="true"');

const header = (p, current) => `  <!-- ── HEADER ── -->
  <header class="site-header">
    <div class="container site-header-inner">
      <a href="${p}index.html" class="brand" aria-label="Shashank Kumar Sinha — home">
        ${MARK52}
      </a>
      <nav class="site-nav" aria-label="Main">
        <ul class="nav-links">
          <li><a href="${p}index.html#work"${current === 'work' ? ' aria-current="page"' : ''}>Work</a></li>
          <li><a href="${p}about.html"${current === 'about' ? ' aria-current="page"' : ''}>About</a></li>
          <li><a href="${p}index.html#contact">Contact</a></li>
        </ul>
      </nav>
      <p class="site-status"><span class="dot" aria-hidden="true"></span>Open to roles</p>
    </div>
  </header>`;

const footer = p => `  <!-- ── FOOTER ── -->
  <footer class="site-footer">
    <div class="container site-footer-inner">
      <a href="${p}index.html" class="brand" aria-label="Home">${MARK52}<span>© 2026 Shashank Kumar Sinha</span></a>
      <div class="site-footer-links">
        <a href="mailto:sinha.shashank92@gmail.com">Email</a>
        <a href="${p}system.html">Design system</a>
        <a href="#top">Back to top</a>
      </div>
    </div>
  </footer>`;

function reshell(file, prefix, current, main) {
  let h = fs.readFileSync(file, 'utf8');
  h = h.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet">/, FONTS);
  h = h.replace(/<body[^>]*>/, '<body id="top">');
  h = h.replace(/[ \t]*<!-- ── (NAVIGATION|HEADER) ── -->\s*\n[\s\S]*?<\/(nav|header)>\n(?=\s*\n?\s*<main>)/, header(prefix, current) + '\n');
  h = h.replace(/[ \t]*<!-- ── FOOTER ── -->\s*\n\s*<footer[\s\S]*?<\/footer>/, footer(prefix));
  if (main) h = h.replace(/  <main>[\s\S]*?<\/main>\n/, main);
  // next-project arrows are drawn by CSS now
  h = h.replace(/(<p class="case-next-title">[^<]*?) →<\/p>/, '$1</p>');
  fs.writeFileSync(file, h);
  const ok = h.includes('class="site-header"') && h.includes('class="site-footer"') && !h.includes('{{');
  console.log(ok ? 'ok  ' : 'FAIL', path.relative(SITE, file));
}

const fill = f => fs.readFileSync(f, 'utf8')
  .replace('{{MARK400}}', mark(400, 'The SKS mark'))
  .replace('{{THREAD}}', thread())
  .replace('{{THREAD_LIST}}', threadList());

reshell(path.join(SITE, 'index.html'), '', '', fill('tools/pages/home-main.html'));
reshell(path.join(SITE, 'about.html'), '', 'about', fill('tools/pages/about-main.html'));
for (const f of fs.readdirSync(path.join(SITE, 'work'))) reshell(path.join(SITE, 'work', f), '../', 'work');

// keep the case-study assembly templates in step
const tpl = path.resolve('tools/pages/_head.html');
if (fs.existsSync(tpl)) {
  const t = fs.readFileSync(tpl, 'utf8').replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet">/, FONTS)
    .replace(/<body[^>]*>/, '<body id="top">')
    .replace(/[ \t]*<!-- ── (NAVIGATION|HEADER) ── -->\s*\n[\s\S]*?<\/(nav|header)>\n/, header('../', 'work') + '\n');
  fs.writeFileSync(tpl, t);
  fs.writeFileSync(path.resolve('tools/pages/_foot.html'), '\n' + footer('../') + '\n\n</body>\n</html>\n');
  console.log('ok   tools/pages templates');
}
