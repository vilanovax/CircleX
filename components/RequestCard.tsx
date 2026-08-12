"use client";

import Link from "next/link";
import type { Request } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatPrice, privacyLabels } from "@/lib/labels";
import { privacyAudience } from "@/lib/trust";
import { toPersianDigits } from "@/lib/persian";
import TrustHighlight from "./TrustHighlight";

export default function RequestCard({
  request,
  compactTrust = true,
  hideTrust = false,
}: {
  request: Request;
  compactTrust?: boolean;
  /** Hide trust banner — e.g. on the requester's own profile page. */
  hideTrust?: boolean;
}) {
  const { getOffers, hasOffered, people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);
  const offers = getOffers(request.id);
  const offered = hasOffered(request.id);
  /** On profile / compact feed: keep meta short (privacy lives on detail). */
  const slimMeta = compactTrust || hideTrust;

  return (
    <article className="card overflow-hidden active:scale-[0.99] transition-transform">
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
          <div className="w-14 h-14 rounded-xl bg-stone-50 dark:bg-zinc-800/80 ring-1 ring-stone-100 dark:ring-zinc-700/60 flex items-center justify-center text-2xl shrink-0">
            {request.image}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-ink-faint dark:text-zinc-500 mb-0.5">
              {request.category}
            </p>
            <h3 className="font-bold text-[15px] text-ink dark:text-zinc-100 leading-snug line-clamp-2">
              {request.title}
            </h3>
            {request.budget != null && (
              <p className="mt-1 text-[14px] font-extrabold text-ink dark:text-zinc-100 nums tracking-tight">
                تا {formatPrice(request.budget)}
              </p>
            )}
          </div>
        </div>

        <p
          className={`text-[13px] text-ink-muted dark:text-zinc-300 leading-relaxed mt-1.5 ${
            slimMeta ? "line-clamp-1" : "line-clamp-2"
          }`}
        >
          {request.description}
        </p>

        <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-zinc-800 flex items-center gap-1.5 text-[11px] text-ink-muted dark:text-zinc-400 flex-wrap">
          <span>{request.city}</span>
          <span className="text-stone-300" aria-hidden>
            ·
          </span>
          <span>{request.postedAt}</span>
          {offers.length > 0 && (
            <>
              <span className="text-stone-300" aria-hidden>
                ·
              </span>
              <span className="text-ink font-medium nums">
                {toPersianDigits(offers.length)} پیشنهاد
              </span>
            </>
          )}
          {!slimMeta && (
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

        {offered && (
          <p className="text-[11px] text-levelA font-medium mt-2">
            ✓ شما پیشنهاد داده‌اید
          </p>
        )}
      </Link>
    </article>
  );
}
