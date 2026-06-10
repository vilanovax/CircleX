"use client";

import Link from "next/link";
import type { Request } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import TrustPath from "./TrustPath";

export default function RequestCard({ request }: { request: Request }) {
  const { getOffers, hasOffered } = useStore();
  const offers = getOffers(request.id);
  const offered = hasOffered(request.id);

  return (
    <Link
      href={`/request/${request.id}`}
      className="card block p-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-50 to-zinc-100 dark:from-amber-500/10 dark:to-zinc-800 flex items-center justify-center text-3xl shrink-0">
          {request.image}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="chip bg-amber-50 text-amber-600">🔎 درخواست</span>
            <span className="chip bg-zinc-100 text-zinc-500">{request.category}</span>
          </div>
          <h3 className="font-semibold text-[15px] text-zinc-900 leading-snug line-clamp-2">
            {request.title}
          </h3>
        </div>
      </div>

      <p className="text-sm text-zinc-600 leading-relaxed mt-2 line-clamp-2">
        {request.description}
      </p>

      <div className="mt-2.5 pt-2.5 border-t border-zinc-100 space-y-1.5">
        <TrustPath
          posterId={request.requesterId}
          trustPath={request.trustPath}
          variant="compact"
          posterRole="درخواست‌دهنده"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span>📍 {request.city}</span>
            <span>·</span>
            <span>{request.postedAt}</span>
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
            <span className="text-xs font-bold text-brand-700 nums">
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
  );
}
