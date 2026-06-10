"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "./Toast";
import Avatar from "./Avatar";
import { relationEmoji, relationLabels } from "@/lib/labels";

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
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="app-shell !min-h-0 !shadow-none relative">
        <div className="bg-white rounded-t-2xl p-5 animate-slide-up max-h-[85dvh] flex flex-col">
          <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4 shrink-0" />
          <h2 className="font-bold text-lg shrink-0">معرفی به دوست</h2>
          <p className="text-xs text-zinc-400 mt-1 mb-3 shrink-0 line-clamp-1">
            «{listingTitle}» را داخل حلقه‌ی اعتمادت معرفی کن
          </p>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="یک یادداشت کوتاه (اختیاری)… مثلاً: فکر کردم به‌دردت می‌خوره"
            className="field mb-3 shrink-0"
          />

          <p className="text-xs font-medium text-zinc-500 mb-2 shrink-0">
            برای چه کسی بفرستم؟
          </p>
          <div className="overflow-y-auto -mx-1 px-1 space-y-1">
            {circle.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">
                هنوز کسی در حلقه‌ی شما نیست.
              </p>
            ) : (
              circle.map((p) => (
                <button
                  key={p.id}
                  onClick={() => refer(p.id, p.name)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl active:bg-zinc-50 text-right"
                >
                  <Avatar emoji={p.avatar} level={p.level} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800">{p.name}</p>
                    <p className="text-[11px] text-zinc-400">
                      {relationEmoji[p.relation]} {relationLabels[p.relation]}
                    </p>
                  </div>
                  <span className="chip bg-brand-50 text-brand-700">ارسال</span>
                </button>
              ))
            )}
          </div>

          <button onClick={onClose} className="btn-ghost w-full mt-4 shrink-0">
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
