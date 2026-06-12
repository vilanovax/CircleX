"use client";

import Link from "next/link";
import { privacyEmoji, privacyLabels } from "@/lib/labels";
import { privacyAudience } from "@/lib/trust";
import type { Person, Privacy } from "@/lib/types";

const PRIVACIES: Privacy[] = ["A", "AB", "ABC", "referral", "approved"];

export default function PrivacyPicker({
  value,
  onChange,
  circle,
  showCircleLink = false,
}: {
  value: Privacy;
  onChange: (p: Privacy) => void;
  circle: Person[];
  showCircleLink?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          چه کسانی ببینند؟
        </label>
        {showCircleLink && (
          <Link href="/circle" className="text-xs text-brand-600 font-medium">
            چه کسانی؟ ›
          </Link>
        )}
      </div>
      <div className="space-y-2">
        {PRIVACIES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-right transition-colors ${
              value === p
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/15"
                : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            }`}
          >
            <span className="text-lg shrink-0">{privacyEmoji[p]}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {privacyLabels[p]}
              </span>
              <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                {privacyAudience(p, circle)}
              </span>
            </span>
            <span
              className={`shrink-0 w-4 h-4 rounded-full border-2 ${
                value === p
                  ? "border-brand-600 bg-brand-600"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
