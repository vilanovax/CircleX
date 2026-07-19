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
import { levelShort } from "@/lib/labels";
import { ShieldCheckIcon } from "./Icons";
import Avatar from "./Avatar";

/**
 * Trust signal for cards — full on detail pages, compact one-line row on feed.
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

    return (
      <div className="mb-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          {isOwn ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar name={poster.name} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                  {poster.name}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {relation}
                </p>
              </div>
            </div>
          ) : (
            <Link
              href={`/person/${posterId}`}
              className="flex items-center gap-2 min-w-0 flex-1 active:opacity-80"
            >
              <Avatar name={poster.name} level={poster.level} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                  {poster.name}
                </p>
                <p className="text-[11px] text-brand-700 dark:text-brand-300 truncate">
                  {relation}
                </p>
              </div>
            </Link>
          )}
          {!isOwn && poster.level && (
            <span className="chip bg-zinc-100 dark:bg-zinc-800 text-zinc-500 !text-[10px] shrink-0">
              {levelShort[poster.level]}
            </span>
          )}
          <ShieldCheckIcon className="w-4 h-4 text-brand-500 shrink-0" aria-hidden />
        </div>
        {endorsementLine && !isOwn && (
          <p className="text-[11px] text-levelA font-medium mt-1 pr-11 leading-relaxed">
            ✓ {endorsementLine}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 mb-2.5 ${
        isOwn
          ? "bg-zinc-50 border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700"
          : "bg-brand-50 border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/25"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            isOwn
              ? "bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700"
              : "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
          }`}
        >
          <ShieldCheckIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold leading-snug ${
              isOwn
                ? "text-zinc-700 dark:text-zinc-200"
                : "text-brand-900 dark:text-brand-100"
            }`}
          >
            {trust.headline}
          </p>
          {trust.subline && (
            <p
              className={`text-xs font-semibold mt-0.5 leading-relaxed ${
                isOwn
                  ? "text-zinc-500"
                  : "text-brand-700 dark:text-brand-300"
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
