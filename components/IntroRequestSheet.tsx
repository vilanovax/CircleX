"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import { useToast } from "./Toast";
import Avatar from "./Avatar";
import { relationEmoji, relationLabels } from "@/lib/labels";

type ItemKind = "listing" | "request" | "event" | "person";

const TEMPLATES: Record<ItemKind, (title: string) => string> = {
  listing: (title) => `سلام! می‌تونی منو به آگهی «${title}» معرفی کنی؟`,
  request: (title) => `سلام! می‌تونی منو به درخواست «${title}» معرفی کنی؟`,
  event: (title) => `سلام! می‌تونی منو به رویداد «${title}» معرفی کنی؟`,
  person: (title) => `سلام! می‌تونی منو به ${title} معرفی کنی؟`,
};

export default function IntroRequestSheet({
  itemTitle,
  itemKind,
  onClose,
}: {
  itemTitle: string;
  itemKind: ItemKind;
  onClose: () => void;
}) {
  const router = useRouter();
  const { people, addMessage } = useStore();
  const { show } = useToast();
  const circle = people.filter((p) => p.inMyCircle);
  const message = TEMPLATES[itemKind](itemTitle);
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose);

  function request(peerId: string, name: string) {
    addMessage(peerId, message);
    onClose();
    show(`درخواست معرفی برای ${name} فرستاده شد ✓`);
    router.push(`/messages/${peerId}`);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-request-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 animate-slide-up max-h-[85dvh] flex flex-col outline-none"
        >
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4 shrink-0" />
          <h2 id="intro-request-title" className="font-bold text-lg shrink-0 text-zinc-900 dark:text-zinc-100">
            درخواست معرفی
          </h2>
          <p className="text-xs text-zinc-400 mt-1 mb-3 shrink-0 leading-relaxed">
            {itemKind === "person"
              ? `از کسی در حلقه‌ات بخواه تو را به ${itemTitle} معرفی کند.`
              : `از کسی در حلقه‌ات بخواه تو را به «${itemTitle}» معرفی کند.`}
          </p>

          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 shrink-0">
            از چه کسی بخواهم؟
          </p>
          <div className="overflow-y-auto -mx-1 px-1 space-y-1">
            {circle.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">
                اول باید حلقه‌ات را بسازی.
              </p>
            ) : (
              circle.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => request(p.id, p.name)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl active:bg-zinc-50 dark:active:bg-zinc-800 text-right"
                >
                  <Avatar name={p.name} level={p.level} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{p.name}</p>
                    <p className="text-[11px] text-zinc-400">
                      {relationEmoji[p.relation]} {relationLabels[p.relation]}
                    </p>
                  </div>
                  <span className="chip bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300">
                    درخواست
                  </span>
                </button>
              ))
            )}
          </div>

          <button type="button" onClick={onClose} className="btn-ghost w-full mt-4 shrink-0">
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
