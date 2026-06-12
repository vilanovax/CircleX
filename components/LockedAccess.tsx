"use client";

import { useState } from "react";
import IntroRequestSheet from "./IntroRequestSheet";
import { privacyLabels } from "@/lib/labels";
import type { Privacy } from "@/lib/types";

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
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl mb-4">
          🔒
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          این {kindLabel} فقط برای{" "}
          <span className="font-medium">{privacyLabels[privacy]}</span> قابل نمایش است
          {itemKind === "listing"
            ? " و شما در این محدوده‌ی اعتماد قرار نمی‌گیرید."
            : "."}
        </p>
        <p className="text-xs text-zinc-400 mt-3 leading-relaxed max-w-xs">
          از کسی در حلقه‌ات بخواه تو را معرفی کند تا بتوانی این {kindLabel} را ببینی.
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
