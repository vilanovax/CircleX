"use client";

import { toPersianDigits } from "@/lib/persian";

export default function ListingComposeProgress({
  step,
  className = "mt-2",
}: {
  step: "compose" | "review";
  className?: string;
}) {
  const page = step === "review" ? 2 : 1;
  const label = step === "review" ? "یک نگاه آخر" : "عکس و حرف";
  const total = 2;

  return (
    <div
      className={className}
      role="status"
      aria-label={`صفحه ${toPersianDigits(page)} از ${toPersianDigits(total)}: ${label}`}
    >
      <div className="flex gap-1" aria-hidden>
        <span
          className={`h-1 flex-1 rounded-full ${
            page >= 1
              ? "bg-brand-600"
              : "bg-stone-200 dark:bg-zinc-700"
          }`}
        />
        <span
          className={`h-1 flex-1 rounded-full ${
            page >= 2
              ? "bg-brand-600"
              : "bg-stone-200 dark:bg-zinc-700"
          }`}
        />
      </div>
      <p className="mt-1.5 text-[12px] leading-snug text-ink-muted dark:text-zinc-400">
        {`صفحه ${toPersianDigits(page)} از ${toPersianDigits(total)}: ${label}`}
      </p>
    </div>
  );
}
