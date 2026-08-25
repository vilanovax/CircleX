import { localListingSrc } from "./listing-photo";
import { PHOTO_MAX_BYTES } from "./media";

export { PHOTO_MAX_BYTES as LISTING_PHOTO_MAX_BYTES };
export {
  processUserPhoto as processListingPhotoBlob,
  uploadUserPhoto as uploadListingPhoto,
} from "./media-image";

const PHOTO_PREFIXES = ["data:image/", "http://", "https://", "/"];

/** True when `image` is a photo URL or data URL (not an emoji placeholder). */
export function isListingPhoto(image: string): boolean {
  const v = image.trim();
  return PHOTO_PREFIXES.some((p) => v.startsWith(p));
}

/** Gallery slides for detail — prefers `images`, else cover `image`. */
export function listingGalleryImages(listing: {
  image: string;
  images?: string[];
}): string[] {
  const raw =
    listing.images && listing.images.length > 0
      ? listing.images
      : [listing.image];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const src of raw) {
    const v = src?.trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(localListingSrc(v));
  }
  return out.length > 0 ? out : [listing.image];
}

/** Category / type tint for emoji placeholders. */
export function listingImageTint(
  category?: string,
  type?: string,
): string {
  const c = (category ?? "").toLowerCase();
  if (/خانه|مبل|لوازم/.test(c)) {
    return "from-amber-50 to-zinc-100 dark:from-amber-500/10 dark:to-zinc-800";
  }
  if (/آموزش|خدمات/.test(c) || type === "service") {
    return "from-brand-50 to-zinc-100 dark:from-brand-500/10 dark:to-zinc-800";
  }
  if (/ورزش|خودرو|دوچرخه/.test(c)) {
    return "from-sky-50 to-zinc-100 dark:from-sky-500/10 dark:to-zinc-800";
  }
  if (type === "donation") {
    return "from-green-50 to-zinc-100 dark:from-green-500/10 dark:to-zinc-800";
  }
  return "from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900";
}
