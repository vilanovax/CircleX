"use client";

import { useCallback, useRef, useState } from "react";
import ListingComposeForm, {
  type ListingComposeHandle,
  type ListingInput,
} from "@/components/ListingComposeForm";
import SheetShell from "@/components/SheetShell";
import { BackIcon, CloseIcon } from "@/components/Icons";
import ListingComposeProgress from "@/components/ListingComposeProgress";

export type { ListingInput };

export default function AddListingSheet({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (input: ListingInput) => void | Promise<void>;
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
      header={
        <div className="flex items-start gap-1">
          {reviewing ? (
            <button
              type="button"
              onClick={() => formRef.current?.goBack?.()}
              aria-label="بازگشت به متن"
              className="shrink-0 w-10 h-10 -ms-1 -mt-0.5 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 active:scale-[0.97] active:bg-brand-50 dark:active:bg-brand-500/10 transition-[transform,background-color] duration-150"
            >
              <BackIcon className="w-5 h-5" />
            </button>
          ) : (
            <span className="w-10 shrink-0" aria-hidden />
          )}
          <div className="min-w-0 flex-1 pt-1 text-center">
            <h2
              id="add-listing-title"
              className="font-extrabold text-[20px] text-ink dark:text-zinc-50 leading-tight text-pretty"
            >
              آگهی جدید
            </h2>
            <ListingComposeProgress step={footer.step} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="shrink-0 w-10 h-10 -me-1 -mt-0.5 rounded-full flex items-center justify-center text-ink-muted dark:text-zinc-400 active:scale-[0.97] active:bg-stone-100 dark:active:bg-zinc-800 transition-[transform,background-color] duration-150"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      }
      footer={
        <div>
          {footer.hint && (
            <p className="text-[12.5px] text-ink-muted text-center mb-2 leading-relaxed">
              {footer.hint}
            </p>
          )}
          <button
            type="button"
            disabled={!footer.canSubmit}
            onClick={() => formRef.current?.submit()}
            className="btn-primary w-full !py-3.5 text-[15px] font-bold shadow-[0_8px_24px_rgba(26,24,22,0.08)] active:scale-[0.97] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-60"
          >
            {footer.primaryLabel}
          </button>
        </div>
      }
    >
      <ListingComposeForm
        ref={formRef}
        hideActions
        onFooterMetaChange={onFooterMetaChange}
        onSubmit={onAdd}
      />
    </SheetShell>
  );
}
