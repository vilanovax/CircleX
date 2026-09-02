/** Cap matches listing gallery limit in ListingImagePicker. */
export const LISTING_HANDOFF_MAX_PHOTOS = 5;

const HANDOFF_KEY = "circle.warehouse.listingHandoff";
const CLEANUP_KEY = "circle.warehouse.listingCleanup";

export type WarehouseListingHandoff = {
  urls: string[];
  photoIds: string[];
};

function parseStringList(raw: string | null, max: number): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      const v = item.trim();
      if (!v || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
      if (out.length >= max) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Stash optimized photo URLs (+ ids) for the next listing compose open. */
export function stashWarehousePhotosForListing(
  urls: string[],
  photoIds: string[] = [],
): void {
  if (typeof window === "undefined") return;
  const cleanedUrls = urls
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, LISTING_HANDOFF_MAX_PHOTOS);
  if (cleanedUrls.length === 0) return;
  const cleanedIds = photoIds
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, LISTING_HANDOFF_MAX_PHOTOS);
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(cleanedUrls));
    sessionStorage.setItem(
      CLEANUP_KEY,
      JSON.stringify({
        urls: cleanedUrls,
        photoIds: cleanedIds,
      } satisfies WarehouseListingHandoff),
    );
  } catch {
    /* ignore */
  }
}

/** Consume handoff URLs once (compose mount). Cleanup ids stay until publish. */
export function takeWarehousePhotosForListing(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const urls = parseStringList(
      sessionStorage.getItem(HANDOFF_KEY),
      LISTING_HANDOFF_MAX_PHOTOS,
    );
    sessionStorage.removeItem(HANDOFF_KEY);
    return urls;
  } catch {
    try {
      sessionStorage.removeItem(HANDOFF_KEY);
    } catch {
      /* ignore */
    }
    return [];
  }
}

export function peekWarehouseListingCleanup(): WarehouseListingHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CLEANUP_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as { urls?: unknown; photoIds?: unknown };
    const urls = Array.isArray(obj.urls)
      ? obj.urls
          .filter((u): u is string => typeof u === "string")
          .map((u) => u.trim())
          .filter(Boolean)
          .slice(0, LISTING_HANDOFF_MAX_PHOTOS)
      : [];
    const photoIds = Array.isArray(obj.photoIds)
      ? obj.photoIds
          .filter((u): u is string => typeof u === "string")
          .map((u) => u.trim())
          .filter(Boolean)
          .slice(0, LISTING_HANDOFF_MAX_PHOTOS)
      : [];
    if (urls.length === 0 && photoIds.length === 0) return null;
    return { urls, photoIds };
  } catch {
    return null;
  }
}

export function clearWarehouseListingCleanup(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CLEANUP_KEY);
  } catch {
    /* ignore */
  }
}

/** Take cleanup payload once after a successful publish. */
export function takeWarehouseListingCleanup(): WarehouseListingHandoff | null {
  const pending = peekWarehouseListingCleanup();
  clearWarehouseListingCleanup();
  return pending;
}
