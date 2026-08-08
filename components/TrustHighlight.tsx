"use client";

import Link from "next/link";
import type { Endorsement, TrustHop } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  endorsementHighlightLine,
  trustHighlightMessage,
  viewerRelationPhrase,
  type TrustContentKind,
} from "@/lib/trust";
import { ShieldCheckIcon } from "./Icons";
import Avatar from "./Avatar";

/**
 * Trust signal for cards — full on detail pages, compact one-line row on feed.
 * Compact variant is the product signature: who + one endorsement line.
 */
export default function TrustHighlight({
  posterId,
  trustPath,
  endorsements = [],
  posterRole = "فروشنده",
  contentKind = "listing",
  variant = "default",
}: {
  posterId: string;
  trustPath: TrustHop[];
  endorsements?: Endorsement[];
  posterRole?: string;
  contentKind?: TrustContentKind;
  variant?: "default" | "compact" | "line";
}) {
  const { getPerson } = useStore();
  const trust = trustHighlightMessage(
    posterId,
    trustPath,
    getPerson,
    posterRole,
    contentKind,
  );
  if (!trust) return null;

  const poster = getPerson(posterId);
  if (!poster) return null;

  const endorsementLine = endorsementHighlightLine(
    endorsements,
    getPerson,
    contentKind,
  );
  const isOwn = posterId === "me";
  const ownRelation: Record<TrustContentKind, string> = {
    listing: "آگهی شما",
    request: "درخواست شما",
    event: "رویداد شما",
  };

  if (variant === "line") {
    const relation =
      trust.subline ?? (isOwn ? ownRelation[contentKind] : viewerRelationPhrase(poster));

    const inner = (
      <>
        <Avatar name={poster.name} level={isOwn ? undefined : poster.level} size="sm" />
        <span className="text-[13px] min-w-0 truncate">
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">
            {poster.name}
          </span>
          <span className={isOwn ? "text-zinc-500 dark:text-zinc-400" : "text-brand-700 dark:text-brand-300"}>
            {" · "}
            {relation}
          </span>
        </span>
      </>
    );

    return (
      <div className="flex items-center gap-2 mb-2.5 min-w-0">
        {isOwn ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">{inner}</div>
        ) : (
          <Link
            href={`/person/${posterId}`}
            className="flex items-center gap-2 min-w-0 flex-1 active:opacity-80"
          >
            {inner}
          </Link>
        )}
        <ShieldCheckIcon className="w-4 h-4 text-brand-500 shrink-0" aria-hidden />
      </div>
    );
  }

  if (variant === "compact") {
    const relation =
      trust.subline ?? (isOwn ? ownRelation[contentKind] : viewerRelationPhrase(poster));

    const personRow = (
      <>
        <Avatar name={poster.name} level={isOwn ? undefined : poster.level} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-ink dark:text-zinc-100 truncate leading-tight">
            {poster.name}
            <span className="font-medium text-ink-muted dark:text-zinc-400">
              {" "}
              · {relation}
            </span>
          </p>
          {endorsementLine && !isOwn && (
            <p className="flex items-center gap-1 text-[11px] text-levelA font-semibold mt-0.5 truncate leading-tight">
              <ShieldCheckIcon className="w-3 h-3 shrink-0" aria-hidden />
              <span className="truncate">{endorsementLine}</span>
            </p>
          )}
        </div>
      </>
    );

    return (
      <div className="mb-2.5">
        {isOwn ? (
          <div className="flex items-center gap-2 min-w-0">{personRow}</div>
        ) : (
          <Link
            href={`/person/${posterId}`}
            className="flex items-center gap-2 min-w-0 active:opacity-80"
          >
            {personRow}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 mb-2.5 ${
        isOwn
          ? "bg-stone-50 border-stone-200 dark:bg-zinc-800/50 dark:border-zinc-700"
          : "bg-levelA/5 border-levelA/25 dark:bg-levelA/10 dark:border-levelA/30"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            isOwn
              ? "bg-stone-200/80 text-stone-600 dark:bg-zinc-700"
              : "bg-levelA/15 text-levelA"
          }`}
        >
          <ShieldCheckIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold leading-snug ${
              isOwn
                ? "text-stone-700 dark:text-zinc-200"
                : "text-ink dark:text-zinc-100"
            }`}
          >
            {trust.headline}
          </p>
          {trust.subline && (
            <p
              className={`text-xs font-semibold mt-0.5 leading-relaxed ${
                isOwn ? "text-stone-500" : "text-levelA"
              }`}
            >
              {trust.subline}
            </p>
          )}
          {endorsementLine && !isOwn && (
            <p className="text-[11px] text-levelA font-medium mt-1.5 leading-relaxed">
              ✓ {endorsementLine}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
