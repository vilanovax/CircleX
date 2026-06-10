"use client";

import type { Listing } from "@/lib/types";
import { useStore } from "@/lib/store";
import { relationLabels } from "@/lib/labels";

/**
 * Visualises how the viewer ("من") is connected to the seller.
 * compact → one short sentence for cards.
 * full → an avatar chain with relation labels for the detail page.
 */
export default function TrustPath({
  listing,
  variant = "compact",
}: {
  listing: Listing;
  variant?: "compact" | "full";
}) {
  const { getPerson } = useStore();
  const seller = getPerson(listing.sellerId);
  if (!seller) return null;

  const isMine = listing.sellerId === "me";
  const direct = listing.trustPath.length === 0;

  if (variant === "compact") {
    let text: string;
    if (isMine) {
      text = "آگهی شما";
    } else if (direct) {
      text = `${seller.name} در حلقه‌ی شماست`;
    } else {
      const via = listing.trustPath.map((h) => getPerson(h.personId)?.name).join(" ← ");
      text = `${seller.name} ← ${via} ← شما`;
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <span className="text-brand-500">🔗</span>
        <span className="truncate">{text}</span>
      </div>
    );
  }

  // ---- full variant: avatar chain from seller to "me" ----
  const chain = [
    { name: seller.name, avatar: seller.avatar, sub: "فروشنده" },
    ...listing.trustPath.map((h) => {
      const p = getPerson(h.personId);
      return { name: p?.name ?? "?", avatar: p?.avatar ?? "❓", sub: h.relationLabel };
    }),
    { name: "شما", avatar: "🧑", sub: "خریدار" },
  ];

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
        {chain.map((node, i) => (
          <div key={i} className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col items-center w-16">
              <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center text-xl">
                {node.avatar}
              </div>
              <span className="text-xs font-medium mt-1 text-zinc-800">{node.name}</span>
              <span className="text-[10px] text-zinc-400 leading-tight text-center">{node.sub}</span>
            </div>
            {i < chain.length - 1 && (
              <span className="text-brand-300 text-lg -mt-5">←</span>
            )}
          </div>
        ))}
      </div>
      {direct && !isMine && (
        <p className="text-xs text-levelA mt-1">
          ✓ {seller.name} مستقیماً در حلقه‌ی شماست ({relationLabels[seller.relation]})
        </p>
      )}
    </div>
  );
}
