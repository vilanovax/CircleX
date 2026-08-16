"use client";

import Link from "next/link";
import type { Person, TrustHop } from "@/lib/types";
import { useStore } from "@/lib/store";
import { relationLabels } from "@/lib/labels";
import { resolveAvatarSrc } from "@/lib/avatar";
import { viewerRelationPhrase } from "@/lib/trust";

/**
 * Visualises how the viewer ("شما") is connected to a poster.
 * compact → one short sentence for cards.
 * full → an avatar chain with social relation labels (not buyer/seller roles).
 *
 * trustPath is stored me-side first, so we reverse it to render poster→me.
 */
export default function TrustPath({
  posterId,
  trustPath,
  variant = "compact",
  showGraphLink = true,
}: {
  posterId: string;
  trustPath: TrustHop[];
  variant?: "compact" | "full";
  showGraphLink?: boolean;
}) {
  const getPerson = useStore((s) => s.getPerson);
  const meAvatar = useStore((s) => s.me.avatar);
  const poster = getPerson(posterId);
  if (!poster) return null;

  const isMine = posterId === "me";
  const direct = trustPath.length === 0;
  const towardMe = [...trustPath].reverse();

  if (variant === "compact") {
    let text: string;
    if (isMine) {
      text = "آگهی شما";
    } else if (direct) {
      text = `${poster.name} · ${viewerRelationPhrase(poster)}`;
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

  const node = (name: string, sub: string, avatar?: string) => ({
    name,
    sub,
    avatar,
  });

  const hopSub = (h: TrustHop, p?: Person) => {
    const raw = h.relationLabel?.trim();
    if (raw) return raw.replace(/\s*من\s*$/, " شما").trim();
    if (p) return viewerRelationPhrase(p);
    return "";
  };

  const chain = [
    node(
      poster.name,
      direct && !isMine ? viewerRelationPhrase(poster) : "",
      poster.avatar,
    ),
    ...towardMe.map((h) => {
      const p = getPerson(h.personId);
      return node(p?.name ?? "؟", hopSub(h, p), p?.avatar);
    }),
    node("شما", "", meAvatar),
  ];

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
        {chain.map((n, i) => (
          <div key={`${n.name}-${i}`} className="flex items-center gap-1.5 shrink-0">
            <div className="flex flex-col items-center w-[4.25rem]">
              <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/80 dark:ring-zinc-900/80 shadow-sm bg-zinc-100 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveAvatarSrc(n.name, n.avatar)}
                  alt=""
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              <span className="text-[12px] font-semibold mt-1.5 text-ink dark:text-zinc-100 truncate max-w-full">
                {n.name}
              </span>
              {n.sub ? (
                <span className="text-[10px] text-ink-muted leading-tight text-center mt-0.5">
                  {n.sub}
                </span>
              ) : null}
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
        <p className="text-[12px] text-ink-muted font-medium mt-2.5 leading-relaxed">
          ارتباط مستقیم · حلقه {relationLabels[poster.relation]}
        </p>
      )}
      {!direct && !isMine && (
        <p className="text-[12px] text-ink-muted font-medium mt-2.5 leading-relaxed">
          از طریق آشنایان
        </p>
      )}
      {showGraphLink && (
        <Link
          href="/graph"
          className="inline-flex items-center gap-1 text-[12px] text-brand-600 dark:text-brand-400 font-semibold mt-3"
        >
          نقشه‌ی ارتباط‌ها را ببین ‹
        </Link>
      )}
    </div>
  );
}
