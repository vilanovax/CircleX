"use client";

import { memo, useRef, useState } from "react";
import { CameraIcon } from "@/components/Icons";
import ListingImage from "@/components/ListingImage";
import { isListingPhoto } from "@/lib/listing-image";
import { uploadUserPhoto } from "@/lib/media-image";

function UserPhotoField({
  label,
  value,
  onChange,
  emojis,
  category,
  onError,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  emojis: string[];
  category?: string;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const photo = isListingPhoto(value);

  async function onFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadUserPhoto(file));
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

  function pickEmoji(next: string) {
    onChange(next);
    setShowEmojis(false);
  }

  return (
    <section className="mb-4">
      <label className="block text-[13px] font-bold text-ink dark:text-zinc-200 mb-2">
        {label}
      </label>

      {photo ? (
        <div className="flex items-start gap-3">
          <ListingImage
            image={value}
            size="md"
            category={category}
            frameClassName="h-24 w-28 rounded-xl"
          />
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[12px] font-bold text-ink dark:text-zinc-200">
              عکس انتخاب‌شده
            </p>
            <p className="text-[11px] text-ink-faint mt-0.5 leading-relaxed">
              قبل از ذخیره کوچک و فشرده می‌شود.
            </p>
            <button
              type="button"
              onClick={() => onChange(emojis[0] ?? "📦")}
              className="mt-2 text-[12px] font-bold text-ink-muted dark:text-zinc-400"
            >
              حذف عکس
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-zinc-700 bg-stone-50/80 dark:bg-zinc-800/40 px-4 py-3.5 flex flex-col items-center justify-center text-ink-faint gap-1 active:bg-stone-100 dark:active:bg-zinc-800"
          >
            <CameraIcon className="w-6 h-6 text-ink-muted dark:text-zinc-400" />
            <span className="text-[13px] font-bold text-ink dark:text-zinc-200">
              {busy ? "در حال آپلود…" : "افزودن عکس"}
            </span>
            <span className="text-[11px] text-ink-faint">
              همان استاندارد آگهی و چت
            </span>
          </button>
          {showEmojis ? (
            <div>
              <p className="text-[11px] text-ink-muted mb-1.5">
                یا یک تصویر نمادین انتخاب کن.
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {emojis.map((e) => {
                  const active = value === e;
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => pickEmoji(e)}
                      aria-label={`تصویر نمادین ${e}`}
                      aria-pressed={active}
                      className={`h-11 rounded-xl text-xl flex items-center justify-center border transition-[transform,colors] duration-150 active:scale-95 ${
                        active
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20"
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
            <button
              type="button"
              onClick={() => setShowEmojis(true)}
              className="text-[12px] font-semibold text-brand-600 dark:text-brand-400"
            >
              عکس نداری؟ تصویر نمادین انتخاب کن.
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files)}
      />
    </section>
  );
}

export default memo(UserPhotoField);
