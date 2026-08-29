"use client";

import Link from "next/link";
import type { NetworkLink, Person, TrustHop } from "@/lib/types";
import { useStore } from "@/lib/store";
import { relationTowardName } from "@/lib/labels";
import Avatar from "@/components/Avatar";
import { viewerRelationPhrase } from "@/lib/trust";

/**
 * Visualises how the viewer is connected to a poster.
 * compact → one short sentence for cards.
 * full → avatar chain poster → connectors (viewer avatar omitted for clarity;
 * relation labels like «خانواده شما» still point at you).
 *
 * trustPath is stored me-side first, so we reverse it to render poster→connectors.
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
  const networkLinks = useStore((s) => s.networkLinks);
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
      text = via ? `${poster.name} ← ${via}` : poster.name;
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

  const hopTowardViewer = (h: TrustHop, p?: Person) => {
    const raw = h.relationLabel?.trim();
    if (raw) return raw.replace(/\s*من\s*$/, " شما").trim();
    if (p) return viewerRelationPhrase(p);
    return "";
  };

  const posterToFirstHop = (): string => {
    if (direct || towardMe.length === 0) {
      return !isMine ? viewerRelationPhrase(poster) : "";
    }
    const first = towardMe[0];
    if (first.priorRelationLabel?.trim()) return first.priorRelationLabel.trim();
    const bridge = getPerson(first.personId);
    if (!bridge) return "";
    return (
      priorLabelFromLinks(posterId, bridge.id, bridge.name, networkLinks) ?? ""
    );
  };

  // Poster → connectors only (no «شما» node).
  const chain = [
    node(poster.name, posterToFirstHop(), poster.avatar),
    ...towardMe.map((h) => {
      const p = getPerson(h.personId);
      return node(p?.name ?? "؟", hopTowardViewer(h, p), p?.avatar);
    }),
  ];

  const pathSummary = !direct && !isMine ? buildPathSummary(chain) : "";

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
        {chain.map((n, i) => (
          <div key={`${n.name}-${i}`} className="flex items-center gap-1.5 shrink-0">
            <div className="flex flex-col items-center w-[4.5rem]">
              <div className="rounded-full ring-2 ring-white/80 dark:ring-zinc-900/80 shadow-sm">
                <Avatar
                  name={n.name}
                  src={n.avatar}
                  size="profile"
                  showLevel={false}
                />
              </div>
              <span className="text-[12px] font-semibold mt-1.5 text-ink dark:text-zinc-100 truncate max-w-full">
                {n.name}
              </span>
              {n.sub ? (
                <span className="text-[11px] text-ink-muted leading-tight text-center mt-0.5 line-clamp-2">
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
          ارتباط مستقیم · {viewerRelationPhrase(poster)}
        </p>
      )}
      {pathSummary ? (
        <p className="text-[12px] text-ink-muted font-medium mt-2.5 leading-relaxed">
          {pathSummary}
        </p>
      ) : null}
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

function priorLabelFromLinks(
  posterId: string,
  bridgeId: string,
  bridgeName: string,
  links: NetworkLink[],
): string | undefined {
  const link = links.find(
    (l) =>
      (l.fromId === bridgeId && l.toId === posterId) ||
      (l.fromId === posterId && l.toId === bridgeId),
  );
  if (!link) return undefined;
  return relationTowardName(link.relationType, bridgeName);
}

function buildPathSummary(
  chain: { name: string; sub: string }[],
): string {
  const parts = chain
    .filter((n) => n.sub)
    .map((n) => `${n.name} (${n.sub})`);
  if (parts.length === 0) return "از طریق آشنایان";
  return parts.join(" · ");
}
