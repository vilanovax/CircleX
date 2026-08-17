"use client";

import type { BuyerPrompt } from "@/lib/listing-prompts";

export default function ListingAskPrompts({
  prompts,
  onPick,
  title = "از فروشنده بپرس",
  compact = false,
  /** Hide the section label (chips only). */
  hideTitle = false,
}: {
  prompts: BuyerPrompt[];
  onPick: (prompt: BuyerPrompt) => void;
  title?: string;
  /** Denser chips for sticky footers. */
  compact?: boolean;
  hideTitle?: boolean;
}) {
  if (prompts.length === 0) return null;

  return (
    <section aria-label={title}>
      {!hideTitle && (
        <p
          className={`font-semibold text-ink-faint px-0.5 ${
            compact ? "text-[10px] mb-1.5" : "text-[11px] mb-2"
          }`}
        >
          {title}
        </p>
      )}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
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
