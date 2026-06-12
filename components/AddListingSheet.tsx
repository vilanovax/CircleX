"use client";

import { useRef } from "react";
import ListingComposeForm, { type ListingInput } from "@/components/ListingComposeForm";
import { useSheetA11y } from "@/lib/use-sheet-a11y";

export type { ListingInput };

export default function AddListingSheet({
  onClose,
  onAdd,
  onBack,
}: {
  onClose: () => void;
  onAdd: (input: ListingInput) => void;
  onBack?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose);

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-listing-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 pb-7 animate-slide-up max-h-[90dvh] overflow-y-auto outline-none"
        >
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-brand-600 font-medium mb-2"
            >
              ‹ بازگشت
            </button>
          )}
          <h2 id="add-listing-title" className="font-bold text-lg mb-4 text-zinc-900 dark:text-zinc-100">
            ثبت آگهی جدید
          </h2>
          <ListingComposeForm onSubmit={onAdd} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
