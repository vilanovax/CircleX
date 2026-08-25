"use client";

import { useState } from "react";
import SheetShell from "@/components/SheetShell";
import { EyeOffIcon } from "@/components/Icons";

export default function HideFromFeedSheet({
  kind,
  subject,
  title,
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  kind: "listing" | "person";
  subject: string;
  title: string;
  body: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const headingId =
    kind === "listing" ? "hide-listing-feed-title" : "hide-person-feed-title";

  return (
    <SheetShell
      onClose={() => {
        if (busy) return;
        onClose();
      }}
      labelledBy={headingId}
      maxHeight="70dvh"
      hugContent
      zClass="z-[70]"
      footer={
        <div className="flex gap-2 pb-0.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (busy) return;
              setBusy(true);
              void onConfirm()
                .catch(() => undefined)
                .finally(() => setBusy(false));
            }}
            className="btn-primary flex-1 !py-3.5 disabled:opacity-60"
          >
            {busy ? "صبر کن…" : confirmLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="btn-ghost flex-1 !py-3.5 disabled:opacity-60"
          >
            انصراف
          </button>
        </div>
      }
    >
      <div className="pb-1">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-ink-muted dark:bg-zinc-800 dark:text-zinc-300">
          <EyeOffIcon className="h-5 w-5" />
        </div>
        <h2
          id={headingId}
          className="text-[20px] font-extrabold tracking-tight text-ink dark:text-zinc-50"
        >
          {title}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted dark:text-zinc-400">
          {body}
        </p>
        <p className="mt-3 line-clamp-2 rounded-2xl bg-stone-100/80 px-3 py-2.5 text-[13px] font-bold leading-snug text-ink dark:bg-zinc-800/80 dark:text-zinc-100">
          {subject}
        </p>
      </div>
    </SheetShell>
  );
}
