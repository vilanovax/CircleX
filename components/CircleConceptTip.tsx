"use client";

import { useCallback, useEffect, useState } from "react";
import { isConceptTipPending, markConceptTipSeen } from "@/lib/home-tip";

/**
 * One-shot concept line after the circle exists — not a feature tour.
 * Same copy on home and حلقه so the first live surface teaches the product.
 */
export default function CircleConceptTip({
  hidden = false,
}: {
  hidden?: boolean;
}) {
  // localStorage only after mount — useState(isConceptTipPending) hydrates
  // false on the server and true on the client when the tip is still pending.
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isConceptTipPending());
  }, []);

  const dismiss = useCallback(() => {
    markConceptTipSeen();
    setShow(false);
  }, []);

  if (hidden || !show) return null;

  return (
    <div className="px-4 pt-3 listing-detail-rise">
      <div className="relative rounded-2xl bg-brand-50/80 dark:bg-brand-500/10 ring-1 ring-brand-100/70 dark:ring-brand-500/20 px-3.5 py-2.5">
        <p className="text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug pe-7">
          خرید، فروش و کمک گرفتن از آدم‌های مورد اعتماد
        </p>
        <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug pe-7">
          همه‌چیز از حلقهٔ تو می‌آید، نه از غریبه‌ها.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 left-2 w-7 h-7 rounded-full text-ink-faint hover:bg-stone-200/60 dark:hover:bg-zinc-800 flex items-center justify-center text-sm active:scale-95"
          aria-label="بستن راهنما"
        >
          ×
        </button>
      </div>
    </div>
  );
}
