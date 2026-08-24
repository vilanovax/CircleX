"use client";

import { memo, useRef, useState } from "react";
import { CameraIcon } from "@/components/Icons";
import { uploadListingPhoto } from "@/lib/listing-image";
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

function ListingImagePicker({
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
  const [showEmojis, setShowEmojis] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pickedEmoji, setPickedEmoji] = useState(false);

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
        next.push(await uploadListingPhoto(file));
      }
      onPhotosChange(next);
      setShowEmojis(false);
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
  }

  function moveToCover(index: number) {
    if (index === 0) return;
    const next = [...photos];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onPhotosChange(next);
  }

  function pickEmoji(next: string) {
    onPhotosChange([]);
    onEmojiChange(next);
    setPickedEmoji(true);
    setShowEmojis(false);
  }

  const hasPhotos = photos.length > 0;
  const showEmojiPreview = !hasPhotos && pickedEmoji && !showEmojis;

  return (
    <section className="mb-4">
      <label className="block text-[13px] font-bold text-ink dark:text-zinc-200 mb-2">
        عکس آگهی
      </label>

      {hasPhotos ? (
        <div className="space-y-2">
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
                  <span className="absolute top-1 start-1 text-[11px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded-md">
                    عکس اصلی
                  </span>
                )}
                <div className="flex gap-1 mt-1.5">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => moveToCover(i)}
                      className="flex-1 min-h-8 text-[11px] font-bold text-brand-600 dark:text-brand-400 rounded-lg active:bg-brand-50 dark:active:bg-brand-500/10"
                    >
                      عکس اصلی
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="flex-1 min-h-8 text-[11px] font-bold text-ink-muted dark:text-zinc-400 rounded-lg active:bg-stone-100 dark:active:bg-zinc-800"
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
                className="shrink-0 h-24 w-28 rounded-xl border-2 border-dashed border-stone-200 dark:border-zinc-700 bg-stone-50/80 dark:bg-zinc-800/40 flex flex-col items-center justify-center text-ink-faint gap-1 active:scale-[0.97] transition-transform duration-150"
              >
                <CameraIcon className="w-5 h-5 text-ink-muted dark:text-zinc-400" />
                <span className="text-[11px] font-semibold">
                  {busy ? "در حال آپلود…" : "افزودن"}
                </span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-ink-faint leading-relaxed">
            اولین عکس، عکس اصلی آگهی است.{" "}
            <span className="nums">
              {toPersianDigits(photos.length)}/{toPersianDigits(MAX_PHOTOS)}
            </span>
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {showEmojiPreview ? (
            <div className="flex items-center gap-3 rounded-2xl border border-stone-200/80 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-800/40 px-3 py-2.5">
              <span className="text-[2rem] leading-none shrink-0" aria-hidden>
                {emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-ink dark:text-zinc-200">
                  تصویر نمادین
                </p>
                <button
                  type="button"
                  onClick={() => setShowEmojis(true)}
                  className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-0.5"
                >
                  تغییر
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="shrink-0 text-[11px] font-bold text-brand-700 dark:text-brand-300 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-700"
              >
                افزودن عکس
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-zinc-700 bg-stone-50/80 dark:bg-zinc-800/40 px-4 py-3.5 flex flex-col items-center justify-center text-ink-faint gap-1 active:bg-stone-100 dark:active:bg-zinc-800 transition-colors"
            >
              <CameraIcon className="w-6 h-6 text-ink-muted dark:text-zinc-400" />
              <span className="text-[13px] font-bold text-ink dark:text-zinc-200">
                {busy ? "در حال آپلود…" : "افزودن عکس"}
              </span>
              <span className="text-[11px] text-ink-faint">
                تا {toPersianDigits(MAX_PHOTOS)} عکس — اولین عکس، عکس اصلی است
              </span>
            </button>
          )}

          {showEmojis ? (
            <div>
              <p className="text-[11px] text-ink-muted mb-1.5">
                یک تصویر نمادین انتخاب کن.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {EMOJIS.map((e) => {
                  const active = emoji === e;
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => pickEmoji(e)}
                      aria-label={`تصویر نمادین ${e}`}
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
            </div>
          ) : (
            !showEmojiPreview && (
              <button
                type="button"
                onClick={() => setShowEmojis(true)}
                className="text-[12px] font-semibold text-brand-600 dark:text-brand-400"
              >
                عکس نداری؟ تصویر نمادین انتخاب کن.
              </button>
            )
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </section>
  );
}

export default memo(ListingImagePicker);
