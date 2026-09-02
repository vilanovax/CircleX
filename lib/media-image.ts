"use client";

import { withoutBasePath } from "./avatar";
import { api } from "./api";
import {
  PHOTO_MAX_BYTES,
  PHOTO_MAX_EDGE,
  PHOTO_UPLOAD_MAX_BYTES,
  isMediaObjectUrl,
} from "./media";

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("پردازش عکس ممکن نشد.")),
      "image/jpeg",
      quality,
    );
  });
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
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

type BitmapLike = {
  width: number;
  height: number;
  close?: () => void;
};

async function decodePhoto(file: File): Promise<BitmapLike> {
  if (typeof createImageBitmap === "function") {
    try {
      const opts = { imageOrientation: "from-image" as const };
      let bmp = await createImageBitmap(file, opts as ImageBitmapOptions);
      const long = Math.max(bmp.width, bmp.height);
      if (long > 2560) {
        const s = 2560 / long;
        const next = await createImageBitmap(bmp, {
          resizeWidth: Math.max(1, Math.round(bmp.width * s)),
          resizeHeight: Math.max(1, Math.round(bmp.height * s)),
        });
        bmp.close();
        bmp = next;
      }
      return bmp;
    } catch {
      /* HEIC / older Safari — try HTMLImageElement */
    }
  }
  return loadImageElement(file);
}

function drawJpeg(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  maxSide: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("پردازش عکس ممکن نشد.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

/** Resize + compress any user photo to a JPEG blob under PHOTO_MAX_BYTES. */
export async function processUserPhoto(file: File): Promise<Blob> {
  const looksImage =
    file.type.startsWith("image/") || file.type === "" || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
  if (!looksImage) {
    throw new Error("فقط فایل تصویری مجاز است.");
  }
  if (file.size > PHOTO_UPLOAD_MAX_BYTES) {
    throw new Error("عکس خیلی بزرگ است.");
  }

  const source = await decodePhoto(file);
  let maxSide = PHOTO_MAX_EDGE;
  let quality = 0.82;
  let blob: Blob | null = null;

  try {
    for (let pass = 0; pass < 10; pass++) {
      const canvas = drawJpeg(
        source as CanvasImageSource,
        source.width,
        source.height,
        maxSide,
      );
      blob = await canvasToJpegBlob(canvas, quality);
      if (blob.size <= PHOTO_MAX_BYTES) break;
      if (quality > 0.52) {
        quality = Math.max(0.5, quality - 0.08);
      } else {
        maxSide = Math.max(480, Math.round(maxSide * 0.75));
        quality = 0.78;
      }
    }
  } finally {
    source.close?.();
  }

  if (!blob || blob.size > PHOTO_MAX_BYTES) {
    throw new Error(
      "عکس بعد از فشرده‌سازی هنوز بزرگ است — عکس کوچک‌تری انتخاب کن.",
    );
  }
  return blob;
}

/** Compress then store on object storage — returns public HTTPS media URL. */
export async function uploadUserPhoto(file: File): Promise<string> {
  let payload: Blob = file;
  try {
    payload = await processUserPhoto(file);
  } catch (err) {
    if (file.size > PHOTO_UPLOAD_MAX_BYTES) throw err;
    const looksImage =
      file.type.startsWith("image/") ||
      file.type === "" ||
      /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
    if (!looksImage) throw err;
    /* Server re-encodes JPEG/PNG/WebP when the canvas pipeline cannot. */
  }

  const form = new FormData();
  form.append("photo", payload, "photo.jpg");
  const { url } = await api<{ url: string }>("/api/uploads", {
    method: "POST",
    body: form,
  });
  if (!url || (!isMediaObjectUrl(url) && !url.includes("/api/uploads/"))) {
    throw new Error("ذخیرهٔ عکس نشد.");
  }
  return withoutBasePath(url);
}

export const processListingPhotoBlob = processUserPhoto;
export const uploadListingPhoto = uploadUserPhoto;
