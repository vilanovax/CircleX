"use client";

import ListingComposeForm, { type ListingInput } from "@/components/ListingComposeForm";
import SheetShell from "@/components/SheetShell";

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
  return (
    <SheetShell onClose={onClose} labelledBy="add-listing-title" zClass="z-50">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-brand-600 font-medium mb-2"
        >
          ‹ بازگشت
        </button>
      )}
      <h2 id="add-listing-title" className="font-bold text-lg mb-4 text-ink dark:text-zinc-100">
        ثبت آگهی جدید
      </h2>
      <ListingComposeForm onSubmit={onAdd} onCancel={onClose} />
    </SheetShell>
  );
}
