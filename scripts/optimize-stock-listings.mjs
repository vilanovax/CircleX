/**
 * Re-encode public/listings/*.jpg to PHOTO_MAX_EDGE + PHOTO_MAX_BYTES.
 * Keeps filenames so DB / seed paths stay valid.
 *
 *   node scripts/optimize-stock-listings.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const EDGE = 960;
const MAX_BYTES = 280_000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "..", "public", "listings");

async function encodeOne(file) {
  const body = await fs.readFile(file);
  let edge = EDGE;
  let quality = 80;
  let last = null;
  for (let pass = 0; pass < 12; pass++) {
    last = await sharp(body, { failOn: "none", sequentialRead: true })
      .rotate()
      .resize(edge, edge, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (last.length <= MAX_BYTES) break;
    if (quality > 58) quality -= 6;
    else {
      edge = Math.max(480, Math.round(edge * 0.85));
      quality = 76;
    }
  }
  if (!last) throw new Error(`encode failed: ${file}`);
  if (last.length >= body.length * 0.98) {
    return { skipped: true, before: body.length, after: body.length };
  }
  await fs.writeFile(file, last);
  return { skipped: false, before: body.length, after: last.length };
}

const names = (await fs.readdir(DIR)).filter((n) => /\.jpe?g$/i.test(n));
let saved = 0;
let beforeAll = 0;
let afterAll = 0;
for (const name of names) {
  const file = path.join(DIR, name);
  const r = await encodeOne(file);
  beforeAll += r.before;
  afterAll += r.after;
  if (!r.skipped) {
    saved += r.before - r.after;
    console.log(
      `${name}: ${(r.before / 1024).toFixed(0)}KB → ${(r.after / 1024).toFixed(0)}KB`,
    );
  }
}
console.log(
  `\n${names.length} files · ${(beforeAll / 1024 / 1024).toFixed(1)}MB → ${(afterAll / 1024 / 1024).toFixed(1)}MB (−${(saved / 1024 / 1024).toFixed(1)}MB)`,
);
