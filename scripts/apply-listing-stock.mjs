import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { STOCK } from "./fetch-listing-stock.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "lib/demo-circle-catalog.ts",
  "lib/family-catalog.ts",
  "lib/mock-data.ts",
];

function newPath(id) {
  return `/listings/${STOCK[id].file}.jpg`;
}

function rewrite(text) {
  let out = text;
  for (const id of Object.keys(STOCK)) {
    out = out.replaceAll(`/listings/${id}.jpg`, newPath(id));
  }
  return out;
}

function remapSrc(src) {
  if (typeof src !== "string") return src;
  const value = src.trim();
  if (STOCK[value.replace(/^\/listings\//, "").replace(/\.jpe?g$/i, "")]) {
    const id = value.replace(/^\/listings\//, "").replace(/\.jpe?g$/i, "");
    return newPath(id);
  }
  const match = value.match(/(photo-[0-9a-zA-Z-]+)/);
  if (match?.[1] && STOCK[match[1]]) return newPath(match[1]);
  return value;
}

const mapEntries = Object.entries(STOCK)
  .map(([id, { file }]) => `  "${id}": "${file}",`)
  .join("\n");

const listingPhoto = `/** Unsplash photo id in a leftover URL → local Commons-hosted stock file. */
const UNSPLASH_PHOTO =
  /(?:https?:\\/\\/)?images\\.unsplash\\.com\\/(photo-[0-9a-zA-Z-]+)/i;
const LOCAL_PHOTO = /\\/listings\\/(photo-[0-9a-zA-Z-]+)\\.jpe?g$/i;

const FROM_UNSPLASH: Record<string, string> = {
${mapEntries}
};

const STOCK = /^\\/listings\\/[a-zA-Z0-9._-]+\\.jpe?g$/i;
const UPLOAD = /^\\/api\\/uploads\\/[a-zA-Z0-9._-]+\\.jpe?g$/i;

/** Max JPEG bytes after compress, written to app disk. */
export const LISTING_PHOTO_MAX_BYTES = 900_000;

export function listingStockPath(photoId: string): string {
  const id = photoId.startsWith("photo-") ? photoId : \`photo-\${photoId}\`;
  const file = FROM_UNSPLASH[id] || id;
  return \`/listings/\${file}.jpg\`;
}

/** Browser never hits Unsplash — stock photos are served from /public/listings. */
export function localListingSrc(src: string): string {
  const value = src.trim();
  const match = value.match(UNSPLASH_PHOTO) || value.match(LOCAL_PHOTO);
  if (!match?.[1]) return value;
  return listingStockPath(match[1]);
}

export function localListingSrcs(srcs: string[]): string[] {
  return srcs.map(localListingSrc);
}

/** Paths we persist: app storage, demo stock, emoji, or legacy data-URL. Never remote CDNs. */
export function isAllowedListingImage(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^https?:\\/\\//i.test(v)) return false;
  if (STOCK.test(v) || UPLOAD.test(v)) return true;
  if (v.startsWith("data:image/jpeg") || v.startsWith("data:image/webp")) {
    return v.length < 2_000_000;
  }
  return v.length <= 16 && !v.includes("/");
}
`;

async function main() {
  for (const rel of FILES) {
    const full = path.join(ROOT, rel);
    const before = await readFile(full, "utf8");
    const after = rewrite(before);
    if (after === before) console.log("unchanged", rel);
    else {
      await writeFile(full, after);
      console.log("rewrote", rel);
    }
  }

  await writeFile(path.join(ROOT, "lib/listing-photo.ts"), listingPhoto);
  console.log("wrote lib/listing-photo.ts");

  const prisma = new PrismaClient();
  const rows = await prisma.marketListing.findMany({
    select: { id: true, image: true, images: true },
  });
  let updated = 0;
  for (const row of rows) {
    const image = remapSrc(row.image);
    const images = row.images.map(remapSrc);
    if (image === row.image && JSON.stringify(images) === JSON.stringify(row.images)) {
      continue;
    }
    await prisma.marketListing.update({
      where: { id: row.id },
      data: { image, images },
    });
    updated += 1;
  }
  await prisma.$disconnect();
  console.log("db updated", updated, "of", rows.length);

  const dir = path.join(ROOT, "public/listings");
  const names = await readdir(dir);
  let removed = 0;
  for (const name of names) {
    if (!name.startsWith("photo-") || !name.endsWith(".jpg")) continue;
    await unlink(path.join(dir, name));
    removed += 1;
  }
  console.log("removed old unsplash files", removed);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
