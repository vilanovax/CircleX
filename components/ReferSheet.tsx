"use client";

import { useMemo, useState } from "react";
import SheetShell from "@/components/SheetShell";
import { useStore } from "@/lib/store";
import { useToast } from "./Toast";
import Avatar from "./Avatar";
import ListingImage from "./ListingImage";
import { SearchIcon, ShieldCheckIcon, SendIcon } from "./Icons";
import { formatPrice, levelChip, levelShort, relationLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";

/**
 * Quick in-network referral: pick someone from my circle and send them this
 * listing as a trusted DM (not a public share).
 */
export default function ReferSheet({
  listingId,
  listingTitle,
  onClose,
}: {
  listingId: string;
  listingTitle: string;
  onClose: () => void;
}) {
  const { people, referListing, getListing } = useStore();
  const { show } = useToast();
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [sentId, setSentId] = useState<string | null>(null);

  const listing = getListing(listingId);
  const circle = people.filter((p) => p.inMyCircle);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return circle;
    return circle.filter(
      (p) =>
        p.name.includes(q) ||
        relationLabels[p.relation].includes(q),
    );
  }, [circle, query]);

  function refer(peerId: string, name: string) {
    if (sentId) return;
    referListing(peerId, listingId, note);
    setSentId(peerId);
    show(`برای ${name} فرستاده شد ✓`);
    window.setTimeout(onClose, 450);
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="refer-sheet-title"
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
      <div className="pb-1">
        <h2
          id="refer-sheet-title"
          className="font-extrabold text-[1.1rem] text-ink dark:text-zinc-50"
        >
          معرفی به دوست
        </h2>
        <p className="flex items-center gap-1 text-[11px] text-levelA mt-1 mb-2.5 font-medium">
          <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0" />
          فقط داخل حلقه — بدون اشتراک عمومی
        </p>

        <div className="flex items-center gap-2.5 rounded-2xl border border-stone-200/80 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-800/50 p-2 mb-2.5">
          {listing ? (
            <ListingImage
              image={listing.image}
              alt={listingTitle}
              size="sm"
              category={listing.category}
              type={listing.type}
              frameClassName="w-11 h-11 rounded-xl overflow-hidden shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center text-base shrink-0">
              📎
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
              {listingTitle}
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5 nums">
              {listing?.price != null
                ? formatPrice(listing.price)
                : listing?.type === "service"
                  ? "توافقی"
                  : "رایگان / توافقی"}
            </p>
          </div>
        </div>

        <label className="block mb-2.5">
          <span className="sr-only">یادداشت اختیاری</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={120}
            placeholder="یادداشت کوتاه (اختیاری)…"
            className="field !py-2.5 !text-[13px]"
          />
        </label>

        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-[12px] font-bold text-ink dark:text-zinc-200">
            برای چه کسی؟
          </p>
          <p className="text-[11px] text-ink-faint nums">
            {filtered.length === circle.length
              ? `${toPersianDigits(circle.length)} نفر`
              : `${toPersianDigits(filtered.length)} از ${toPersianDigits(circle.length)}`}
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
              هنوز کسی در حلقه‌ات نیست. اول از «حلقه‌ی من» اضافه کن.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 px-4 text-center">
              کسی با این نام پیدا نشد.
            </p>
          ) : (
            filtered.map((p) => {
              const justSent = sentId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={Boolean(sentId)}
                  onClick={() => refer(p.id, p.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-right transition-colors ${
                    justSent
                      ? "bg-levelA/10"
                      : "active:bg-stone-50/90 dark:active:bg-zinc-800/70"
                  } disabled:opacity-60`}
                >
                  <Avatar name={p.name} src={p.avatar} level={p.level} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
                      {p.name}
                    </p>
                    <p className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-ink-muted truncate">
                        {relationLabels[p.relation]}
                      </span>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${levelChip[p.level]}`}
                      >
                        {levelShort[p.level]}
                      </span>
                    </p>
                  </div>
                  {justSent ? (
                    <span className="shrink-0 text-[12px] font-bold text-levelA">
                      ارسال شد ✓
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-brand-600 text-white text-[11px] font-bold px-2.5 py-1.5 shadow-sm shadow-brand-600/20">
                      <SendIcon className="w-3.5 h-3.5" />
                      ارسال
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </SheetShell>
  );
}
