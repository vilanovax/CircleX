"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SheetShell from "@/components/SheetShell";
import ListingImage from "@/components/ListingImage";
import Avatar from "@/components/Avatar";
import {
  BackIcon,
  ChatStackIcon,
  CircleUsersIcon,
  EyeIcon,
  HeartIcon,
} from "@/components/Icons";
import { groupByPerson } from "@/components/Endorsements";
import { useStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api";
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

type ListingOwnerStats = {
  views: number;
  saves: number;
  conversations: number;
  messages: number;
  unread: number;
  endorsements: number;
};

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
  const [remote, setRemote] = useState<ListingOwnerStats | null>(null);
  const [statsReady, setStatsReady] = useState(false);

  const wordGroups = useMemo(
    () => groupByPerson(listing.endorsements),
    [listing.endorsements],
  );

  const peers = useMemo(
    () => listingThreadPeers(messages, listing.id),
    [messages, listing.id],
  );
  const localMessages = useMemo(
    () => listingMessageCount(messages, listing.id),
    [messages, listing.id],
  );

  useEffect(() => {
    let cancelled = false;
    void api<ListingOwnerStats>(`/api/listings/${listing.id}/stats`)
      .then((data) => {
        if (!cancelled) setRemote(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setStatsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [listing.id]);

  const views = remote?.views ?? 0;
  const saves = remote?.saves ?? 0;
  const conversations = Math.max(remote?.conversations ?? 0, peers.length);
  const messageCount = Math.max(remote?.messages ?? 0, localMessages);
  const unread = remote?.unread ?? 0;

  const title = listingDisplayTitle(listing.title, listing.type);
  const inactive = listing.dealStatus === "inactive";
  const priceLabel =
    listing.price != null
      ? formatPrice(listing.price)
      : listing.type === "service"
        ? "توافقی"
        : "رایگان";

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

  const kpis = [
    {
      key: "views",
      label: "دیده شدن",
      value: views,
      icon: EyeIcon,
    },
    {
      key: "saves",
      label: "نشان‌شده",
      value: saves,
      icon: HeartIcon,
    },
    {
      key: "conversations",
      label: "گفتگو",
      value: conversations,
      icon: CircleUsersIcon,
    },
    {
      key: "messages",
      label: "پیام",
      hint:
        unread > 0 ? `${toPersianDigits(unread)} خوانده‌نشده` : undefined,
      value: messageCount,
      icon: ChatStackIcon,
      accent: unread > 0,
    },
  ];

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="listing-stats-title"
      zClass="z-[60]"
      maxHeight="88dvh"
    >
      <div className="flex items-start gap-3">
        <ListingImage
          image={listing.image}
          alt={title}
          size="sm"
          category={listing.category}
          type={listing.type}
          frameClassName="w-12 h-12 rounded-2xl overflow-hidden shrink-0 ring-1 ring-stone-200/80 dark:ring-zinc-700"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2
              id="listing-stats-title"
              className="min-w-0 truncate text-[20px] font-semibold leading-tight text-ink dark:text-zinc-50"
            >
              آمار آگهی
            </h2>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                inactive
                  ? "bg-stone-200/80 text-ink-muted dark:bg-zinc-800 dark:text-zinc-400"
                  : "bg-[color:var(--circle-trust)]/12 text-[color:var(--circle-trust)]"
              }`}
            >
              {inactive ? "غیرفعال" : "در فید"}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink dark:text-zinc-200">
            {title}
          </p>
          <p className="mt-0.5 nums text-[12px] text-ink-muted dark:text-zinc-400">
            {listingTypeLabels[listing.type]} · {priceLabel}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {!statsReady
          ? [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[4.25rem] animate-pulse rounded-2xl bg-stone-100 dark:bg-zinc-800"
              />
            ))
          : kpis.map((kpi) => {
              const Icon = kpi.icon;
              const zero = kpi.value === 0;
              const hint = "hint" in kpi ? kpi.hint : undefined;
              return (
                <div
                  key={kpi.key}
                  className={`rounded-2xl px-3 py-2 ring-1 ${
                    kpi.accent
                      ? "bg-brand-600/8 ring-brand-600/25 dark:bg-brand-500/10 dark:ring-brand-400/20"
                      : "bg-stone-50 ring-stone-200/80 dark:bg-zinc-800/55 dark:ring-zinc-700/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-medium text-ink-muted dark:text-zinc-400">
                      {kpi.label}
                    </p>
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        kpi.accent
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-ink-faint dark:text-zinc-500"
                      }`}
                    />
                  </div>
                  <p
                    className={`mt-1 nums text-[20px] font-semibold leading-none ${
                      zero
                        ? "text-ink-faint dark:text-zinc-500"
                        : "text-ink dark:text-zinc-50"
                    }`}
                  >
                    {toPersianDigits(kpi.value)}
                  </p>
                  {hint ? (
                    <p className="mt-1 text-[11px] leading-snug text-ink-faint dark:text-zinc-500">
                      {hint}
                    </p>
                  ) : null}
                </div>
              );
            })}
      </div>

      <div className="mt-5">
        <p className="mb-1.5 px-0.5 text-[13px] font-semibold text-ink dark:text-zinc-200">
          {peers.length > 0
            ? `گفتگو · ${toPersianDigits(peers.length)} نفر`
            : "هنوز کسی ننوشته"}
        </p>
        {peers.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-3 py-3 text-[13px] leading-relaxed text-ink-muted ring-1 ring-stone-200/80 dark:bg-zinc-800/55 dark:text-zinc-400 dark:ring-zinc-700/80">
            وقتی کسی از روی این آگهی پیام بدهد، اسمش اینجا می‌آید.
          </p>
        ) : (
          <div className="card divide-y divide-stone-100 overflow-hidden dark:divide-zinc-800">
            {peers.map((peerId) => {
              const person = getPerson(peerId);
              const thread = getThread(peerId);
              const threadUnread = unreadCount(peerId);
              const preview = listingThreadPreview(thread, listing.id);
              const name = person?.name ?? "عضو حلقه";
              return (
                <button
                  key={peerId}
                  type="button"
                  onClick={() => openThread(peerId)}
                  className="flex min-h-[3.5rem] w-full items-center gap-3 px-3 py-3 text-right transition-colors duration-150 active:bg-stone-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-500 dark:active:bg-zinc-800/60"
                >
                  <Avatar
                    name={name}
                    src={person?.avatar}
                    size="sm"
                    showLevel={false}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-[15px] font-semibold text-ink dark:text-zinc-100">
                        {name}
                      </span>
                      {threadUnread > 0 ? (
                        <span className="nums shrink-0 rounded-full bg-brand-600 px-1.5 py-px text-[11px] font-medium leading-none text-white">
                          {toPersianDigits(threadUnread)}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-ink-muted dark:text-zinc-400">
                      {person ? viewerRelationPhrase(person) : "از حلقه"}
                      {" · "}
                      {preview}
                    </span>
                  </span>
                  <BackIcon className="h-4 w-4 shrink-0 text-ink-faint dark:text-zinc-500" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {wordGroups.length > 0 ? (
        <div className="mt-4">
          <p className="mb-1.5 px-0.5 text-[12.5px] font-medium text-ink-muted dark:text-zinc-400">
            حرف آشنایان روی آگهی
          </p>
          <p className="mb-2 px-0.5 text-[12.5px] leading-relaxed text-ink-muted dark:text-zinc-400">
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
                      ? "bg-stone-50/80 ring-stone-200/80 dark:bg-zinc-800/40 dark:ring-zinc-700/80"
                      : "bg-white ring-stone-200/80 dark:bg-zinc-900 dark:ring-zinc-700"
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
                      <p className="text-[15px] font-semibold text-ink dark:text-zinc-100">
                        {name}
                      </p>
                      {group.note ? (
                        <p className="mt-1 text-[14px] leading-relaxed text-ink dark:text-zinc-200">
                          «{group.note}»
                        </p>
                      ) : (
                        <p className="mt-1 text-[12.5px] text-ink-muted">
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
                    className="mt-2.5 w-full rounded-xl py-2 text-[12.5px] font-medium text-ink ring-1 ring-stone-200 active:bg-stone-50 disabled:opacity-50 dark:text-zinc-100 dark:ring-zinc-700 dark:active:bg-zinc-800"
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
