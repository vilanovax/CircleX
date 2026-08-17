"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SheetShell from "@/components/SheetShell";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import { useToast } from "./Toast";
import { ApiError } from "@/lib/api";
import Avatar from "./Avatar";
import { SearchIcon, SendIcon, ShieldCheckIcon } from "./Icons";
import { relationLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import { viewerRelationPhrase } from "@/lib/trust";

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
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const circle = activeCircle(people);
  const message = TEMPLATES[itemKind](itemTitle);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return circle;
    return circle.filter(
      (p) =>
        p.name.includes(q) || relationLabels[p.relation].includes(q),
    );
  }, [circle, query]);

  async function request(peerId: string, name: string) {
    if (sending) return;
    setSending(true);
    try {
      await addMessage(peerId, message);
      onClose();
      show(`درخواست معرفی برای ${name} فرستاده شد ✓`);
      router.push(`/messages/${peerId}`);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ارسال نشد. دوباره بزن.");
      setSending(false);
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="intro-request-title"
      maxHeight="88dvh"
      zClass="z-50"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-[13px] font-semibold text-ink-muted dark:text-zinc-400 active:text-ink"
        >
          انصراف
        </button>
      }
    >
      <h2
        id="intro-request-title"
        className="font-extrabold text-[1.1rem] text-ink dark:text-zinc-50"
      >
        درخواست معرفی
      </h2>
      <p className="flex items-center gap-1 text-[11px] text-levelA mt-1 mb-2.5 font-medium">
        <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0" />
        پیام از طریق حلقه — نه تماس مستقیم با غریبه
      </p>

      <div className="rounded-2xl border border-stone-200/80 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-800/50 px-3 py-2.5 mb-2.5">
        <p className="text-[11px] text-ink-muted mb-1">پیام پیشنهادی</p>
        <p className="text-[12px] text-ink dark:text-zinc-100 leading-relaxed">
          {message}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[12px] font-bold text-ink dark:text-zinc-200">
          از چه کسی بخواهم؟
        </p>
        <p className="text-[11px] text-ink-faint nums">
          {toPersianDigits(filtered.length)} نفر
        </p>
      </div>

      {circle.length > 3 && (
        <label className="relative block mb-2">
          <SearchIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی نام…"
            className="field !pr-9 !py-2 !text-[13px]"
            autoComplete="off"
          />
        </label>
      )}

      <div className="rounded-2xl border border-stone-200/80 dark:border-zinc-700 overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800 bg-[color:var(--circle-surface)] dark:bg-zinc-900">
        {circle.length === 0 ? (
          <p className="text-sm text-ink-muted py-8 px-4 text-center leading-relaxed">
            اول حلقه‌ات را بساز.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-ink-muted py-8 px-4 text-center">
            کسی با این نام پیدا نشد.
          </p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={sending}
              onClick={() => void request(p.id, p.name)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right active:bg-stone-50/90 dark:active:bg-zinc-800/70 transition-colors disabled:opacity-60"
            >
              <Avatar name={p.name} src={p.avatar} size="sm" showLevel={false} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
                  {p.name}
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                  {viewerRelationPhrase(p)}
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-brand-600 text-white text-[11px] font-bold px-2.5 py-1.5 shadow-sm shadow-brand-600/20">
                <SendIcon className="w-3.5 h-3.5" />
                درخواست
              </span>
            </button>
          ))
        )}
      </div>
    </SheetShell>
  );
}
