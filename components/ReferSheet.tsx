"use client";

import { useState } from "react";
import SheetShell from "@/components/SheetShell";
import { useStore } from "@/lib/store";
import { useToast } from "./Toast";
import Avatar from "./Avatar";
import { relationLabels } from "@/lib/labels";

/**
 * Quick in-network referral: pick someone from my circle and send them this
 * listing as a trusted DM (not a public share).
 */
export default function ReferSheet({
  listingId,
  listingTitle,
  onClose,
}: {
  listingId: string;
  listingTitle: string;
  onClose: () => void;
}) {
  const { people, referListing } = useStore();
  const { show } = useToast();
  const [note, setNote] = useState("");
  const circle = people.filter((p) => p.inMyCircle);

  function refer(peerId: string, name: string) {
    referListing(peerId, listingId, note);
    onClose();
    show(`برای ${name} فرستاده شد ✓`);
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="refer-sheet-title"
      maxHeight="85dvh"
    >
      <h2 id="refer-sheet-title" className="font-bold text-lg shrink-0 text-ink dark:text-zinc-100">
        معرفی به دوست
      </h2>
      <p className="text-xs text-ink-faint mt-1 mb-3 shrink-0 line-clamp-1">
        «{listingTitle}» را داخل حلقه‌ی اعتمادت معرفی کن
      </p>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="یک یادداشت کوتاه (اختیاری)… مثلاً: فکر کردم به‌دردت می‌خوره"
        className="field mb-3 shrink-0"
      />

      <p className="text-xs font-medium text-ink-muted mb-2 shrink-0">
        برای چه کسی بفرستم؟
      </p>
      <div className="overflow-y-auto -mx-1 px-1 space-y-0.5 divide-y divide-stone-100 dark:divide-zinc-800">
        {circle.length === 0 ? (
          <p className="text-sm text-ink-faint py-6 text-center">
            هنوز کسی در حلقه‌ی شما نیست.
          </p>
        ) : (
          circle.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => refer(p.id, p.name)}
              className="w-full flex items-center gap-3 py-2.5 px-1 rounded-lg active:bg-stone-50 dark:active:bg-zinc-800 text-right"
            >
              <Avatar name={p.name} level={p.level} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink dark:text-zinc-200">{p.name}</p>
                <p className="text-[11px] text-ink-faint">
                  {relationLabels[p.relation]}
                </p>
              </div>
              <span className="text-[11px] font-medium text-brand-600 dark:text-brand-300">
                ارسال
              </span>
            </button>
          ))
        )}
      </div>

      <button type="button" onClick={onClose} className="btn-ghost w-full mt-4 shrink-0">
        انصراف
      </button>
    </SheetShell>
  );
}
