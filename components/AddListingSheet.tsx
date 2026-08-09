"use client";

import { useCallback, useRef, useState } from "react";
import ListingComposeForm, {
  type ListingComposeHandle,
  type ListingInput,
} from "@/components/ListingComposeForm";
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
  const formRef = useRef<ListingComposeHandle>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const onCanSubmitChange = useCallback((can: boolean) => {
    setCanSubmit(can);
  }, []);

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="add-listing-title"
      zClass="z-50"
      footer={
        <div>
          {!canSubmit && (
            <p className="text-[11px] text-ink-faint text-center mb-2">
              عنوان و توضیحات را کامل کن
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 !py-3.5 active:scale-[0.98] transition-transform duration-150"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => formRef.current?.submit()}
              className="btn-primary flex-1 !py-3.5 shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
            >
              انتشار آگهی
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-[12px] text-brand-600 dark:text-brand-400 font-semibold mb-1.5 active:opacity-80"
          >
            ‹ بازگشت
          </button>
        )}
        <h2
          id="add-listing-title"
          className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
        >
          ثبت آگهی جدید
        </h2>
        <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
          فقط برای حلقه‌ی اعتمادت دیده می‌شود — نه غریبه‌ها.
        </p>
      </div>

      <div className="mt-3.5 pb-1">
        <ListingComposeForm
          ref={formRef}
          hideActions
          onCanSubmitChange={onCanSubmitChange}
          onSubmit={onAdd}
        />
      </div>
    </SheetShell>
  );
}
