"use client";

import Link from "next/link";
import type { Person, TrustHop } from "@/lib/types";
import { useStore } from "@/lib/store";
import { relationLabels } from "@/lib/labels";
import { personAvatarHex, personInitials } from "@/lib/avatar";

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
  const node = (name: string, sub: string) => ({ name, sub });
  const chain = [
    node(poster.name, posterRole),
    ...towardMe.map((h) => {
      const p: Person | undefined = getPerson(h.personId);
      return node(p?.name ?? "?", h.relationLabel);
    }),
    node("شما", viewerRole),
  ];

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
        {chain.map((n, i) => (
          <div key={i} className="flex items-center gap-1.5 shrink-0">
            <div className="flex flex-col items-center w-[4.25rem]">
              <div
                className="w-11 h-11 rounded-full text-white font-bold flex items-center justify-center text-base ring-2 ring-white/80 dark:ring-zinc-900/80 shadow-sm"
                style={{ backgroundColor: personAvatarHex(n.name) }}
              >
                {personInitials(n.name)}
              </div>
              <span className="text-[12px] font-semibold mt-1.5 text-ink dark:text-zinc-100 truncate max-w-full">
                {n.name}
              </span>
              <span className="text-[10px] text-ink-faint leading-tight text-center mt-0.5">
                {n.sub}
              </span>
            </div>
            {i < chain.length - 1 && (
              <span
                className="text-[color:var(--circle-trust)]/70 text-base -mt-5 font-bold"
                aria-hidden
              >
                ←
              </span>
            )}
          </div>
        ))}
      </div>
      {direct && !isMine && (
        <p className="text-[12px] text-[color:var(--circle-trust)] font-medium mt-2.5 leading-relaxed">
          ✓ {poster.name} مستقیماً در حلقه‌ی شماست (
          {relationLabels[poster.relation]})
        </p>
      )}
      <Link
        href="/graph"
        className="inline-flex items-center gap-1 text-[12px] text-brand-600 dark:text-brand-400 font-semibold mt-3.5"
      >
        نقشه‌ی کامل حلقه را ببین ‹
      </Link>
    </div>
  );
}
