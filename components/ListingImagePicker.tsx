"use client";

import { useRef, useState } from "react";
import { processListingPhoto } from "@/lib/listing-image";
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

export default function ListingImagePicker({
  value,
  onChange,
  onError,
  category,
}: {
  value: string;
  onChange: (image: string) => void;
  onError?: (message: string) => void;
  category?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"photo" | "emoji">(
    value.startsWith("data:image/") ? "photo" : "emoji",
  );
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await processListingPhoto(file);
      onChange(dataUrl);
      setMode("photo");
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "بارگذاری عکس ناموفق بود.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          تصویر آگهی
        </label>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-[11px]">
          <button
            type="button"
            onClick={() => setMode("photo")}
            aria-pressed={mode === "photo"}
            className={`px-2.5 py-1 font-medium transition-colors ${
              mode === "photo"
                ? "bg-brand-600 text-white"
                : "bg-white dark:bg-zinc-900 text-zinc-500"
            }`}
          >
            عکس
          </button>
          <button
            type="button"
            onClick={() => setMode("emoji")}
            aria-pressed={mode === "emoji"}
            className={`px-2.5 py-1 font-medium transition-colors ${
              mode === "emoji"
                ? "bg-brand-600 text-white"
                : "bg-white dark:bg-zinc-900 text-zinc-500"
            }`}
          >
            شکلک
          </button>
        </div>
      </div>

      {mode === "photo" ? (
        <div className="space-y-3">
          {value.startsWith("data:image/") ? (
            <ListingImage
              image={value}
              size="hero"
              category={category}
              frameClassName="h-36 w-full rounded-xl"
            />
          ) : (
            <div className="h-36 w-full rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center justify-center text-zinc-400 gap-1">
              <span className="text-3xl" aria-hidden>
                📷
              </span>
              <span className="text-xs">هنوز عکسی انتخاب نشده</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="btn-primary flex-1 !py-2.5 text-sm"
            >
              {busy ? "در حال پردازش…" : "انتخاب از گالری"}
            </button>
            {value.startsWith("data:image/") && (
              <button
                type="button"
                onClick={() => {
                  onChange("📦");
                  setMode("emoji");
                }}
                className="btn-ghost !py-2.5 text-sm shrink-0"
              >
                حذف
              </button>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            عکس روی دستگاهت فشرده می‌شود و در مرورگر ذخیره می‌گردد — سرور جدا ندارد.
          </p>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange(e)}
              aria-label={`انتخاب شکلک ${e}`}
              aria-pressed={value === e}
              className={`w-11 h-11 shrink-0 rounded-xl text-xl flex items-center justify-center border ${
                value === e
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
