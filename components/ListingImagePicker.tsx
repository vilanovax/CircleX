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
      onError?.(
        err instanceof Error ? err.message : "بارگذاری عکس ناموفق بود.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="text-[13px] font-bold text-ink dark:text-zinc-200">
          تصویر آگهی
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
          {value.startsWith("data:image/") ? (
            <ListingImage
              image={value}
              size="hero"
              category={category}
              frameClassName="h-36 w-full rounded-2xl"
            />
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
                {busy ? "در حال پردازش…" : "انتخاب از گالری"}
              </span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {value.startsWith("data:image/") && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="btn-primary flex-1 !py-2.5 text-sm"
              >
                {busy ? "در حال پردازش…" : "تعویض عکس"}
              </button>
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
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {EMOJIS.map((e) => {
            const active = value === e;
            return (
              <button
                key={e}
                type="button"
                onClick={() => onChange(e)}
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
