"use client";

import { memo, useMemo } from "react";
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
import {
  CIRCLE_MEMBER_NAME,
  isHiddenSellerId,
  listingIdFromHiddenSeller,
  privateListingAvatar,
} from "@/lib/listing-privacy";

const ENDORSED_SHORT: Record<TrustContentKind, string> = {
  listing: "تأیید آگهی",
  request: "تأیید درخواست",
  event: "تأیید رویداد",
};

/**
 * Trust signal for cards — full on detail pages, compact one-line row on feed.
 * Compact: name (ink) · relation (muted) + optional degree for FoF + endorsement chip.
 */
function TrustHighlight({
  posterId,
  trustPath,
  endorsements = [],
  posterRole = "فروشنده",
  contentKind = "listing",
  variant = "default",
  eager = false,
  listingId,
  ownerHiddenPreview = false,
}: {
  posterId: string;
  trustPath: TrustHop[];
  endorsements?: Endorsement[];
  posterRole?: string;
  contentKind?: TrustContentKind;
  variant?: "default" | "compact" | "line";
  /** Above-fold feed faces. */
  eager?: boolean;
  listingId?: string;
  /** Owner sees the same masked face the circle will see. */
  ownerHiddenPreview?: boolean;
}) {
  const hidden = isHiddenSellerId(posterId);
  const getPerson = useStore((s) => s.getPerson);
  const poster = useStore((s) => (hidden ? undefined : s.getPerson(posterId)));
  const visibleEndorsements = useMemo(() => {
    if (contentKind !== "listing") return endorsements;
    return endorsements.filter((e) => !e.hidden || e.personId === "me");
  }, [contentKind, endorsements]);
  const endorsementLine = useMemo(
    () =>
      hidden
        ? null
        : endorsementHighlightLine(visibleEndorsements, getPerson, contentKind),
    [contentKind, getPerson, hidden, visibleEndorsements],
  );
  const defaultTrustPacked = useMemo(() => {
    if (hidden || variant !== "default") return "";
    const t = trustHighlightMessage(
      posterId,
      trustPath,
      getPerson,
      posterRole,
      contentKind,
    );
    return t ? `${t.headline}\n${t.subline ?? ""}` : "";
  }, [
    contentKind,
    getPerson,
    hidden,
    posterId,
    posterRole,
    trustPath,
    variant,
  ]);
  if (hidden) {
    return (
      <div className="mb-1.5 flex items-center gap-2 min-w-0">
        <Avatar
          name={CIRCLE_MEMBER_NAME}
          src={privateListingAvatar(listingIdFromHiddenSeller(posterId) ?? posterId)}
          showLevel={false}
          size="sm"
          eager={eager}
        />
        <div className="min-w-0 leading-tight">
          <p className="text-[13px] truncate">
            <span className="font-extrabold text-ink dark:text-zinc-50">
              {CIRCLE_MEMBER_NAME}
            </span>
            <span className="font-medium text-ink-muted dark:text-zinc-300">
              {" · "}
              داخل حلقهٔ تو
            </span>
          </p>
          <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 truncate">
            هویت برای اعضا پنهان است
          </p>
        </div>
      </div>
    );
  }
  if (ownerHiddenPreview && listingId) {
    return (
      <div className="mb-1.5 flex items-center gap-2 min-w-0">
        <Avatar
          name={CIRCLE_MEMBER_NAME}
          src={privateListingAvatar(listingId)}
          showLevel={false}
          size="sm"
          eager={eager}
        />
        <div className="min-w-0 leading-tight">
          <p className="text-[12.5px] truncate">
            <span className="font-extrabold text-ink dark:text-zinc-50">
              آگهی‌ات
            </span>
            <span className="font-medium text-ink-muted dark:text-zinc-300">
              {" · "}
              هویت پنهان
            </span>
          </p>
          <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 truncate">
            حلقه این چهره را می‌بیند، نه اسم تو
          </p>
        </div>
      </div>
    );
  }
  if (!poster) return null;

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
          eager={eager}
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
          eager={eager}
        />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[12.5px] truncate">
            <span className="font-extrabold text-ink dark:text-zinc-50">
              {poster.name}
            </span>
            <span className="font-medium text-ink-muted dark:text-zinc-300">
              {" · "}
              {relation}
            </span>
          </p>
          {proximity && (
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 truncate">
              {proximity}
            </p>
          )}
        </div>
        {endorsementLine && !isOwn && (
          <span
            className="shrink-0 inline-flex items-center gap-1 rounded-md bg-levelA/10 text-levelA px-1.5 py-0.5 text-[11px] font-bold"
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
      <div className="mb-1.5">
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

  if (!defaultTrustPacked) return null;
  const nl = defaultTrustPacked.indexOf("\n");
  const trust = {
    headline: nl === -1 ? defaultTrustPacked : defaultTrustPacked.slice(0, nl),
    subline: nl === -1 ? undefined : defaultTrustPacked.slice(nl + 1) || undefined,
  };

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

export default memo(TrustHighlight);
