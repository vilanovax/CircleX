import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  PHOTO_MAX_BYTES,
  PHOTO_MAX_EDGE,
  PHOTO_UPLOAD_MAX_BYTES,
} from "@/lib/media";

const FILE_RE = /^[a-zA-Z0-9._-]+\.jpe?g$/i;

export function uploadDir(): string {
  return process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "uploads");
}

export function uploadPublicPath(filename: string): string {
  return `/api/uploads/${filename}`;
}

export function safeUploadName(name: string): string | null {
  const base = path.basename(name);
  return FILE_RE.test(base) ? base : null;
}

/** Decode any supported raster, then write a sized JPEG under PHOTO_MAX_BYTES. */
export async function encodeUserJpeg(body: Buffer): Promise<Buffer> {
  if (body.length > PHOTO_UPLOAD_MAX_BYTES) {
    throw new Error("عکس خیلی بزرگ است");
  }
  if (body.length < 24) {
    throw new Error("فقط فایل تصویری مجاز است");
  }

  let edge = PHOTO_MAX_EDGE;
  let quality = 82;
  let last: Buffer | null = null;

  try {
    for (let pass = 0; pass < 10; pass++) {
      last = await sharp(body, { failOn: "none", sequentialRead: true })
        .rotate()
        .resize(edge, edge, { fit: "inside", withoutEnlargement: true })
        .ensureAlpha()
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      if (last.length <= PHOTO_MAX_BYTES) return last;
      if (quality > 56) quality -= 8;
      else {
        edge = Math.max(480, Math.round(edge * 0.75));
        quality = 78;
      }
    }
  } catch {
    throw new Error("خواندن عکس ممکن نشد. JPEG یا PNG بفرست.");
  }

  throw new Error("عکس بعد از فشرده‌سازی هنوز بزرگ است");
}

export async function saveListingJpeg(
  body: Buffer,
  userId: string,
): Promise<{ filename: string; url: string }> {
  const jpeg = await encodeUserJpeg(body);
  const prefix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "user";
  const filename = `${prefix}-${randomUUID()}.jpg`;
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), jpeg);
  return { filename, url: uploadPublicPath(filename) };
}

export async function readListingJpeg(
  filename: string,
): Promise<Buffer | null> {
  const safe = safeUploadName(filename);
  if (!safe) return null;
  try {
    return await readFile(path.join(uploadDir(), safe));
  } catch {
    return null;
  }
}
