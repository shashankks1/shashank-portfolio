# Figma ↔ site

The portfolio is designed in Figma and built in code. Shashank art-directs in the file; Claude carries each change into the code, checks it against the frame and publishes.

**File:** SKS Portfolio, https://www.figma.com/design/l3cjfMaYeZYDqMcuOF3zdE. Built 2026-10-14 in Vistofy's Figma account (team UI UX (Product)). Duplicate it into the personal account when convenient; the file key in `state.json` then changes.

| Page | Holds |
|---|---|
| Website (0:1) | Home and About at 1440 and 390; the six case studies at 1440. Two sections. |
| Components (2:2) | 21 components in the `Components` frame (6:14), plus the `Image library` section (4:2): every site image at its own proportion. |
| Foundations (2:3) | Variables (Primitives, Color, Spacing, Radius, Stroke, Layout), 26 text styles, specimen sheet (3:2). |
| Notes (2:4) | How the file works, for the person directing it. |

Node IDs for every component, variant and frame are in `state.json`. Read it before writing to the file.

## The sync loop ("sync home", "sync copo", "sync tokens" …)

1. **Read the frame.** Use `get_design_context` / `get_metadata` on the frame or component, and `get_variable_defs` for tokens.
2. **Change the code.**

   | What changed in Figma | Code to edit |
   |---|---|
   | Variables | `website/CSS/tokens.css`. Each variable's WEB code syntax names its CSS property. |
   | Text styles | The type roles in `base.css`, plus component rules. Each style description gives the CSS. |
   | Fluid sizes (Heading 1/2, Lead, Statement, Lede serif, Figure, Lead Link) | The style holds the size a 1440 screen renders. Keep the clamp's min, set vw = new size ÷ 14.4, and raise the max by the same ratio. |
   | Components | `components.css`, `nav.css`, `home.css`, `case-study.css`, `about.css` (named in each description). |
   | Home / About frames | `tools/pages/home-main.html` / `about-main.html`, then `node tools/reshell.mjs`. |
   | Collage pieces | A piece's left, top, width and rotation become `--x --y --w --r`, as percentages of the 1328 × 664 collage. |
   | Case frames | `website/work/<slug>.html`. |

3. **Check it.** Run `get_screenshot` with maxDimension equal to the frame height, curl the image into `out/`, then run `node compare.mjs <page> out/<figma.png> 1440 y0 y1`. Read the side-by-side, and fix until the two match.
4. **Publish.** Commit to main, refresh the preview (`tools/publish-preview.sh`), and report back with the link and anything that couldn't be carried over.

Going the other way (code → Figma), after a code-side change:
- **Case studies:** run `node extract.mjs <slug>`. Delete the old frame, then paste `case-builder.js` as the `use_figma` code with `__CASES__` set to the payload and `__X__` to the x position.
- **Home / About:** edit the frames directly. Their builders were one-off scripts and live in the session transcript only.

## Scripts (run from this folder)

| Script | What it does |
|---|---|
| `extract.mjs [slug…]` | Reads the live case pages and writes `out/case-<slug>.json`: blocks, inline styling, image hashes and pixel sizes. |
| `case-builder.js` | `use_figma` body that builds case frames from those payloads out of components. It mirrors the CSS grid at 1440. |
| `upload-images.mjs <uuids.txt> <img…>` | Converts site images to JPEG/PNG (WebP doesn't render when uploaded this way), posts them to `upload_assets` URLs and records the hashes. |
| `compare.mjs <page> <figma.png> [w] [y0] [y1]` | Screenshots the live page and puts it beside the Figma render; prints both heights. |
| `image-hashes.json` | Path under `website/assets/images/` → Figma imageHash. |
| `state.json` | File key, page / component / frame IDs, layout measurements, build log. |

Uses `sharp` from `D:\VISTOFY\60-Tools` and `puppeteer-core` from `D:\VISTOFY\60-Tools\code-to-figma`, as the other tools here do. `out/` is git-ignored.

## Known differences

- Index rows are about 1.4px taller in Figma (baseline alignment), so Home runs about 4px longer.
- Phone About's career list differs by a few px per row (an inline line-box quirk in the CSS).
- `<code>` runs use Roboto Mono in Figma; the browser uses its default monospace.
- Phone case studies aren't drawn. The CSS folds the ledger into one column under 900px.
