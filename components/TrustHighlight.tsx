"use client";

import type { Endorsement, TrustHop } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  endorsementHighlightLine,
  trustHighlightMessage,
} from "@/lib/trust";
import { ShieldCheckIcon } from "./Icons";

/**
 * Prominent trust signal for feed cards — the core product differentiator.
 */
export default function TrustHighlight({
  posterId,
  trustPath,
  endorsements = [],
  posterRole = "فروشنده",
}: {
  posterId: string;
  trustPath: TrustHop[];
  endorsements?: Endorsement[];
  posterRole?: string;
}) {
  const { getPerson } = useStore();
  const trust = trustHighlightMessage(
    posterId,
    trustPath,
    getPerson,
    posterRole,
  );
  if (!trust) return null;

  const endorsementLine = endorsementHighlightLine(endorsements, getPerson);
  const isOwn = posterId === "me";

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
