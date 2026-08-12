"use client";

import { useRef, useState } from "react";
import { processListingPhoto } from "@/lib/listing-image";
import { toPersianDigits } from "@/lib/persian";
import ListingImage from "./ListingImage";

const EMOJIS = [
  "📦",
  "🛋️",
  "📱",
  "💻",
  "🚗",
  "🚲",
  "🎹",
  "📚",
  "👕",
  "🧸",
  "🛠️",
  "🪑",
  "🍳",
  "⌚",
  "🎒",
  "🎁",
];

const MAX_PHOTOS = 5;

export default function ListingImagePicker({
  photos,
  onPhotosChange,
  emoji,
  onEmojiChange,
  onError,
  category,
}: {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  emoji: string;
  onEmojiChange: (emoji: string) => void;
  onError?: (message: string) => void;
  category?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"photo" | "emoji">(
    photos.length > 0 ? "photo" : "emoji",
  );
  const [busy, setBusy] = useState(false);

  async function onFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      onError?.(`حداکثر ${toPersianDigits(MAX_PHOTOS)} عکس.`);
      return;
    }
    const files = Array.from(fileList).slice(0, room);
    setBusy(true);
    try {
      const next: string[] = [...photos];
      for (const file of files) {
        next.push(await processListingPhoto(file));
      }
      onPhotosChange(next);
      setMode("photo");
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : "بارگذاری عکس ناموفق بود.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    const next = photos.filter((_, i) => i !== index);
    onPhotosChange(next);
    if (next.length === 0) setMode("emoji");
  }

  function moveToCover(index: number) {
    if (index === 0) return;
    const next = [...photos];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onPhotosChange(next);
  }

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="text-[13px] font-bold text-ink dark:text-zinc-200">
          تصاویر آگهی
        </label>
        <div
          className="flex p-0.5 rounded-xl bg-stone-100/90 dark:bg-zinc-800"
          role="group"
          aria-label="نوع تصویر"
        >
          {(
            [
              ["photo", "عکس"],
              ["emoji", "شکلک"],
            ] as const
          ).map(([id, label]) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  active
                    ? "bg-[color:var(--circle-surface)] text-brand-700 shadow-sm dark:bg-zinc-900 dark:text-brand-300"
                    : "text-ink-faint dark:text-zinc-500"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === "photo" ? (
        <div className="space-y-2.5">
          {photos.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {photos.map((src, i) => (
                <div
                  key={`${src.slice(0, 24)}-${i}`}
                  className="relative shrink-0 w-28"
                >
                  <ListingImage
                    image={src}
                    size="hero"
                    category={category}
                    frameClassName={`h-24 w-28 rounded-xl ${
                      i === 0
                        ? "ring-2 ring-brand-500 ring-offset-1 ring-offset-[color:var(--circle-surface)]"
                        : ""
                    }`}
                  />
                  {i === 0 && (
                    <span className="absolute top-1 start-1 text-[9px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded-md">
                      کاور
                    </span>
                  )}
                  <div className="flex gap-1 mt-1">
                    {i !== 0 && (
                      <button
                        type="button"
                        onClick={() => moveToCover(i)}
                        className="flex-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 py-1"
                      >
                        کاور
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="flex-1 text-[10px] font-bold text-ink-faint py-1"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                  className="shrink-0 h-24 w-28 rounded-xl border-2 border-dashed border-stone-200 dark:border-zinc-700 bg-stone-50/80 dark:bg-zinc-800/40 flex flex-col items-center justify-center text-ink-faint gap-0.5"
                >
                  <span className="text-xl" aria-hidden>
                    +
                  </span>
                  <span className="text-[10px] font-semibold">
                    {busy ? "…" : "عکس"}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="h-28 w-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-zinc-700 bg-stone-50/80 dark:bg-zinc-800/40 flex flex-col items-center justify-center text-ink-faint gap-1 active:bg-stone-100 dark:active:bg-zinc-800 transition-colors"
            >
              <span className="text-2xl" aria-hidden>
                📷
              </span>
              <span className="text-[12px] font-semibold text-ink-muted">
                {busy ? "در حال پردازش…" : "چند عکس از گالری"}
              </span>
              <span className="text-[10px] text-ink-faint">
                تا {toPersianDigits(MAX_PHOTOS)} عکس
              </span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          {photos.length > 0 && (
            <p className="text-[11px] text-ink-faint leading-relaxed">
              اولین عکس کاور فید است — می‌توانی جابه‌جا کنی.{" "}
              <span className="nums">
                {toPersianDigits(photos.length)}/{toPersianDigits(MAX_PHOTOS)}
              </span>
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {EMOJIS.map((e) => {
            const active = emoji === e && photos.length === 0;
            return (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onPhotosChange([]);
                  onEmojiChange(e);
                }}
                aria-label={`انتخاب شکلک ${e}`}
                aria-pressed={active}
                className={`h-12 rounded-xl text-2xl flex items-center justify-center border transition-[transform,colors] duration-150 active:scale-95 ${
                  active
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20 shadow-sm"
                    : "border-stone-200/80 dark:border-zinc-700 bg-stone-50/60 dark:bg-zinc-900"
                }`}
              >
                {e}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
