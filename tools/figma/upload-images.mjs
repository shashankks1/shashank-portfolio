// Put site images into the Figma file. WebP sent through upload_assets does not render in Figma,
// so each image is converted to JPEG first (PNG when it has transparency).
// 1. Get upload URLs: upload_assets(count = N), with nodeIds when filling existing rectangles.
// 2. Save the returned UUIDs, one per line, in out/uuids.txt, in the same order as the images.
// 3. node upload-images.mjs out/uuids.txt <image path under website/assets/images …>
//    e.g. node upload-images.mjs out/uuids.txt copo/cover.webp learnet/sitemap.webp
// Records each image's new Figma imageHash in image-hashes.json.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const sharp = createRequire('D:/VISTOFY/60-Tools/package.json')('sharp');

const [uuidFile, ...imgs] = process.argv.slice(2);
const ids = fs.readFileSync(uuidFile, 'utf8').split(/\s+/).filter(Boolean);
if (ids.length !== imgs.length) throw new Error(`${ids.length} upload URLs for ${imgs.length} images`);
const SITE = path.resolve('../../website/assets/images');
const hashes = JSON.parse(fs.readFileSync('image-hashes.json', 'utf8'));

await Promise.all(imgs.map(async (p, i) => {
  const src = path.join(SITE, p);
  const alpha = (await sharp(src).metadata()).hasAlpha && !(await sharp(src).stats()).isOpaque;
  const buf = alpha
    ? await sharp(src).png({ compressionLevel: 9 }).toBuffer()
    : await sharp(src).flatten({ background: '#ECE8DF' }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: alpha ? 'image/png' : 'image/jpeg' }), path.basename(p).replace('.webp', alpha ? '.png' : '.jpg'));
  const r = await fetch(`https://mcp.figma.com/mcp/upload/${ids[i]}/submit?scaleMode=FILL`, { method: 'POST', body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.imageHash) { console.error('FAILED', p, r.status, JSON.stringify(j).slice(0, 160)); return; }
  hashes[p] = j.imageHash;
  console.log(p, '->', j.imageHash);
}));
fs.writeFileSync('image-hashes.json', JSON.stringify(hashes, null, 1));
