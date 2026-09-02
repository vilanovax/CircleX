"use client";

import { CameraIcon, TagIcon } from "@/components/Icons";
import { toPersianDigits } from "@/lib/persian";
import "./warehouse-empty.css";

const STEPS = [
  { key: "shoot", label: "بگیر", hint: "دوربین یا گالری" },
  { key: "sort", label: "بچین", hint: "دستهٔ اختیاری" },
  { key: "list", label: "آگهی کن", hint: "وقتی آماده شدی" },
] as const;

/** Empty warehouse — one composition: shelf metaphor + single CTA. */
export default function WarehouseEmpty({
  uploading,
  onUpload,
}: {
  uploading: boolean;
  onUpload: () => void;
}) {
  return (
    <section
      className={`warehouse-empty relative overflow-hidden rounded-[1.125rem] px-4 pb-6 pt-7 text-center ${
        uploading ? "warehouse-empty--busy" : ""
      }`}
      aria-labelledby="warehouse-empty-title"
      aria-busy={uploading}
    >
      <div
        aria-hidden
        className="warehouse-empty-wash pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="warehouse-empty-grain pointer-events-none absolute inset-0"
      />

      <div className="warehouse-empty-shelf" aria-hidden>
        <span className="warehouse-empty-slot warehouse-empty-slot--a" />
        <span className="warehouse-empty-slot warehouse-empty-slot--b" />
        <span className="warehouse-empty-slot warehouse-empty-slot--c">
          <span className="warehouse-empty-slot-glow" />
          <CameraIcon className="relative z-[1] w-5 h-5 text-brand-600 dark:text-brand-300" />
        </span>
        <span className="warehouse-empty-ledge" />
      </div>

      <h2
        id="warehouse-empty-title"
        className="relative font-extrabold text-[20px] leading-tight tracking-tight text-ink dark:text-zinc-50 text-pretty"
      >
        الان فقط عکس بگیر
      </h2>
      <p className="relative mt-2 mx-auto max-w-[19.5rem] text-[13px] leading-relaxed text-ink-muted dark:text-zinc-400 text-pretty">
        خانهٔ مادری، زیرزمین، انبار — عکس‌ها اینجا بهینه می‌شوند تا وقت آگهی
        برسد.
      </p>

      <ol className="warehouse-empty-steps relative mt-5 mx-auto flex max-w-[20rem] items-stretch justify-between gap-1">
        {STEPS.map((step, i) => (
          <li key={step.key} className="warehouse-empty-step flex-1 min-w-0">
            <span
              className={`warehouse-empty-step-num mx-auto flex size-7 items-center justify-center rounded-full text-[11px] font-extrabold nums ${
                i === 0
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25"
                  : "bg-stone-100 text-ink-muted dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {toPersianDigits(i + 1)}
            </span>
            <span
              className={`mt-1.5 block text-[11px] font-extrabold ${
                i === 0
                  ? "text-brand-700 dark:text-brand-300"
                  : "text-ink-muted dark:text-zinc-400"
              }`}
            >
              {step.label}
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-ink-faint dark:text-zinc-500 truncate">
              {step.hint}
            </span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        disabled={uploading}
        onClick={onUpload}
        className="warehouse-empty-cta relative mt-6 btn-primary w-full !py-3.5 text-[15px] font-bold inline-flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-150 disabled:opacity-70 disabled:active:scale-100"
      >
        {uploading ? (
          <>
            <span className="warehouse-empty-spinner" aria-hidden />
            در حال بهینه‌سازی…
          </>
        ) : (
          <>
            <CameraIcon className="w-5 h-5" />
            افزودن اولین عکس
          </>
        )}
      </button>

      <p className="relative mt-3 inline-flex items-center justify-center gap-1.5 text-[11px] text-ink-faint dark:text-zinc-500">
        <TagIcon className="w-3.5 h-3.5 opacity-70" aria-hidden />
        دوربین یا گالری — هر دو از همین‌جا
      </p>
    </section>
  );
}
