"use client";

import { activeCircleCount, firstLiveMemberName } from "@/lib/circle-member";
import { useStore } from "@/lib/store";

/** One line on compose: the listing will land in someone's home. */
export default function CircleFirstListingHint() {
  const count = useStore((s) => activeCircleCount(s.people));
  const name = useStore((s) => firstLiveMemberName(s.people));
  if (count === 0) return null;

  return (
    <p className="text-[13px] text-ink-muted dark:text-zinc-400 leading-relaxed mb-3">
      {count === 1 && name
        ? `بعد از انتشار، ${name} این را در خانه‌اش می‌بیند.`
        : "بعد از انتشار، حلقه‌ات این را در خانه می‌بیند."}
    </p>
  );
}
