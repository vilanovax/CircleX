/** Max encoded size we keep in localStorage (bytes). */
export const LISTING_PHOTO_MAX_BYTES = 900_000;

const PHOTO_PREFIXES = ["data:image/", "http://", "https://", "/"];

/** True when `image` is a photo URL or data URL (not an emoji placeholder). */
export function isListingPhoto(image: string): boolean {
  const v = image.trim();
  return PHOTO_PREFIXES.some((p) => v.startsWith(p));
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

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("خواندن عکس ممکن نشد."));
    };
    img.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL("image/jpeg", quality);
}

function byteLength(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

/** Resize + compress a gallery photo for client-side storage. */
export async function processListingPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("فقط فایل تصویری مجاز است.");
  }

  const img = await loadImage(file);
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("پردازش عکس ممکن نشد.");
  ctx.drawImage(img, 0, 0, w, h);

  let quality = 0.88;
  let dataUrl = canvasToJpeg(canvas, quality);
  while (byteLength(dataUrl) > LISTING_PHOTO_MAX_BYTES && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvasToJpeg(canvas, quality);
  }

  if (byteLength(dataUrl) > LISTING_PHOTO_MAX_BYTES) {
    throw new Error("عکس بعد از فشرده‌سازی هنوز بزرگ است — عکس کوچک‌تری انتخاب کن.");
  }

  return dataUrl;
}
