"use client";

import { useMemo, useState } from "react";
import SheetShell from "@/components/SheetShell";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import { useToast } from "./Toast";
import Avatar from "./Avatar";
import ListingImage from "./ListingImage";
import { SearchIcon } from "./Icons";
import { formatPrice, relationLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import { viewerRelationPhrase } from "@/lib/trust";

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
  const [showNote, setShowNote] = useState(false);
  const [query, setQuery] = useState("");
  const [sentId, setSentId] = useState<string | null>(null);

  const listing = getListing(listingId);
  const circle = activeCircle(people);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return circle;
    return circle.filter((p) => {
      const relation = viewerRelationPhrase(p);
      return (
        p.name.includes(q) ||
        relation.includes(q) ||
        relationLabels[p.relation].includes(q)
      );
    });
  }, [circle, query]);

  function refer(peerId: string, name: string) {
    if (sentId) return;
    referListing(peerId, listingId, note);
    setSentId(peerId);
    show(`برای ${name} فرستاده شد ✓`);
    window.setTimeout(onClose, 450);
  }

  const priceLabel =
    listing?.price != null
      ? formatPrice(listing.price)
      : listing?.type === "service"
        ? "توافقی"
        : "رایگان / توافقی";

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="refer-sheet-title"
      maxHeight="88dvh"
      zClass="z-50"
    >
      <div className="pb-2">
        <h2
          id="refer-sheet-title"
          className="font-extrabold text-[1.1rem] text-ink dark:text-zinc-50"
        >
          معرفی این آگهی
        </h2>

        <div className="flex items-center gap-2.5 rounded-2xl border border-stone-200/80 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-800/50 p-2 mt-2.5 mb-1.5">
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
            <p className="text-[11px] text-ink-muted mt-0.5 nums">{priceLabel}</p>
          </div>
        </div>
        <p className="text-[11px] text-ink-faint mb-3">
          فقط داخل حلقه فرستاده می‌شود.
        </p>

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

        {circle.length >= 8 && (
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

        {showNote ? (
          <label className="block mb-2">
            <span className="sr-only">یادداشت اختیاری</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              placeholder="یادداشت کوتاه…"
              className="field !py-2 !text-[13px]"
              autoFocus
            />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="mb-2 text-[12px] font-semibold text-brand-600 dark:text-brand-400"
          >
            افزودن یادداشت
          </button>
        )}

        <div className="rounded-2xl border border-stone-200/80 dark:border-zinc-700 overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800 bg-[color:var(--circle-surface)] dark:bg-zinc-900">
          {circle.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 px-4 text-center leading-relaxed">
              هنوز کسی در حلقهٔ شما نیست. اول از «حلقه‌ی من» اضافه کنید.
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
                  <Avatar
                    name={p.name}
                    src={p.avatar}
                    size="sm"
                    showLevel={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
                      {p.name}
                    </p>
                    <p className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      <span className="text-[11px] text-ink-muted truncate">
                        {viewerRelationPhrase(p)}
                      </span>
                    </p>
                  </div>
                  {justSent ? (
                    <span className="shrink-0 text-[12px] font-bold text-levelA">
                      ارسال شد ✓
                    </span>
                  ) : (
                    <span className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400">
                      ارسال
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-2 text-[13px] font-semibold text-ink-faint dark:text-zinc-500 active:text-ink"
        >
          بستن
        </button>
      </div>
    </SheetShell>
  );
}
