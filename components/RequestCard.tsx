"use client";

import Link from "next/link";
import type { Request } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatPrice, privacyEmoji, privacyLabels } from "@/lib/labels";
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

  return (
    <article className="card p-3 active:scale-[0.99] transition-transform">
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

      <Link href={`/request/${request.id}`} className="block">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-50 to-zinc-100 dark:from-amber-500/10 dark:to-zinc-800 flex items-center justify-center text-3xl shrink-0">
            {request.image}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="chip bg-amber-50 text-amber-600 dark:bg-amber-500/15">
                🔎 درخواست
              </span>
              <span className="chip bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                {request.category}
              </span>
            </div>
            <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
              {request.title}
            </h3>
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mt-2 line-clamp-2">
          {request.description}
        </p>

        <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">
              <span>📍 {request.city}</span>
              <span>·</span>
              <span>{request.postedAt}</span>
              <span>·</span>
              <span title={privacyAudience(request.privacy, circle)}>
                {privacyEmoji[request.privacy]} {privacyLabels[request.privacy]}
              </span>
              {offers.length > 0 && (
                <>
                  <span>·</span>
                  <span className="text-brand-600 font-medium">
                    {toPersianDigits(offers.length)} پیشنهاد
                  </span>
                </>
              )}
            </div>
            {request.budget != null && (
              <span className="text-xs font-bold text-brand-700 dark:text-brand-300 nums shrink-0">
                تا {formatPrice(request.budget)}
              </span>
            )}
          </div>
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
