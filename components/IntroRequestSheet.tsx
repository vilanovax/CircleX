"use client";

import { useRouter } from "next/navigation";
import SheetShell from "@/components/SheetShell";
import { useStore } from "@/lib/store";
import { useToast } from "./Toast";
import Avatar from "./Avatar";
import { relationLabels } from "@/lib/labels";

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

  function request(peerId: string, name: string) {
    addMessage(peerId, message);
    onClose();
    show(`درخواست معرفی برای ${name} فرستاده شد ✓`);
    router.push(`/messages/${peerId}`);
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="intro-request-title"
      maxHeight="85dvh"
    >
      <h2 id="intro-request-title" className="font-bold text-lg shrink-0 text-ink dark:text-zinc-100">
        درخواست معرفی
      </h2>
      <p className="text-xs text-ink-faint mt-1 mb-3 shrink-0 leading-relaxed">
        {itemKind === "person"
          ? `از کسی در حلقه‌ات بخواه تو را به ${itemTitle} معرفی کند.`
          : `از کسی در حلقه‌ات بخواه تو را به «${itemTitle}» معرفی کند.`}
      </p>

      <p className="text-xs font-medium text-ink-muted mb-2 shrink-0">
        از چه کسی بخواهم؟
      </p>
      <div className="overflow-y-auto -mx-1 px-1 space-y-0.5 divide-y divide-stone-100 dark:divide-zinc-800">
        {circle.length === 0 ? (
          <p className="text-sm text-ink-faint py-6 text-center">
            اول باید حلقه‌ات را بسازی.
          </p>
        ) : (
          circle.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => request(p.id, p.name)}
              className="w-full flex items-center gap-3 py-2.5 px-1 rounded-lg active:bg-stone-50 dark:active:bg-zinc-800 text-right"
            >
              <Avatar name={p.name} level={p.level} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink dark:text-zinc-200">{p.name}</p>
                <p className="text-[11px] text-ink-faint">
                  {relationLabels[p.relation]}
                </p>
              </div>
              <span className="text-[11px] font-medium text-brand-600 dark:text-brand-300">
                درخواست
              </span>
            </button>
          ))
        )}
      </div>

      <button type="button" onClick={onClose} className="btn-ghost w-full mt-4 shrink-0">
        انصراف
      </button>
    </SheetShell>
  );
}
