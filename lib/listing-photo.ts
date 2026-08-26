import { withoutBasePath } from "./avatar";
import { PHOTO_MAX_BYTES, UPLOAD_PATH_RE } from "./media";

/** Unsplash photo id in a leftover URL → local Commons-hosted stock file. */
const UNSPLASH_PHOTO =
  /(?:https?:\/\/)?images\.unsplash\.com\/(photo-[0-9a-zA-Z-]+)/i;
const LOCAL_PHOTO = /\/listings\/(photo-[0-9a-zA-Z-]+)\.jpe?g$/i;

const FROM_UNSPLASH: Record<string, string> = {
  "photo-1460925895917-afdab827c52f": "laptop-desk",
  "photo-1548036328-c9fa89d128fa": "leather-bag",
  "photo-1504148455328-c376907d081c": "cordless-drill",
  "photo-1485955900006-10f4d324d411": "terracotta-pot",
  "photo-1485965120182-cf1713bcabf1": "city-bicycle",
  "photo-1505740420928-5e560c06d30e": "headphones",
  "photo-1512820790803-83ca734da794": "stacked-books",
  "photo-1588872657578-7efd1f1555ed": "open-laptop",
  "photo-1515488042361-ee00e0ddd4e4": "baby-stroller",
  "photo-1618220179428-22790b461013": "wooden-desk",
  "photo-1519238263530-99bdd11df2ea": "child-clothes",
  "photo-1555041469-a586c61ea9bc": "fabric-sofa",
  "photo-1553413077-190dd305871c": "cardboard-boxes",
  "photo-1524995997946-a1c2e315a42f": "children-books",
  "photo-1511707171634-5f897ff02aa9": "smartphone",
  "photo-1592899677977-9c10ca588bbd": "smartphone-back",
  "photo-1544244015-0df4b3ffc6b0": "tablet",
  "photo-1493663284031-b7e3aefcae8e": "living-room-sofa",
  "photo-1567016432779-094069958ea5": "two-seat-sofa",
  "photo-1517336714731-489689fd1ca8": "macbook",
  "photo-1530018607912-eff2daa1bac4": "dining-table",
  "photo-1503602642458-232111445657": "wooden-chair",
  "photo-1571175443880-49e1d25b2bc5": "refrigerator",
  "photo-1593359677879-a4bb92f829d1": "flat-tv",
  "photo-1594620302200-9a762244a156": "bookshelf",
  "photo-1520523839897-bd0b52f945a0": "piano",
  "photo-1513883049090-d0b7439799bf": "piano-keys",
  "photo-1507838153410-b1bf453d1f84": "piano-side",
  "photo-1566576912321-d58ddd7a6088": "wooden-toys",
  "photo-1596461404969-9ae70f2830fc": "stuffed-toys",
  "photo-1632661674596-df8be070a5c6": "iphone",
  "photo-1591337676887-a217a6970a8a": "iphone-side",
  "photo-1510557880182-3d4d3cba35a5": "iphone-screen",
  "photo-1552519507-da3b142c6e3d": "compact-car",
  "photo-1494976388531-d10584930316": "white-car",
  "photo-1503376780353-7e6692767b70": "car-front",
  "photo-1549317661-bd32c8ce0db2": "car-side",
  "photo-1581578731548-c64695cc6952": "washing-machine",
  "photo-1556911220-bff31c812dce": "kitchen-counter",
  "photo-1621905251189-08b45d6a269e": "power-tools",
  "photo-1576678927484-cc907957088c": "treadmill",
  "photo-1517836357463-d25dfeac3438": "gym-weights",
  "photo-1483721310020-03333e577078": "yoga-mat",
  "photo-1478131143081-80f7f84ca84d": "camping-tent",
  "photo-1504280390367-361c6d9f38f4": "camping-gear",
  "photo-1523987355523-c7b5b0dd90a7": "camper-van",
  "photo-1554224155-6726b3ff858f": "calculator",
  "photo-1579621970563-ebec7560ff3e": "coins-savings",
  "photo-1503454537195-1dcabb73ffb9": "toddler",
  "photo-1476703993599-0035a21b17a9": "parent-child",
  "photo-1516627145497-ae6968895b74": "baby",
  "photo-1434493789847-2f02dc6ca35d": "smartwatch",
  "photo-1579586337278-3befd40fd17a": "wristwatch",
  "photo-1546868871-7041f2a55e12": "analog-watch",
  "photo-1561070791-2526d30994b5": "color-swatches",
  "photo-1626785774573-4b7993143466": "graphic-design",
  "photo-1634942537034-2531766767d1": "sketch-markers",
  "photo-1556228453-efd6c1ff04f6": "armchair",
};

const STOCK = /^\/listings\/[a-zA-Z0-9._-]+\.jpe?g$/i;

/** Max JPEG bytes after compress, written to app disk. */
export const LISTING_PHOTO_MAX_BYTES = PHOTO_MAX_BYTES;

/** Strip origin and `/circle` so stored srcs are `/api/uploads/…`. */
export function canonicalListingImage(value: string): string {
  let v = value.trim();
  if (!v) return "";
  if (v.startsWith("data:image/")) return v;
  if (/^https?:\/\//i.test(v)) {
    try {
      v = new URL(v).pathname;
    } catch {
      return v;
    }
  }
  return withoutBasePath(v);
}

export function isStoredUploadSrc(value: string): boolean {
  return UPLOAD_PATH_RE.test(canonicalListingImage(value));
}

export function listingStockPath(photoId: string): string {
  const id = photoId.startsWith("photo-") ? photoId : `photo-${photoId}`;
  const file = FROM_UNSPLASH[id] || id;
  return `/listings/${file}.jpg`;
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
  const v = canonicalListingImage(value);
  if (!v) return false;
  if (/^https?:\/\//i.test(v)) return false;
  if (STOCK.test(v) || UPLOAD_PATH_RE.test(v)) return true;
  if (v.startsWith("data:image/jpeg") || v.startsWith("data:image/webp")) {
    return v.length < 2_000_000;
  }
  return v.length <= 16 && !v.includes("/");
}
