"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SheetShell from "@/components/SheetShell";
import ListingImage from "@/components/ListingImage";
import Avatar from "@/components/Avatar";
import { ChatIcon } from "@/components/Icons";
import { groupByPerson } from "@/components/Endorsements";
import { useStore } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import {
  formatPrice,
  listingDisplayTitle,
  listingTypeLabels,
} from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import { viewerRelationPhrase } from "@/lib/trust";
import {
  listingMessageCount,
  listingThreadPeers,
  listingThreadPreview,
} from "@/lib/thread-listing";
import type { Listing } from "@/lib/types";

export default function ListingStatsSheet({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const router = useRouter();
  const messages = useStore((s) => s.messages);
  const getPerson = useStore((s) => s.getPerson);
  const getThread = useStore((s) => s.getThread);
  const unreadCount = useStore((s) => s.unreadCount);
  const setListingEndorsementHidden = useStore(
    (s) => s.setListingEndorsementHidden,
  );
  const { show } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const wordGroups = useMemo(
    () => groupByPerson(listing.endorsements),
    [listing.endorsements],
  );

  const peers = useMemo(
    () => listingThreadPeers(messages, listing.id),
    [messages, listing.id],
  );
  const messageCount = useMemo(
    () => listingMessageCount(messages, listing.id),
    [messages, listing.id],
  );
  const endorserCount = useMemo(() => {
    const ids = new Set(
      listing.endorsements.filter((e) => !e.hidden).map((e) => e.personId),
    );
    return ids.size;
  }, [listing.endorsements]);

  const title = listingDisplayTitle(listing.title, listing.type);
  const inactive = listing.dealStatus === "inactive";
  const priceLabel =
    listing.price != null
      ? formatPrice(listing.price)
      : listing.type === "service"
        ? "توافقی"
        : "رایگان";

  const pulse = [
    peers.length > 0
      ? `${toPersianDigits(peers.length)} گفتگو`
      : "بدون گفتگو",
    messageCount > 0 && messageCount !== peers.length
      ? `${toPersianDigits(messageCount)} پیام`
      : null,
    endorserCount > 0
      ? `${toPersianDigits(endorserCount)} تأیید`
      : "بدون تأیید",
  ]
    .filter(Boolean)
    .join(" · ");

  function openThread(peerId: string) {
    onClose();
    router.push(
      `/messages/${encodeURIComponent(peerId)}?listing=${encodeURIComponent(listing.id)}`,
    );
  }

  async function toggleWord(personId: string, hidden: boolean) {
    if (busyId) return;
    setBusyId(personId);
    try {
      await setListingEndorsementHidden(listing.id, personId, hidden);
      show(hidden ? "این حرف روی آگهی نشان داده نمی‌شود" : "این حرف روی آگهی آمد");
    } catch (err) {
      show(err instanceof ApiError ? err.message : "تغییر نمایش نشد");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="listing-stats-title"
      zClass="z-[60]"
      maxHeight="88dvh"
    >
      <div className="flex items-center gap-3">
        <ListingImage
          image={listing.image}
          alt={title}
          size="sm"
          category={listing.category}
          type={listing.type}
          frameClassName="w-12 h-12 rounded-2xl overflow-hidden shrink-0 ring-1 ring-stone-200/80 dark:ring-zinc-700"
        />
        <div className="min-w-0 flex-1">
          <h2
            id="listing-stats-title"
            className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
          >
            آمار آگهی
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-muted dark:text-zinc-400 leading-snug line-clamp-1">
            {title}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            inactive
              ? "bg-stone-200/80 text-ink-muted dark:bg-zinc-800 dark:text-zinc-400"
              : "bg-[color:var(--circle-trust)]/12 text-[color:var(--circle-trust)]"
          }`}
        >
          {inactive ? "غیرفعال" : "در فید"}
        </span>
      </div>

      <p className="mt-2.5 text-[12px] text-ink-muted dark:text-zinc-400 nums leading-snug px-0.5">
        {listingTypeLabels[listing.type]} · {priceLabel}
        <span className="text-ink-faint"> · {pulse}</span>
      </p>

      <div className="mt-4">
        <p className="text-[11px] font-semibold text-ink-muted dark:text-zinc-400 px-0.5 mb-1.5">
          {peers.length > 0 ? "گفتگو از روی این آگهی" : "هنوز گفتگویی نیست"}
        </p>
        {peers.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 dark:bg-zinc-800/55 px-3 py-3 text-[13px] text-ink-muted dark:text-zinc-400 leading-relaxed ring-1 ring-stone-200/80 dark:ring-zinc-700/80">
            وقتی کسی از حلقه پیام بدهد، اینجا می‌آید.
          </p>
        ) : (
          <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
            {peers.map((peerId) => {
              const person = getPerson(peerId);
              const thread = getThread(peerId);
              const unread = unreadCount(peerId);
              const preview = listingThreadPreview(thread, listing.id);
              const name = person?.name ?? "عضو حلقه";
              return (
                <button
                  key={peerId}
                  type="button"
                  onClick={() => openThread(peerId)}
                  className="w-full flex items-center gap-3 px-3 py-3 text-right min-h-[3.5rem] active:bg-stone-50/80 dark:active:bg-zinc-800/60 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-500"
                >
                  <Avatar
                    name={name}
                    src={person?.avatar}
                    size="sm"
                    showLevel={false}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
                        {name}
                      </span>
                      {unread > 0 ? (
                        <span className="shrink-0 rounded-full bg-brand-600 text-white text-[10px] font-bold px-1.5 py-px nums leading-none">
                          {toPersianDigits(unread)}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-muted dark:text-zinc-400 truncate">
                      {person ? viewerRelationPhrase(person) : "از حلقه"}
                      {" · "}
                      {preview}
                    </span>
                  </span>
                  <ChatIcon className="w-4 h-4 shrink-0 text-brand-600 dark:text-brand-400" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {wordGroups.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-ink-muted dark:text-zinc-400 px-0.5 mb-1.5">
            حرف آشنایان روی آگهی
          </p>
          <p className="text-[12px] text-ink-muted dark:text-zinc-400 px-0.5 mb-2 leading-relaxed">
            کل همان نظر را نشان بده یا پنهان کن. متن را عوض نمی‌کنی.
          </p>
          <ul className="space-y-2">
            {wordGroups.map((group) => {
              const person = getPerson(group.personId);
              const name = person?.name ?? "یک آشنا";
              const hidden = Boolean(group.hidden);
              const busy = busyId === group.personId;
              return (
                <li
                  key={group.personId}
                  className={`rounded-2xl px-3 py-3 ring-1 ${
                    hidden
                      ? "bg-stone-50/80 dark:bg-zinc-800/40 ring-stone-200/80 dark:ring-zinc-700/80"
                      : "bg-white dark:bg-zinc-900 ring-stone-200/80 dark:ring-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar
                      name={name}
                      src={person?.avatar}
                      size="sm"
                      showLevel={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
                        {name}
                      </p>
                      {group.note ? (
                        <p className="mt-1 text-[12.5px] text-ink dark:text-zinc-200 leading-relaxed">
                          «{group.note}»
                        </p>
                      ) : (
                        <p className="mt-1 text-[12px] text-ink-muted">
                          بدون متن — فقط گزینه
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-ink-faint">
                        {hidden
                          ? "الان روی آگهی نیست"
                          : "روی آگهی دیده می‌شود"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleWord(group.personId, !hidden)}
                    className="mt-2.5 w-full rounded-xl py-2 text-[12px] font-bold ring-1 ring-stone-200 dark:ring-zinc-700 text-ink dark:text-zinc-100 active:bg-stone-50 dark:active:bg-zinc-800 disabled:opacity-50"
                  >
                    {busy
                      ? "…"
                      : hidden
                        ? "نمایش روی آگهی"
                        : "پنهان از آگهی"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </SheetShell>
  );
}
