"use client";

import { useCallback, useRef, useState } from "react";
import ListingComposeForm, {
  type ListingComposeHandle,
  type ListingInput,
} from "@/components/ListingComposeForm";
import SheetShell from "@/components/SheetShell";
import { CloseIcon } from "@/components/Icons";
import { ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import type { Listing } from "@/lib/types";
import DeactivateListingSheet from "@/components/DeactivateListingSheet";

export default function EditListingSheet({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const formRef = useRef<ListingComposeHandle>(null);
  const updateListing = useStore((s) => s.updateListing);
  const setListingDealStatus = useStore((s) => s.setListingDealStatus);
  const { show } = useToast();
  const [saving, setSaving] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const inactive = listing.dealStatus === "inactive";
  const [footer, setFooter] = useState<{
    canSubmit: boolean;
    primaryLabel: string;
    hint?: string;
  }>({
    canSubmit: true,
    primaryLabel: "ذخیره تغییرات",
  });

  const onFooterMetaChange = useCallback(
    (meta: {
      canSubmit: boolean;
      primaryLabel: string;
      hint?: string;
    }) => {
      setFooter(meta);
    },
    [],
  );

  const initial: ListingInput = {
    title: listing.title,
    description: listing.description,
    type: listing.type,
    price: listing.price,
    category: listing.category,
    image: listing.image,
    images: listing.images,
    privacy: listing.privacy,
    condition: listing.condition,
    specs: listing.specs,
    area: listing.area,
  };

  async function save(input: ListingInput) {
    if (saving) return;
    setSaving(true);
    try {
      await updateListing(listing.id, input);
      show("تغییرات آگهی ذخیره شد ✓");
      onClose();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ذخیره نشد");
      setSaving(false);
    }
  }

  async function reactivate() {
    await setListingDealStatus(listing.id, "available");
    show("آگهی دوباره در حلقه دیده می‌شود");
  }

  async function deactivate() {
    await setListingDealStatus(listing.id, "inactive");
    setShowDeactivate(false);
    show("آگهی غیرفعال شد");
    onClose();
  }

  return (
    <>
      <SheetShell
        onClose={onClose}
        labelledBy="edit-listing-title"
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
              disabled={!footer.canSubmit || saving}
              onClick={() => formRef.current?.submit()}
              className="btn-primary w-full !py-3 text-[15px] shadow-lg shadow-brand-600/20 active:scale-[0.99] transition-transform duration-150 disabled:opacity-60"
            >
              {saving ? "در حال ذخیره…" : footer.primaryLabel}
            </button>
            {inactive ? (
              <button
                type="button"
                onClick={() => void reactivate()}
                className="mt-2 w-full text-[13px] font-bold text-brand-600 dark:text-brand-400 py-2.5"
              >
                دوباره فعال کن
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeactivate(true)}
                className="mt-2 w-full text-[13px] font-bold text-red-600 dark:text-red-400 py-2.5"
              >
                این آگهی دیگر دیده نشود
              </button>
            )}
          </div>
        }
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <h2
              id="edit-listing-title"
              className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
            >
              ویرایش آگهی
            </h2>
            <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-relaxed">
              عنوان، عکس و جزئیات را عوض کن. ذخیره، آگهی را غیرفعال نمی‌کند.
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
            initial={initial}
            submitLabel="ذخیره تغییرات"
            onFooterMetaChange={onFooterMetaChange}
            onSubmit={save}
          />
        </div>
      </SheetShell>

      {showDeactivate && (
        <DeactivateListingSheet
          title={listing.title}
          onClose={() => setShowDeactivate(false)}
          onConfirm={() => void deactivate()}
        />
      )}
    </>
  );
}
