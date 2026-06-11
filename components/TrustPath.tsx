"use client";

import type { Person, TrustHop } from "@/lib/types";
import { useStore } from "@/lib/store";
import { relationLabels } from "@/lib/labels";

/**
 * Visualises how the viewer ("شما") is connected to a poster.
 * compact → one short sentence for cards.
 * full → an avatar chain with relation labels for the detail page.
 *
 * trustPath is stored me-side first, so we reverse it to render poster→me.
 */
export default function TrustPath({
  posterId,
  trustPath,
  variant = "compact",
  posterRole = "فروشنده",
  viewerRole = "خریدار",
}: {
  posterId: string;
  trustPath: TrustHop[];
  variant?: "compact" | "full";
  posterRole?: string;
  viewerRole?: string;
}) {
  const { getPerson } = useStore();
  const poster = getPerson(posterId);
  if (!poster) return null;

  const isMine = posterId === "me";
  const direct = trustPath.length === 0;
  // Render poster → … → me, so reverse the me-side-first storage order.
  const towardMe = [...trustPath].reverse();

  if (variant === "compact") {
    let text: string;
    if (isMine) {
      text = "آگهی شما";
    } else if (direct) {
      text = `${poster.name} در حلقه‌ی شماست`;
    } else {
      const via = towardMe.map((h) => getPerson(h.personId)?.name).join(" ← ");
      text = `${poster.name} ← ${via} ← شما`;
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <span className="text-brand-500">🔗</span>
        <span className="truncate">{text}</span>
      </div>
    );
  }

  // ---- full variant: avatar chain from poster to "me" ----
  const node = (name: string, avatar: string, sub: string) => ({ name, avatar, sub });
  const chain = [
    node(poster.name, poster.avatar, posterRole),
    ...towardMe.map((h) => {
      const p: Person | undefined = getPerson(h.personId);
      return node(p?.name ?? "?", p?.avatar ?? "❓", h.relationLabel);
    }),
    node("شما", "🧑", viewerRole),
  ];

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
        {chain.map((n, i) => (
          <div key={i} className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col items-center w-16">
              <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center text-xl">
                {n.avatar}
              </div>
              <span className="text-xs font-medium mt-1 text-zinc-800">{n.name}</span>
              <span className="text-[11px] text-zinc-400 leading-tight text-center">{n.sub}</span>
            </div>
            {i < chain.length - 1 && (
              <span className="text-brand-300 text-lg -mt-5">←</span>
            )}
          </div>
        ))}
      </div>
      {direct && !isMine && (
        <p className="text-xs text-levelA mt-1">
          ✓ {poster.name} مستقیماً در حلقه‌ی شماست ({relationLabels[poster.relation]})
        </p>
      )}
    </div>
  );
}
