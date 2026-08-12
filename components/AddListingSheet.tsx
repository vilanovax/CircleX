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
  const [footer, setFooter] = useState<{
    canSubmit: boolean;
    primaryLabel: string;
    hint?: string;
    step: "compose" | "review";
  }>({
    canSubmit: false,
    primaryLabel: "ادامه و پیش‌نمایش",
    hint: "چند جمله درباره کالا بنویس (حداقل ۱۲ حرف)",
    step: "compose",
  });

  const onFooterMetaChange = useCallback(
    (meta: {
      canSubmit: boolean;
      primaryLabel: string;
      hint?: string;
      step: "compose" | "review";
    }) => {
      setFooter(meta);
    },
    [],
  );

  const handleSheetBack = () => {
    if (footer.step === "review") {
      formRef.current?.goBack?.();
      return;
    }
    onBack?.();
  };

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="add-listing-title"
      zClass="z-50"
      footer={
        <div>
          {footer.hint && (
            <p className="text-[11px] text-ink-faint text-center mb-2">
              {footer.hint}
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
              disabled={!footer.canSubmit}
              onClick={() => formRef.current?.submit()}
              className="btn-primary flex-1 !py-3.5 shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
            >
              {footer.primaryLabel}
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-1">
        {(onBack || footer.step === "review") && (
          <button
            type="button"
            onClick={handleSheetBack}
            className="text-[12px] text-brand-600 dark:text-brand-400 font-semibold mb-1.5 active:opacity-80"
          >
            ‹ {footer.step === "review" ? "بازگشت به متن" : "بازگشت"}
          </button>
        )}
        <h2
          id="add-listing-title"
          className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
        >
          {footer.step === "review" ? "پیش‌نمایش آگهی" : "ثبت آگهی جدید"}
        </h2>
        <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
          {footer.step === "review"
            ? "پیشنهادها را تأیید یا اصلاح کن، بعد منتشر کن."
            : "فقط برای حلقه‌ی اعتمادت دیده می‌شود — نه غریبه‌ها."}
        </p>
      </div>

      <div className="mt-3.5 pb-1">
        <ListingComposeForm
          ref={formRef}
          hideActions
          onFooterMetaChange={onFooterMetaChange}
          onSubmit={onAdd}
        />
      </div>
    </SheetShell>
  );
}
