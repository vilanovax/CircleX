/** Shared photo standard for Circle — encode once, display at real UI slots. */

/**
 * CSS display slots (1×). Components pass these into next/image `sizes`
 * so the optimizer serves ~1×/2× only — never a full camera file for a thumb.
 */
export const PHOTO_SLOT = {
  /** Feed card cover (`ListingImage` md). */
  listingMd: 96,
  /** Compact card / request row. */
  listingSm: 56,
  /** Tiny chip / nav. */
  listingLg: 48,
  /** Detail gallery width on phone shell (~480 CSS). */
  listingHero: 480,
  /** Chat bubble photo max width. */
  chat: 320,
  avatarSm: 32,
  avatarProfile: 44,
  avatarMd: 48,
  avatarLg: 64,
} as const;

/**
 * Longest edge written to disk (uploads + stock).
 * 2× listingHero — enough for retina detail, nothing larger.
 */
export const PHOTO_MAX_EDGE = 960;

/** JPEG bytes after encode (uploads). */
export const PHOTO_MAX_BYTES = 280_000;

/** Raw camera / HEIC before client or server encode. */
export const PHOTO_UPLOAD_MAX_BYTES = 12_000_000;

export const LISTING_PHOTO_MAX_COUNT = 5;

export const UPLOAD_PATH_RE = /^\/api\/uploads\/[a-zA-Z0-9._-]+\.jpe?g$/i;

/** Max length for persisted photo URLs (object storage HTTPS). */
export const PHOTO_URL_MAX_LEN = 512;

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Public base URL of the media bucket (client-safe). */
export function mediaPublicBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim() || "";
  if (!raw) return "";
  try {
    const withScheme = raw.includes("://") ? raw : `https://${raw}`;
    return trimSlash(withScheme);
  } catch {
    return "";
  }
}

export function mediaPublicHost(): string {
  const base = mediaPublicBaseUrl();
  if (!base) return "";
  try {
    return new URL(base).host;
  } catch {
    return "";
  }
}

/** True for JPEG objects on our configured media host. */
export function isMediaObjectUrl(value: string): boolean {
  const host = mediaPublicHost();
  if (!host) return false;
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return false;
  try {
    const url = new URL(v);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (url.host !== host) return false;
    const path = url.pathname.replace(/^\/+/, "");
    return /^[a-zA-Z0-9._/-]+\.jpe?g$/i.test(path);
  } catch {
    return false;
  }
}

/** Paths / URLs next/image may optimize. Accepts with or without basePath. */
export function isOptimizablePhotoSrc(src: string): boolean {
  let s = src.trim();
  if (!s || s.startsWith("data:")) return false;
  if (/^https?:\/\//i.test(s)) return isMediaObjectUrl(s);
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (base && (s === base || s.startsWith(`${base}/`))) {
    s = s === base ? "/" : s.slice(base.length) || "/";
  }
  return (
    s.startsWith("/listings/") ||
    s.startsWith("/avatars/") ||
    s.startsWith("/api/uploads/")
  );
}
