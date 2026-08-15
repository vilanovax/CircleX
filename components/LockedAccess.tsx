"use client";

import { useState } from "react";
import { lazyUi } from "@/lib/lazy-ui";
import { privacyLabels } from "@/lib/labels";
import type { Privacy } from "@/lib/types";

const IntroRequestSheet = lazyUi(() => import("./IntroRequestSheet"));

type ItemKind = "listing" | "request" | "event";

const KIND_LABEL: Record<ItemKind, string> = {
  listing: "آگهی",
  request: "درخواست",
  event: "رویداد",
};

export default function LockedAccess({
  itemTitle,
  itemKind,
  privacy,
}: {
  itemTitle: string;
  itemKind: ItemKind;
  privacy: Privacy;
}) {
  const [showIntro, setShowIntro] = useState(false);
  const kindLabel = KIND_LABEL[itemKind];

  return (
    <>
      <div className="flex flex-col items-center text-center px-8 py-16">
        <div className="w-14 h-14 rounded-2xl bg-stone-100/80 dark:bg-zinc-800 flex items-center justify-center text-2xl mb-4 text-ink-muted">
          🔒
        </div>
        <p className="text-sm text-ink dark:text-zinc-200 leading-relaxed">
          این {kindLabel} را فقط{" "}
          <span className="font-medium">{privacyLabels[privacy]}</span> می‌بینند.
        </p>
        <p className="text-xs text-ink-faint mt-3 leading-relaxed max-w-xs">
          از کسی در حلقه بخواه تو را معرفی کند تا این {kindLabel}{" "}
          را ببینی.
        </p>
        <button
          type="button"
          onClick={() => setShowIntro(true)}
          className="btn-primary mt-6 px-8"
        >
          درخواست معرفی
        </button>
      </div>

      {showIntro && (
        <IntroRequestSheet
          itemTitle={itemTitle}
          itemKind={itemKind}
          onClose={() => setShowIntro(false)}
        />
      )}
    </>
  );
}
