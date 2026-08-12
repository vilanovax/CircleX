"use client";

import Link from "next/link";
import type { Endorsement, TrustHop } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  endorsementHighlightLine,
  posterCardRelation,
  posterProximityLabel,
  trustHighlightMessage,
  type TrustContentKind,
} from "@/lib/trust";
import { ShieldCheckIcon } from "./Icons";
import Avatar from "./Avatar";

const ENDORSED_SHORT: Record<TrustContentKind, string> = {
  listing: "تأیید آگهی",
  request: "تأیید درخواست",
  event: "تأیید رویداد",
};

/**
 * Trust signal for cards — full on detail pages, compact one-line row on feed.
 * Compact: name (ink) · relation (muted) + optional degree for FoF + endorsement chip.
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
  const relation = posterCardRelation(poster, { isOwn, contentKind });
  const proximity = isOwn ? null : posterProximityLabel(poster, trustPath);
  const endorsedLabel = ENDORSED_SHORT[contentKind];

  if (variant === "line") {
    const inner = (
      <>
        <Avatar
          name={poster.name}
          src={poster.avatar}
          level={isOwn ? undefined : poster.level}
          showLevel={false}
          size="sm"
        />
        <span className="text-[13px] min-w-0 truncate">
          <span className="font-bold text-ink dark:text-zinc-50">
            {poster.name}
          </span>
          <span className="font-medium text-ink-muted dark:text-zinc-400">
            {" · "}
            {relation}
          </span>
          {proximity && (
            <span className="text-zinc-400 dark:text-zinc-500">
              {" · "}
              {proximity}
            </span>
          )}
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
        {endorsementLine && !isOwn && (
          <span
            className="shrink-0 inline-flex items-center gap-0.5 text-levelA"
            title={endorsementLine}
            aria-label={endorsementLine}
          >
            <ShieldCheckIcon className="w-3.5 h-3.5" aria-hidden />
          </span>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    const personRow = (
      <>
        <Avatar
          name={poster.name}
          src={poster.avatar}
          level={isOwn ? undefined : poster.level}
          showLevel={false}
          size="sm"
        />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[12.5px] truncate">
            <span className="font-extrabold text-ink dark:text-zinc-50">
              {poster.name}
            </span>
            <span className="font-medium text-ink-muted dark:text-zinc-400">
              {" · "}
              {relation}
            </span>
          </p>
          {proximity && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
              {proximity}
            </p>
          )}
        </div>
        {endorsementLine && !isOwn && (
          <span
            className="shrink-0 inline-flex items-center gap-1 rounded-md bg-levelA/10 text-levelA px-1.5 py-0.5 text-[10px] font-bold"
            title={endorsementLine}
            aria-label={endorsementLine}
          >
            <ShieldCheckIcon className="w-3 h-3" aria-hidden />
            {endorsedLabel}
          </span>
        )}
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
          title={isOwn ? undefined : endorsedLabel}
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
          {proximity && !isOwn && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              {proximity}
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
