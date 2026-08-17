"use client";

import SheetShell from "@/components/SheetShell";
import { TrashIcon } from "@/components/Icons";

export default function DeleteListingSheet({
  title,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <SheetShell
      onClose={() => {
        if (!busy) onClose();
      }}
      labelledBy="delete-listing-title"
      maxHeight="70dvh"
      zClass="z-[70]"
      closeOnBackdrop={!busy}
      footer={
        <div className="flex gap-2 pb-0.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-600 text-white font-bold py-3.5 text-[15px] active:scale-[0.98] active:bg-red-700 disabled:opacity-60"
          >
            {busy ? "در حال حذف…" : "حذف آگهی"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn-ghost flex-1 !py-3.5 active:scale-[0.98]"
          >
            انصراف
          </button>
        </div>
      }
    >
      <div className="pb-1">
        <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
          <TrashIcon className="w-5 h-5" />
        </div>
        <h2
          id="delete-listing-title"
          className="font-extrabold text-[1.2rem] text-ink dark:text-zinc-50 tracking-tight"
        >
          آگهی حذف شود؟
        </h2>
        <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
          برای همیشه از فید و پروفایل پاک می‌شود. اگر فقط نمی‌خواهی دیده شود،
          به‌جای حذف از فید بردار.
        </p>
        <p className="mt-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/80 px-3 py-2.5 text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug line-clamp-2">
          {title}
        </p>
      </div>
    </SheetShell>
  );
}
