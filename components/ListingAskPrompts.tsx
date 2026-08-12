"use client";

import type { BuyerPrompt } from "@/lib/listing-prompts";

export default function ListingAskPrompts({
  prompts,
  onPick,
  title = "از فروشنده بپرس",
  compact = false,
}: {
  prompts: BuyerPrompt[];
  onPick: (prompt: BuyerPrompt) => void;
  title?: string;
  /** Denser chips for sticky footers. */
  compact?: boolean;
}) {
  if (prompts.length === 0) return null;

  return (
    <section aria-label={title}>
      {!compact && (
        <p className="text-[11px] font-semibold text-ink-faint mb-2 px-0.5">
          {title}
        </p>
      )}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {prompts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className={`shrink-0 rounded-full border transition-transform active:scale-[0.97] ${
              compact
                ? "px-3 py-1.5 text-[11.5px] font-semibold border-stone-200/90 dark:border-zinc-700 bg-stone-50/90 dark:bg-zinc-800/80 text-ink dark:text-zinc-100"
                : "chip !px-3 !py-1.5 !text-[12px] border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] text-ink dark:text-zinc-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>
  );
}
