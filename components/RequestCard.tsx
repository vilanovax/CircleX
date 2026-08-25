"use client";

import { memo } from "react";
import Link from "next/link";
import type { Request } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatRequestBudget, privacyLabels } from "@/lib/labels";
import { placeCardLabel } from "@/lib/place";
import { privacyAudience } from "@/lib/trust";
import { toPersianDigits } from "@/lib/persian";
import ListingImage from "./ListingImage";
import TrustHighlight from "./TrustHighlight";

function RequestCard({
  request,
  compactTrust = false,
  hideTrust = false,
  /** Requests-only feed: no extra «درخواست» chip — the tab already says it. */
  feedStyle = false,
}: {
  request: Request;
  compactTrust?: boolean;
  hideTrust?: boolean;
  feedStyle?: boolean;
}) {
  const showKind = !feedStyle && !hideTrust;
  const offerCount = useStore((s) => {
    let n = 0;
    for (const offer of s.offers) {
      if (offer.requestId === request.id) n += 1;
    }
    return n;
  });
  const offered = useStore((s) => {
    for (const offer of s.offers) {
      if (offer.requestId === request.id && offer.fromId === "me") return true;
    }
    return false;
  });
  const people = useStore((s) =>
    compactTrust || hideTrust ? null : s.people,
  );
  const budgetLine =
    request.budget != null || request.budgetUnit === "negotiable"
      ? formatRequestBudget(request.budget, request.budgetUnit)
      : null;
  const place = placeCardLabel(request.city, request.area);

  return (
    <article
      className={`card active:scale-[0.99] transition-transform duration-150 ${
        compactTrust ? "p-2.5" : "p-3"
      }`}
    >
      {!hideTrust && (
        <TrustHighlight
          posterId={request.requesterId}
          trustPath={request.trustPath}
          endorsements={request.endorsements}
          posterRole="درخواست‌دهنده"
          contentKind="request"
          variant={compactTrust ? "compact" : "default"}
        />
      )}

      <Link href={`/request/${request.id}`} className="block group">
        <div
          className={`flex items-start ${compactTrust ? "gap-2.5" : "gap-3"}`}
        >
          <ListingImage
            image={request.image}
            alt={request.title}
            size="sm"
            category={request.category}
            frameClassName="w-14 h-14 rounded-xl overflow-hidden shrink-0"
          />
          <div className="min-w-0 flex-1">
            {showKind && (
              <p className="text-[11px] font-bold text-ink-faint dark:text-zinc-500 mb-0.5">
                درخواست
                {request.category ? ` · ${request.category}` : ""}
              </p>
            )}
            <h3
              className={`font-bold text-ink dark:text-zinc-50 leading-snug line-clamp-2 group-active:opacity-80 ${
                compactTrust ? "text-[14px]" : "text-[15px]"
              }`}
            >
              {request.title}
            </h3>
            <div className={compactTrust ? "mt-0.5" : "mt-1"}>
              {budgetLine ? (
                <span className="text-ink dark:text-zinc-100 font-extrabold text-[14px] nums tracking-tight">
                  {budgetLine}
                </span>
              ) : (
                <span className="text-ink-muted dark:text-zinc-400 font-bold text-[13px]">
                  مبلغ مشخص نشده
                </span>
              )}
            </div>
            {compactTrust && (
              <p className="mt-1 text-[11px] font-medium text-ink-muted dark:text-zinc-400 truncate">
                {!showKind && request.category ? (
                  <>
                    <span>{request.category}</span>
                    <span
                      className="text-stone-400 dark:text-zinc-600"
                      aria-hidden
                    >
                      {" · "}
                    </span>
                  </>
                ) : null}
                <span>{place || request.city}</span>
                <span
                  className="text-stone-400 dark:text-zinc-600"
                  aria-hidden
                >
                  {" · "}
                </span>
                <span>{request.postedAt}</span>
                {offerCount > 0 ? (
                  <>
                    <span
                      className="text-stone-400 dark:text-zinc-600"
                      aria-hidden
                    >
                      {" · "}
                    </span>
                    <span className="nums">
                      {toPersianDigits(offerCount)} پیشنهاد
                    </span>
                  </>
                ) : null}
              </p>
            )}
            {compactTrust && offered && (
              <p className="text-[11px] text-levelA font-medium mt-1">
                پیشنهادت ثبت شده
              </p>
            )}
          </div>
        </div>

        {!compactTrust && (
          <>
            {request.description.trim() ? (
              <p className="text-[13px] text-ink-muted dark:text-zinc-300 leading-relaxed mt-2 line-clamp-2">
                {request.description}
              </p>
            ) : null}
            <div className="flex items-center gap-1.5 text-[11px] text-ink-muted dark:text-zinc-400 mt-2.5 pt-2 border-t border-stone-200/50 dark:border-zinc-800">
              <span className="truncate">{place || request.city}</span>
              <span className="text-stone-400 dark:text-zinc-600" aria-hidden>
                ·
              </span>
              <span className="shrink-0">{request.postedAt}</span>
              {offerCount > 0 && (
                <span className="nums shrink-0">
                  · {toPersianDigits(offerCount)} پیشنهاد
                </span>
              )}
              {!hideTrust && people && (
                <span
                  className="mr-auto max-w-[9.5rem] truncate text-[11px] text-ink-muted dark:text-zinc-500"
                  title={privacyAudience(request.privacy, people)}
                >
                  {privacyLabels[request.privacy]}
                </span>
              )}
            </div>
            {offered && (
              <p className="text-[11px] text-levelA font-medium mt-2">
                پیشنهادت ثبت شده
              </p>
            )}
          </>
        )}
      </Link>
    </article>
  );
}

export default memo(RequestCard);
