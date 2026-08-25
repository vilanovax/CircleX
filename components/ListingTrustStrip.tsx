import { CheckIcon } from "@/components/Icons";
import { visibleEndorsements } from "@/components/Endorsements";
import { badgeResultLabels } from "@/lib/labels";
import type { Listing } from "@/lib/types";

/** Compact ticks only — privacy lives as a one-liner under the title. */
export default function ListingTrustStrip({ listing }: { listing: Listing }) {
  const ticks: string[] = [];
  const seen = new Set<string>();
  for (const e of visibleEndorsements(listing.endorsements)) {
    if (e.type === "word" || seen.has(e.type) || ticks.length >= 3) continue;
    seen.add(e.type);
    ticks.push(badgeResultLabels[e.type]);
  }
  if (ticks.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1.5 px-0.5">
      {ticks.map((line) => (
        <li
          key={line}
          className="flex items-start gap-2 text-[12px] font-medium text-ink dark:text-zinc-200 leading-snug"
        >
          <span className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
