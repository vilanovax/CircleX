"use client";

import SheetShell from "@/components/SheetShell";
import { ArchiveIcon } from "@/components/Icons";
import { toPersianDigits } from "@/lib/persian";
import {
  loadWarehouse,
  removePhotos,
  removePhotosByUrls,
  saveWarehouse,
} from "@/lib/warehouse";
import {
  clearWarehouseListingCleanup,
  takeWarehouseListingCleanup,
  type WarehouseListingHandoff,
} from "@/lib/warehouse-handoff";

export function applyWarehouseListingCleanup(
  viewerId: string,
  handoff: WarehouseListingHandoff,
): number {
  const state = loadWarehouse(viewerId);
  const before = state.photos.length;
  let next = state;
  if (handoff.photoIds.length > 0) {
    next = removePhotos(next, handoff.photoIds);
  }
  if (handoff.urls.length > 0) {
    next = removePhotosByUrls(next, handoff.urls);
  }
  saveWarehouse(viewerId, next);
  return Math.max(0, before - next.photos.length);
}

export default function WarehouseCleanupSheet({
  count,
  onKeep,
  onRemove,
}: {
  count: number;
  onKeep: () => void;
  onRemove: () => void;
}) {
  return (
    <SheetShell
      onClose={onKeep}
      labelledBy="warehouse-cleanup-title"
      hugContent
      zClass="z-[70]"
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onRemove}
            className="btn-primary w-full !py-3 text-[14px] font-bold"
          >
            حذف از انبار
          </button>
          <button
            type="button"
            onClick={onKeep}
            className="btn-ghost w-full !py-2.5 text-[13px] font-bold"
          >
            در انبار بماند
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-stone-800 text-white dark:bg-zinc-200 dark:text-zinc-900 flex items-center justify-center shrink-0">
          <ArchiveIcon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="warehouse-cleanup-title"
            className="font-extrabold text-[18px] text-ink dark:text-zinc-50 leading-tight"
          >
            عکس‌های آگهی از انبار برداشته شوند؟
          </h2>
          <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
            {toPersianDigits(count)} عکس در این آگهی از انبار آمده‌اند. اگر دیگر
            لازم نیست، از انبار پاک شوند تا شلوغ نماند.
          </p>
        </div>
      </div>
    </SheetShell>
  );
}

/** After a successful listing publish — returns pending cleanup or null. */
export function consumeListingCleanupIfAny(): WarehouseListingHandoff | null {
  return takeWarehouseListingCleanup();
}

export function skipListingCleanup(): void {
  clearWarehouseListingCleanup();
}
