"use client";

import SheetShell from "@/components/SheetShell";
import { EyeOffIcon } from "@/components/Icons";

export default function DeactivateListingSheet({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <SheetShell
      onClose={onClose}
      labelledBy="deactivate-listing-title"
      maxHeight="70dvh"
      zClass="z-[70]"
      footer={
        <div className="flex gap-2 pb-0.5">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 text-white font-bold py-3.5 text-[15px] active:scale-[0.98] active:bg-red-700"
          >
            دیگر دیده نشود
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1 !py-3.5 active:scale-[0.98]"
          >
            انصراف
          </button>
        </div>
      }
    >
      <div className="pb-1">
        <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
          <EyeOffIcon className="w-5 h-5" />
        </div>
        <h2
          id="deactivate-listing-title"
          className="font-extrabold text-[1.2rem] text-ink dark:text-zinc-50 tracking-tight"
        >
          آگهی دیگر دیده نشود؟
        </h2>
        <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
          از فید حلقه برداشته می‌شود؛ در پروفایل تو می‌ماند. هر وقت بخواهی
          دوباره فعال می‌کنی.
        </p>
        <p className="mt-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/80 px-3 py-2.5 text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug line-clamp-2">
          {title}
        </p>
      </div>
    </SheetShell>
  );
}
