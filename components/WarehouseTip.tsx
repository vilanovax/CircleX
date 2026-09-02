"use client";

import { ArchiveIcon } from "@/components/Icons";

/**
 * One-shot after the first warehouse photo — teaches “hold here, list later”.
 */
export default function WarehouseTip({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  return (
    <div className="card relative flex items-start gap-3 px-3.5 py-3 ring-1 ring-brand-100/80 dark:ring-brand-500/25">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
        <ArchiveIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 pe-6 text-start">
        <p className="text-[13px] font-semibold leading-snug text-ink dark:text-zinc-100">
          اینجا نگه می‌داری؛ وقتی خواستی آگهی می‌کنی
        </p>
        <p className="mt-1 text-[11px] leading-snug text-ink-muted dark:text-zinc-400">
          عکس‌ها بهینه شده‌اند. دسته‌بندی اختیاری است.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-2.5 end-2.5 flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors duration-150 active:bg-stone-100 dark:active:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        aria-label="بستن راهنما"
      >
        ×
      </button>
    </div>
  );
}
