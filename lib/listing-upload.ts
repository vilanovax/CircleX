import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  PHOTO_MAX_BYTES,
  PHOTO_MAX_EDGE,
  PHOTO_UPLOAD_MAX_BYTES,
} from "@/lib/media";
import {
  isObjectStorageConfigured,
  putPublicJpeg,
} from "@/lib/object-storage";

const FILE_RE = /^[a-zA-Z0-9._-]+\.jpe?g$/i;

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

function objectKeyForUser(userId: string): string {
  const prefix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "user";
  return `uploads/${prefix}-${randomUUID()}.jpg`;
}

/**
 * Resize/encode then store on object storage only.
 * Returns a public HTTPS URL — nothing is written under the app disk.
 */
export async function saveListingJpeg(
  body: Buffer,
  userId: string,
): Promise<{ filename: string; url: string }> {
  if (!isObjectStorageConfigured()) {
    throw new Error("فضای ابری پیکربندی نشده است");
  }
  const jpeg = await encodeUserJpeg(body);
  const key = objectKeyForUser(userId);
  const url = await putPublicJpeg(key, jpeg);
  return { filename: key.split("/").pop() || key, url };
}

export function safeUploadName(name: string): string | null {
  const base = name.split("/").pop() || name;
  return FILE_RE.test(base) ? base : null;
}
