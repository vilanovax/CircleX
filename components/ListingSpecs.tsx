import type { ListingSpec } from "@/lib/types";

/** Specs the buyer already sees as title/price chips — skip in the table. */
const HIDDEN = new Set(["قیمت", "قابل مذاکره"]);

export default function ListingSpecs({ specs }: { specs: ListingSpec[] }) {
  const rows = specs.filter((s) => !HIDDEN.has(s.label));
  if (rows.length === 0) return null;

  return (
    <section className="mt-5" aria-labelledby="listing-specs-title">
      <h2
        id="listing-specs-title"
        className="text-[12px] font-bold text-ink-faint tracking-wide mb-2 px-0.5"
      >
        مشخصات
      </h2>
      <dl className="rounded-2xl bg-[color:var(--circle-surface)] dark:bg-zinc-900 ring-1 ring-stone-200/70 dark:ring-zinc-800 divide-y divide-stone-100/90 dark:divide-zinc-800/90 overflow-hidden">
        {rows.map((s) => (
          <div
            key={s.label}
            className="flex items-baseline justify-between gap-4 px-3.5 py-2.5"
          >
            <dt className="text-[12px] text-ink-faint dark:text-zinc-500 shrink-0">
              {s.label}
            </dt>
            <dd className="text-[13px] font-semibold text-ink dark:text-zinc-100 text-end leading-snug nums">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
