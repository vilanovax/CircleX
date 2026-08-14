"use client";

import { useCallback, useRef, useState } from "react";
import ListingComposeForm, {
  type ListingComposeHandle,
  type ListingInput,
} from "@/components/ListingComposeForm";
import SheetShell from "@/components/SheetShell";
import { BackIcon, CloseIcon } from "@/components/Icons";

export type { ListingInput };

export default function AddListingSheet({
  onClose,
  onAdd,
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
    canSubmit: true,
    primaryLabel: "ساخت پیش‌نمایش",
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

  const reviewing = footer.step === "review";

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="add-listing-title"
      zClass="z-50"
      maxHeight="100dvh"
      footer={
        <div>
          {footer.hint && (
            <p className="text-[11px] text-ink-muted text-center mb-2 leading-relaxed">
              {footer.hint}
            </p>
          )}
          <button
            type="button"
            disabled={!footer.canSubmit}
            onClick={() => formRef.current?.submit()}
            className="btn-primary w-full !py-3 text-[15px] shadow-lg shadow-brand-600/20 active:scale-[0.99] transition-transform duration-150 disabled:opacity-60"
          >
            {footer.primaryLabel}
          </button>
        </div>
      }
    >
      <div className="flex items-center gap-2 mb-1">
        {reviewing && (
          <button
            type="button"
            onClick={() => formRef.current?.goBack?.()}
            aria-label="بازگشت"
            className="shrink-0 w-9 h-9 -ms-1 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 active:bg-brand-50 dark:active:bg-brand-500/10"
          >
            <BackIcon className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2
            id="add-listing-title"
            className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
          >
            {reviewing ? "آگهی شما آماده است" : "آگهی جدید"}
          </h2>
          <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-relaxed">
            {reviewing
              ? "عنوان و جزئیات را تأیید یا اصلاح کنید."
              : "عکس و یک توضیح کافی است؛ بقیه را آماده می‌کنیم."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="shrink-0 w-9 h-9 -me-1 rounded-full flex items-center justify-center text-ink-muted dark:text-zinc-400 active:bg-stone-100 dark:active:bg-zinc-800"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3.5 pb-2">
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
