"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SheetShell from "@/components/SheetShell";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import { DEFAULT_REFER_NOTE } from "@/lib/refer";
import { ApiError } from "@/lib/api";
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
  const router = useRouter();
  const { people, referListing, getListing } = useStore();
  const { show } = useToast();
  const [note, setNote] = useState(DEFAULT_REFER_NOTE);
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState<{ id: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);

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

  async function refer(peerId: string, name: string) {
    if (sent || sending) return;
    setSending(true);
    try {
      await referListing(peerId, listingId, note);
      setSent({ id: peerId, name });
      show(`در گفتگو با ${name}`);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ارسال نشد. دوباره بزن.");
    } finally {
      setSending(false);
    }
  }

  function openThread() {
    if (!sent) return;
    onClose();
    router.push(
      `/messages/${encodeURIComponent(sent.id)}?listing=${encodeURIComponent(listingId)}`,
    );
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
        <p className="text-[11px] text-ink-muted mb-3 leading-snug">
          فقط داخل حلقه، در گفتگوی همان نفر.
        </p>

        <label className="block mb-3">
          <span className="block text-[12px] font-bold text-ink dark:text-zinc-200 mb-1">
            اگر خواستی بگو چرا مناسبش است
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={3}
            disabled={Boolean(sent) || sending}
            placeholder="خالی بگذار تا فقط کارت آگهی برود."
            className="field !py-2.5 !text-[13px] !min-h-[4.5rem] resize-none leading-relaxed disabled:opacity-60"
          />
          <span className="mt-1 flex justify-between gap-2 text-[11px] text-ink-faint nums">
            <span>اختیاری — می‌توانی پاک کنی یا عوض کنی.</span>
            <span>{toPersianDigits(note.length)} / {toPersianDigits(200)}</span>
          </span>
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

        {circle.length >= 8 && (
          <label className="relative block mb-2">
            <SearchIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام…"
              className="field !pr-9 !py-2 !text-[13px]"
              autoComplete="off"
              disabled={Boolean(sent) || sending}
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
              const justSent = sent?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={Boolean(sent) || sending}
                  onClick={() => void refer(p.id, p.name)}
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

        {sent ? (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={openThread}
              className="btn-primary flex-1 !py-3"
            >
              باز کردن گفتگو
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 !py-3"
            >
              بستن
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-3 py-2 text-[13px] font-semibold text-ink-faint dark:text-zinc-500 active:text-ink"
          >
            بستن
          </button>
        )}
      </div>
    </SheetShell>
  );
}
