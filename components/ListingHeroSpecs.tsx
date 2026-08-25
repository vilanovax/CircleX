import type { ListingSpec } from "@/lib/types";

export default function ListingHeroSpecs({ specs }: { specs: ListingSpec[] }) {
  if (specs.length !== 3) return null;

  return (
    <div
      className="mt-4 grid grid-cols-3 overflow-hidden rounded-2xl bg-[color:var(--circle-surface)] dark:bg-zinc-900 ring-1 ring-stone-200/70 dark:ring-zinc-800"
      role="list"
    >
      {specs.map((s, i) => (
        <div
          key={s.label}
          role="listitem"
          className={`px-2 py-3 text-center ${
            i < 2
              ? "border-e border-stone-200/70 dark:border-zinc-800"
              : ""
          }`}
        >
          <p className="text-[11px] text-ink-faint dark:text-zinc-500 leading-snug">
            {s.label}
          </p>
          <p className="mt-1 text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug nums">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
