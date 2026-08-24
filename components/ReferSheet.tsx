"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SheetShell from "@/components/SheetShell";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import { DEFAULT_REFER_NOTE } from "@/lib/refer";
import {
  loadReferRecents,
  rememberReferRecipient,
} from "@/lib/refer-recents";
import { ApiError } from "@/lib/api";
import type { Person } from "@/lib/types";
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
  const { people, referListing, getListing, meServerId } = useStore();
  const { show } = useToast();
  const viewerId = meServerId || "me";
  const [note, setNote] = useState(DEFAULT_REFER_NOTE);
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState<{ id: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [recentIds, setRecentIds] = useState(() => loadReferRecents(viewerId));

  useEffect(() => {
    setRecentIds(loadReferRecents(viewerId));
  }, [viewerId]);

  const listing = getListing(listingId);
  const circle = activeCircle(people);
  const byId = useMemo(() => new Map(circle.map((p) => [p.id, p])), [circle]);

  const recentPeople = useMemo(() => {
    const rows: Person[] = [];
    for (const id of recentIds) {
      const person = byId.get(id);
      if (person) rows.push(person);
    }
    return rows;
  }, [recentIds, byId]);

  const filteredRecent = useMemo(() => {
    const q = query.trim();
    return recentPeople.filter((p) => {
      if (!q) return true;
      const relation = viewerRelationPhrase(p);
      return (
        p.name.includes(q) ||
        relation.includes(q) ||
        relationLabels[p.relation].includes(q)
      );
    });
  }, [recentPeople, query]);

  const filteredRest = useMemo(() => {
    const q = query.trim();
    const recent = new Set(recentPeople.map((p) => p.id));
    return circle.filter((p) => {
      if (recent.has(p.id)) return false;
      if (!q) return true;
      const relation = viewerRelationPhrase(p);
      return (
        p.name.includes(q) ||
        relation.includes(q) ||
        relationLabels[p.relation].includes(q)
      );
    });
  }, [circle, recentPeople, query]);

  const visibleCount = filteredRecent.length + filteredRest.length;

  async function refer(peerId: string, name: string) {
    if (sent || sending) return;
    setSending(true);
    try {
      await referListing(peerId, listingId, note);
      rememberReferRecipient(viewerId, peerId);
      setRecentIds(loadReferRecents(viewerId));
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
          className="text-[20px] font-semibold text-ink dark:text-zinc-50"
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
            <p className="text-[12.5px] font-bold text-ink dark:text-zinc-100 truncate">
              {listingTitle}
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5 nums">{priceLabel}</p>
          </div>
        </div>
        <p className="text-[11px] text-ink-muted mb-3 leading-snug">
          فقط در گفتگوی همان یک نفر.
        </p>

        <label className="block mb-3">
          <span className="block text-[12.5px] font-bold text-ink dark:text-zinc-200 mb-1">
            اگر خواستی بگو چرا مناسبش است
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={3}
            disabled={Boolean(sent) || sending}
            placeholder="خالی بگذار تا فقط کارت آگهی برود."
            className="field !py-2.5 !text-[12.5px] !min-h-[4.5rem] resize-none leading-relaxed disabled:opacity-60"
          />
          <span className="mt-1 flex justify-between gap-2 text-[11px] text-ink-faint nums">
            <span>اختیاری — می‌توانی پاک کنی یا عوض کنی.</span>
            <span>{toPersianDigits(note.length)} / {toPersianDigits(200)}</span>
          </span>
        </label>

        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-[12.5px] font-bold text-ink dark:text-zinc-200">
            برای چه کسی؟
          </p>
          <p className="text-[11px] text-ink-faint nums">
            {visibleCount === circle.length
              ? `${toPersianDigits(circle.length)} نفر`
              : `${toPersianDigits(visibleCount)} از ${toPersianDigits(circle.length)}`}
          </p>
        </div>

        {circle.length >= 8 && (
          <label className="relative mb-2 block">
            <SearchIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام…"
              className="field !py-2 !pr-9 !text-[12.5px]"
              autoComplete="off"
              disabled={Boolean(sent) || sending}
            />
          </label>
        )}

        {circle.length === 0 ? (
          <p className="rounded-2xl border border-stone-200/80 px-4 py-8 text-center text-[14px] leading-relaxed text-ink-muted dark:border-zinc-700">
            هنوز کسی در حلقه‌ات نیست. اول از «حلقه‌ی من» اضافه کن.
          </p>
        ) : visibleCount === 0 ? (
          <p className="rounded-2xl border border-stone-200/80 px-4 py-8 text-center text-[14px] text-ink-muted dark:border-zinc-700">
            کسی با این نام پیدا نشد.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredRecent.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[12.5px] font-medium text-ink-muted dark:text-zinc-400">
                  آخرین ارسال
                </p>
                <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-[color:var(--circle-surface)] dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900">
                  {filteredRecent.map((p) => (
                    <ReferPersonRow
                      key={p.id}
                      person={p}
                      sent={sent}
                      sending={sending}
                      onRefer={refer}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {filteredRest.length > 0 ? (
              <div>
                {filteredRecent.length > 0 ? (
                  <p className="mb-1.5 text-[12.5px] font-medium text-ink-muted dark:text-zinc-400">
                    بقیه حلقه
                  </p>
                ) : null}
                <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-[color:var(--circle-surface)] dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900">
                  {filteredRest.map((p) => (
                    <ReferPersonRow
                      key={p.id}
                      person={p}
                      sent={sent}
                      sending={sending}
                      onRefer={refer}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

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
            className="w-full mt-3 py-2 text-[12.5px] font-semibold text-ink-faint dark:text-zinc-500 active:text-ink"
          >
            بستن
          </button>
        )}
      </div>
    </SheetShell>
  );
}

function ReferPersonRow({
  person,
  sent,
  sending,
  onRefer,
}: {
  person: Person;
  sent: { id: string; name: string } | null;
  sending: boolean;
  onRefer: (peerId: string, name: string) => void;
}) {
  const justSent = sent?.id === person.id;
  return (
    <button
      type="button"
      disabled={Boolean(sent) || sending}
      onClick={() => void onRefer(person.id, person.name)}
      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-right transition-colors ${
        justSent
          ? "bg-levelA/10"
          : "active:bg-stone-50/90 dark:active:bg-zinc-800/70"
      } disabled:opacity-60`}
    >
      <Avatar name={person.name} src={person.avatar} size="sm" showLevel={false} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink dark:text-zinc-100">
          {person.name}
        </p>
        <p className="mt-0.5 min-w-0 truncate text-[11px] text-ink-muted">
          {viewerRelationPhrase(person)}
        </p>
      </div>
      {justSent ? (
        <span className="shrink-0 text-[12.5px] font-medium text-levelA">
          ارسال شد ✓
        </span>
      ) : (
        <span className="shrink-0 text-[12.5px] font-medium text-brand-600 dark:text-brand-400">
          ارسال
        </span>
      )}
    </button>
  );
}
