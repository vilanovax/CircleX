"use client";

import Link from "next/link";
import type { Request } from "@/lib/types";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import { formatRequestBudget, privacyLabels } from "@/lib/labels";
import { privacyAudience } from "@/lib/trust";
import { toPersianDigits } from "@/lib/persian";
import TrustHighlight from "./TrustHighlight";

export default function RequestCard({
  request,
  compactTrust = true,
  hideTrust = false,
  /** Home feed: stronger “want” chrome so it never reads like a sale listing. */
  feedStyle = false,
}: {
  request: Request;
  compactTrust?: boolean;
  /** Hide trust banner — e.g. on the requester's own profile page. */
  hideTrust?: boolean;
  feedStyle?: boolean;
}) {
  /** On profile / compact feed: keep meta short (privacy lives on detail). */
  const slimMeta = compactTrust || hideTrust;
  const offerCount = useStore(
    (s) => s.offers.filter((o) => o.requestId === request.id).length,
  );
  const offered = useStore((s) =>
    s.offers.some((o) => o.requestId === request.id && o.fromId === "me"),
  );
  const people = useStore((s) => (slimMeta ? null : s.people));
  const circle = people ? activeCircle(people) : [];

  return (
    <article
      className={`overflow-hidden active:scale-[0.99] transition-transform ${
        feedStyle
          ? "rounded-2xl border border-amber-200/80 dark:border-amber-500/25 bg-gradient-to-l from-amber-50/90 to-[color:var(--circle-surface)] dark:from-amber-500/10 dark:to-zinc-900 shadow-sm"
          : "card"
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

      <Link href={`/request/${request.id}`} className="block px-3.5 py-3">
        <div className="flex gap-3 items-start">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
              feedStyle
                ? "bg-amber-100/90 dark:bg-amber-500/20 ring-1 ring-amber-200/70 dark:ring-amber-500/30"
                : "bg-stone-50 dark:bg-zinc-800/80 ring-1 ring-stone-100 dark:ring-zinc-700/60"
            }`}
          >
            {request.image}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide ${
                  feedStyle
                    ? "bg-amber-600 text-white"
                    : "bg-stone-200/80 dark:bg-zinc-700 text-ink-muted dark:text-zinc-300"
                }`}
              >
                درخواست
              </span>
              <span className="text-[11px] font-semibold text-ink-faint dark:text-zinc-500">
                {request.category}
              </span>
            </div>
            <h3 className="font-bold text-[15px] text-ink dark:text-zinc-100 leading-snug line-clamp-2">
              {request.title}
            </h3>
            {request.budget != null || request.budgetUnit === "negotiable" ? (
              <p className="mt-1 text-[14px] font-extrabold text-ink dark:text-zinc-100 nums tracking-tight">
                {formatRequestBudget(request.budget, request.budgetUnit)}
              </p>
            ) : feedStyle ? (
              <p className="mt-1 text-[12px] font-semibold text-amber-800/80 dark:text-amber-200/80">
                توافقی یا رایگان هم خوبه
              </p>
            ) : null}
          </div>
        </div>

        {request.description.trim() ? (
          <p
            className={`text-[13px] text-ink-muted dark:text-zinc-300 leading-relaxed mt-1.5 ${
              slimMeta ? "line-clamp-1" : "line-clamp-2"
            }`}
          >
            {request.description}
          </p>
        ) : null}

        <div className="mt-2.5 pt-2 border-t border-stone-100/80 dark:border-zinc-800 flex items-center gap-1.5 text-[11px] text-ink-muted dark:text-zinc-400 flex-wrap">
          <span>{request.city}</span>
          <span className="text-stone-300" aria-hidden>
            ·
          </span>
          <span>{request.postedAt}</span>
          {offerCount > 0 && (
            <>
              <span className="text-stone-300" aria-hidden>
                ·
              </span>
              <span className="text-ink font-medium nums">
                {toPersianDigits(offerCount)} پیشنهاد
              </span>
            </>
          )}
          {!slimMeta && people && (
            <>
              <span className="text-stone-300" aria-hidden>
                ·
              </span>
              <span title={privacyAudience(request.privacy, circle)}>
                {privacyLabels[request.privacy]}
              </span>
            </>
          )}
        </div>

        {feedStyle && !offered && (
          <p className="mt-2.5 text-[12px] font-bold text-amber-800 dark:text-amber-200">
            پیشنهاد بده ←
          </p>
        )}

        {offered && (
          <p className="text-[11px] text-levelA font-medium mt-2">
            ✓ شما پیشنهاد داده‌اید
          </p>
        )}
      </Link>
    </article>
  );
}
