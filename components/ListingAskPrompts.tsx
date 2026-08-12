"use client";

import type { BuyerPrompt } from "@/lib/listing-prompts";

export default function ListingAskPrompts({
  prompts,
  onPick,
  title = "از فروشنده بپرس",
}: {
  prompts: BuyerPrompt[];
  onPick: (prompt: BuyerPrompt) => void;
  title?: string;
}) {
  if (prompts.length === 0) return null;

  return (
    <section className="mb-1" aria-label={title}>
      <p className="text-[11px] font-semibold text-ink-faint mb-2 px-0.5">
        {title}
      </p>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-0.5 px-0.5">
        {prompts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className="shrink-0 chip !px-3 !py-1.5 !text-[12px] border border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] text-ink dark:text-zinc-100 active:scale-[0.97] transition-transform"
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>
  );
}
