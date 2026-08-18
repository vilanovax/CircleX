import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { LISTING_PHOTO_MAX_BYTES } from "@/lib/listing-photo";

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

function isJpeg(buf: Buffer): boolean {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

export async function saveListingJpeg(
  body: Buffer,
  userId: string,
): Promise<{ filename: string; url: string }> {
  if (body.length > LISTING_PHOTO_MAX_BYTES) {
    throw new Error("عکس خیلی بزرگ است");
  }
  if (!isJpeg(body)) {
    throw new Error("فقط عکس JPEG مجاز است");
  }
  const prefix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "user";
  const filename = `${prefix}-${randomUUID()}.jpg`;
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), body);
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
