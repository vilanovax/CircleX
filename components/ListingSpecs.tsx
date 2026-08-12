import type { ListingSpec } from "@/lib/types";

export default function ListingSpecs({ specs }: { specs: ListingSpec[] }) {
  if (specs.length === 0) return null;

  return (
    <section className="mt-4" aria-labelledby="listing-specs-title">
      <h2
        id="listing-specs-title"
        className="text-[13px] font-bold text-ink dark:text-zinc-100 mb-2"
      >
        مشخصات
      </h2>
      <dl className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
        {specs.map((s) => (
          <div
            key={s.label}
            className="flex items-start justify-between gap-3 px-3.5 py-2.5"
          >
            <dt className="text-[12px] text-ink-muted dark:text-zinc-400 shrink-0">
              {s.label}
            </dt>
            <dd className="text-[13px] font-semibold text-ink dark:text-zinc-100 text-left leading-snug">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
