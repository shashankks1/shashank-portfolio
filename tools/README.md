# Portfolio tools

Scripts that built the case-study images and checked the pages (2026-10-12). They sit outside `website/`, so they never deploy. Run them from this folder.

They borrow libraries from the Vistofy tools: `sharp` from `D:\VISTOFY\60-Tools\node_modules`, and `puppeteer-core` from `D:\VISTOFY\60-Tools\code-to-figma\node_modules`. Chrome is used from `C:\Program Files\Google\Chrome`. `pdfpages.mjs` loads pdf.js from cdnjs, so it needs internet access.

| Script | What it does |
|---|---|
| `build-images.mjs` | Builds every WebP in `website/assets/images/<project>/`. Re-runnable. Needs the intermediates below first. |
| `pdfpages.mjs <pdf> <prefix> <pages> [scale]` | Renders PDF pages to PNG (pdf.js in headless Chrome). |
| `grab.mjs <html> <width> '<json>'` | Takes 2× screenshots of elements, e.g. panels from the Vistofy logo explainer. |
| `overlay.mjs <in> <out> [size]` | Draws the 3×3 logo/footer rule over a festival template. |
| `sheet.mjs <out> <cols> <cell> <files…>` | Makes a labelled contact sheet for picking images. |
| `shot.mjs <html> <out> [w] [h]` | Takes a full-page screenshot. |
| `assemble.mjs` + `pages/_head.html`, `_foot.html` | Wraps a case-study body in the shared nav and footer. The `vistofy` flag adds `noindex` and the do-not-deploy comment. |

## Rebuilding the intermediates (`grabs/`, `hi/`, `ov/`)

```
mkdir grabs hi ov
node grab.mjs D:/VISTOFY/20-Brand/LOGO/vistofy-logo-explained.html 1100 '[{"page":5,"sel":".stage","out":"grabs/old-logo.png"},{"page":6,"sel":".test","i":0,"out":"grabs/test-stamp.png"},{"page":6,"sel":".test","i":1,"out":"grabs/test-photocopy.png"},{"page":6,"sel":".test","i":2,"out":"grabs/test-tab.png"},{"page":7,"sel":".stage","out":"grabs/new-logo.png"},{"page":8,"sel":".grid2","i":0,"out":"grabs/gap-vs-colour.png"},{"page":10,"sel":".grid2","i":0,"out":"grabs/where-digital.png"},{"page":11,"sel":".grid2","i":0,"out":"grabs/where-physical.png"},{"sel":".page","i":0,"out":"grabs/exp-p0.png"}]'
node pdfpages.mjs "D:/PORTFOLIO/assets/portfolio-latest/Learnet/Case study presentation.pdf" hi/learnet 5,6,7,10,14,15,16,17,18 2.5
node pdfpages.mjs "D:/CREATIVE/Explorations/EXPLORATIONS-WORKS/WORK/COPO BRANDING/DRAFT/COLLATERALS/Logo manual.pdf" hi/copo-manual 3-14 2
node pdfpages.mjs "D:/CREATIVE/Explorations/EXPLORATIONS-WORKS/WORK/COPO BRANDING/DRAFT/ASSETS/COPO - LOGO OPTIONS..pdf" hi/copo-options all 2
node pdfpages.mjs "D:/CREATIVE/Explorations/EXPLORATIONS-WORKS/WORK/COPO BRANDING/DRAFT/FINAL DELIVERABLES/LOGO FINAL.pdf" hi/copo-final all 2
node pdfpages.mjs "D:/CREATIVE/Explorations/EXPLORATIONS-WORKS/WORK/COPO BRANDING/DRAFT/ASSETS/1x/Banner copy.pdf" hi/copo-banner all 1
node grab.mjs copo-palette.html 1180 '[{"sel":".board","out":"grabs/copo-palette.png"}]'
# White out the owner's name on the manual's sample letter (page 10) -> hi/copo-manual-10r.png:
node -e "const s=require('module').createRequire('D:/VISTOFY/60-Tools/package.json')('sharp');s('hi/copo-manual-10.png').composite([{input:Buffer.from('<svg width=\"240\" height=\"80\"><rect width=\"240\" height=\"80\" fill=\"#fff\"/></svg>'),left:205,top:1022}]).toFile('hi/copo-manual-10r.png')"
node build-images.mjs
```

Privacy rules baked in:
- Learnet research pages are cropped so no participant names show.
- COPO manual page 10 has the owner's name whited out. Page 11 (her phone and email) is never used.
- The COPO Instagram mockup is not used, because its post grid shows real customers.
- `pdftext.mjs <pdf>` prints a PDF's text, which is how the COPO rationale (the Kopou story, the neon options) was read.

The Learnet research pages are cropped 500 px from the left on purpose, because that column quotes real participants by name.
