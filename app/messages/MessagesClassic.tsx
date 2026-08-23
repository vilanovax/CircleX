"use client";

import Link from "next/link";
import { ThreadListSkeleton } from "@/components/Skeleton";
import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import SwipeThreadRow from "@/components/SwipeThreadRow";
import { useToast } from "@/components/Toast";
import { MoreIcon, PencilIcon, PinIcon, SearchIcon } from "@/components/Icons";
import { lazyUi } from "@/lib/lazy-ui";
import { threadPreview } from "@/lib/message-preview";
import { CIRCLO_PEER_ID, CIRCLO_PERSON, isCircloPeer } from "@/lib/circlo";
import { toPersianDigits } from "@/lib/persian";
import { listingSubject } from "@/lib/listing-prompts";
import { recalledThreadListing } from "@/lib/thread-listing";
import { chatPeerSubtitle, viaConnectorName } from "@/lib/trust";
import type { Listing, Message, Person } from "@/lib/types";

type Filter = "all" | "unread" | "archive";

type ThreadMenu = {
  peerId: string;
  name: string;
  avatar: string;
  pinned: boolean;
  archived: boolean;
};

const ABOVE_FOLD = 4;

const ComposeSheet = lazyUi(
  () =>
    import("./message-sheets").then((mod) => ({
      default: mod.ComposeSheet,
    })) as Promise<{
      default: typeof import("./message-sheets").ComposeSheet;
    }>,
);
const ThreadActionsSheet = lazyUi(
  () =>
    import("./message-sheets").then((mod) => ({
      default: mod.ThreadActionsSheet,
    })) as Promise<{
      default: typeof import("./message-sheets").ThreadActionsSheet;
    }>,
);

function preloadMessageSheets() {
  void import("./message-sheets");
}

export default function MessagesClassic() {
  const [showCompose, setShowCompose] = useState(false);
  const onCompose = useCallback(() => setShowCompose(true), []);

  return (
    <main className="pb-24 min-h-[100dvh]">
      <MessagesBody onCompose={onCompose} />
      {showCompose ? (
        <ComposeSheet onClose={() => setShowCompose(false)} />
      ) : null}
      <BottomNav />
    </main>
  );
}

const MessagesBody = memo(function MessagesBody({
  onCompose,
}: {
  onCompose: () => void;
}) {
  const hydrated = useStore((s) => s.hydrated);
  const threadIndex = useStore((s) => s.threadIndex);
  const people = useStore((s) => s.people);
  const networkLinks = useStore((s) => s.networkLinks);
  const getPerson = useStore((s) => s.getPerson);
  const getListing = useStore((s) => s.getListing);
  const archivedThreads = useStore((s) => s.archivedThreads);
  const pinnedThreads = useStore((s) => s.pinnedThreads);
  const archiveThread = useStore((s) => s.archiveThread);
  const unarchiveThread = useStore((s) => s.unarchiveThread);
  const togglePinThread = useStore((s) => s.togglePinThread);
  const deleteThread = useStore((s) => s.deleteThread);
  const { show } = useToast();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<ThreadMenu | null>(null);
  const deferredQuery = useDeferredValue(query);

  const peers = threadIndex.peerIds.filter((id) => !isCircloPeer(id));
  const archivedSet = useMemo(
    () => new Set(archivedThreads),
    [archivedThreads],
  );
  const pinnedSet = useMemo(() => new Set(pinnedThreads), [pinnedThreads]);

  const inboxPeers = useMemo(
    () => peers.filter((id) => !archivedSet.has(id)),
    [peers, archivedSet],
  );
  const archivedPeers = useMemo(
    () => peers.filter((id) => archivedSet.has(id)),
    [peers, archivedSet],
  );
  const inboxUnread = useMemo(() => {
    let n = threadIndex.unreadByPeer.get(CIRCLO_PEER_ID) ?? 0;
    for (const id of inboxPeers) n += threadIndex.unreadByPeer.get(id) ?? 0;
    return n;
  }, [inboxPeers, threadIndex]);

  const subtitle = !hydrated
    ? undefined
    : filter === "archive"
      ? `${toPersianDigits(archivedPeers.length)} آرشیو`
      : inboxUnread > 0
        ? `${toPersianDigits(inboxUnread)} خوانده‌نشده`
        : `${toPersianDigits(inboxPeers.length)} گفتگو`;

  const rows = useMemo(() => {
    const q = deferredQuery.trim();
    const source =
      filter === "archive"
        ? archivedPeers
        : filter === "unread"
          ? inboxPeers.filter(
              (id) => (threadIndex.unreadByPeer.get(id) ?? 0) > 0,
            )
          : inboxPeers;

    const mapped = [];
    for (const peerId of source) {
      const peer = getPerson(peerId);
      if (!peer) continue;
      if (q && !peer.name.includes(q)) continue;
      const last = threadIndex.lastByPeer.get(peerId);
      const topicListingId =
        threadIndex.listingIdByPeer.get(peerId) ??
        recalledThreadListing(peerId);
      const topicListing = topicListingId
        ? getListing(topicListingId)
        : undefined;
      mapped.push({
        peerId,
        peer,
        last,
        unread: threadIndex.unreadByPeer.get(peerId) ?? 0,
        preview: threadPreview(last, getListing),
        topicListingId,
        topicListing,
        relationLine: chatPeerSubtitle(
          peer,
          viaConnectorName(peerId, getPerson, networkLinks, people),
        ),
        pinned: pinnedSet.has(peerId),
        archived: archivedSet.has(peerId),
        official: false,
      });
    }

    const circloPeer = CIRCLO_PERSON;
    const circloLast = threadIndex.lastByPeer.get(CIRCLO_PEER_ID);
    const circloUnread = threadIndex.unreadByPeer.get(CIRCLO_PEER_ID) ?? 0;
    const circloMatchesQuery =
      !q ||
      circloPeer.name.includes(q) ||
      "circlo".includes(q.toLowerCase());
    const showCirclo =
      filter !== "archive" &&
      circloMatchesQuery &&
      (filter !== "unread" || circloUnread > 0);

    if (filter === "archive") return mapped;

    const pinnedRows = mapped
      .filter((r) => r.pinned)
      .sort(
        (a, b) =>
          pinnedThreads.indexOf(a.peerId) - pinnedThreads.indexOf(b.peerId),
      );
    const rest = mapped.filter((r) => !r.pinned);
    const circloRow = showCirclo
      ? [
          {
            peerId: CIRCLO_PEER_ID,
            peer: circloPeer,
            last: circloLast,
            unread: circloUnread,
            preview: circloLast
              ? threadPreview(circloLast, getListing)
              : "اخبار حلقه — درخواست ورود و پذیرش دعوت",
            topicListingId: undefined as string | undefined,
            topicListing: undefined as Listing | undefined,
            relationLine: "از سیرکل",
            pinned: true,
            archived: false,
            official: true,
          },
        ]
      : [];
    return [...circloRow, ...pinnedRows, ...rest];
  }, [
    deferredQuery,
    filter,
    archivedPeers,
    inboxPeers,
    getPerson,
    getListing,
    threadIndex,
    pinnedSet,
    archivedSet,
    pinnedThreads,
    networkLinks,
    people,
  ]);

  const handleArchive = useCallback(
    (peerId: string, name: string) => {
      archiveThread(peerId);
      show(`گفتگو با ${name} آرشیو شد`, {
        action: {
          label: "برگرداندن",
          onClick: () => unarchiveThread(peerId),
        },
      });
    },
    [archiveThread, unarchiveThread, show],
  );

  const handleUnarchive = useCallback(
    (peerId: string, name: string) => {
      unarchiveThread(peerId);
      show(`گفتگو با ${name} برگشت`);
      if (filter === "archive") setFilter("all");
    },
    [unarchiveThread, show, filter],
  );

  const handleDelete = useCallback(
    (peerId: string, name: string) => {
      if (
        typeof window !== "undefined" &&
        !window.confirm(`گفتگو با ${name} فقط برای تو حذف شود؟`)
      ) {
        return;
      }
      deleteThread(peerId);
      show("گفتگو حذف شد");
    },
    [deleteThread, show],
  );

  const handlePin = useCallback(
    async (peerId: string, name: string, pinned: boolean) => {
      const ok = await togglePinThread(peerId);
      if (!ok) {
        show("حداکثر ۳ گفتگو را می‌توانی سنجاق کنی");
        return;
      }
      show(pinned ? `سنجاق ${name} برداشته شد` : `${name} سنجاق شد`);
    },
    [togglePinThread, show],
  );

  const onMore = useCallback((next: ThreadMenu) => setMenu(next), []);

  return (
    <>
      <Header
        title="پیام‌ها"
        subtitle={subtitle}
        action={
          <button
            type="button"
            onClick={onCompose}
            onPointerEnter={preloadMessageSheets}
            onFocus={preloadMessageSheets}
            aria-label="گفتگوی جدید"
            className="w-9 h-9 rounded-xl bg-brand-600 text-white inline-grid place-items-center appearance-none p-0 leading-none active:scale-95 shadow-sm shadow-brand-600/20 transition-transform duration-150"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pt-3 space-y-3 listing-detail-rise">
        {hydrated ? (
          <div className="space-y-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              <FilterChip
                active={filter === "all"}
                onClick={() => startTransition(() => setFilter("all"))}
                label="همه"
                count={inboxPeers.length + 1}
              />
              <FilterChip
                active={filter === "unread"}
                onClick={() => startTransition(() => setFilter("unread"))}
                label="خوانده‌نشده"
                count={inboxUnread}
              />
              <FilterChip
                active={filter === "archive"}
                onClick={() => startTransition(() => setFilter("archive"))}
                label="آرشیو"
                count={archivedPeers.length}
              />
            </div>
            {inboxPeers.length >= 7 || query ? (
              <label className="relative block">
                <SearchIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو در نام…"
                  className="input !pr-9 !py-2.5 !text-[13px]"
                  autoComplete="off"
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {!hydrated ? (
          <ThreadListSkeleton count={5} />
        ) : rows.length === 0 ? (
          <div className="card p-5 text-center">
            <p className="text-sm font-bold text-ink dark:text-zinc-100">
              چیزی پیدا نشد
            </p>
            <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
              {filter === "unread"
                ? "پیام خوانده‌نشده‌ای نیست — یا فیلتر را عوض کنید."
                : filter === "archive"
                  ? "آرشیو خالی است. از ⋮ روی گفتگو، آرشیو را بزن."
                  : "نام دیگری امتحان کنید."}
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
              className="btn-ghost inline-block mt-3 !text-[12px]"
            >
              پاک کردن فیلتر
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
            {rows.map((row, idx) => (
              <InboxThreadRow
                key={row.peerId}
                peer={row.peer}
                peerId={row.peerId}
                last={row.last}
                unread={row.unread}
                preview={row.preview}
                topicListingId={row.topicListingId}
                topicListing={row.topicListing}
                relationLine={row.relationLine}
                pinned={row.pinned}
                archived={row.archived}
                official={row.official}
                eager={idx < ABOVE_FOLD}
                onMore={onMore}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onDelete={handleDelete}
                onPin={handlePin}
              />
            ))}
          </div>
        )}
      </div>

      {menu ? (
        <ThreadActionsSheet
          name={menu.name}
          avatar={menu.avatar}
          pinned={menu.pinned}
          archived={menu.archived}
          onClose={() => setMenu(null)}
          onPin={() => {
            void handlePin(menu.peerId, menu.name, menu.pinned);
            setMenu(null);
          }}
          onArchive={() => {
            if (menu.archived) handleUnarchive(menu.peerId, menu.name);
            else handleArchive(menu.peerId, menu.name);
            setMenu(null);
          }}
          onDelete={() => {
            const { peerId, name } = menu;
            setMenu(null);
            handleDelete(peerId, name);
          }}
        />
      ) : null}
    </>
  );
});

const InboxThreadRow = memo(function InboxThreadRow({
  peer,
  peerId,
  last,
  unread,
  preview,
  topicListingId,
  topicListing,
  relationLine,
  pinned,
  archived,
  official,
  eager,
  onMore,
  onArchive,
  onUnarchive,
  onDelete,
  onPin,
}: {
  peer: Person;
  peerId: string;
  last: Message | undefined;
  unread: number;
  preview: string;
  topicListingId?: string;
  topicListing?: Listing;
  relationLine: string;
  pinned: boolean;
  archived: boolean;
  official?: boolean;
  eager: boolean;
  onMore: (menu: ThreadMenu) => void;
  onArchive: (peerId: string, name: string) => void;
  onUnarchive: (peerId: string, name: string) => void;
  onDelete: (peerId: string, name: string) => void;
  onPin: (peerId: string, name: string, pinned: boolean) => void;
}) {
  return (
    <div className="cv-card">
      <SwipeThreadRow
        archived={archived}
        pinned={pinned}
        disabled={official}
        onArchive={() => onArchive(peerId, peer.name)}
        onUnarchive={() => onUnarchive(peerId, peer.name)}
        onDelete={() => onDelete(peerId, peer.name)}
        onTogglePin={() => onPin(peerId, peer.name, pinned)}
      >
        <ThreadRow
          peer={peer}
          peerId={peerId}
          last={last}
          unread={unread}
          preview={preview}
          topicListingId={topicListingId}
          topicListing={topicListing}
          relationLine={relationLine}
          pinned={pinned}
          official={official}
          eager={eager}
          onMore={
            official
              ? undefined
              : () =>
                  onMore({
                    peerId,
                    name: peer.name,
                    avatar: peer.avatar,
                    pinned,
                    archived,
                  })
          }
        />
      </SwipeThreadRow>
    </div>
  );
});

const ThreadRow = memo(function ThreadRow({
  peer,
  peerId,
  last,
  unread,
  preview,
  topicListingId,
  topicListing,
  relationLine,
  pinned,
  official,
  eager,
  onMore,
}: {
  peer: Person;
  peerId: string;
  last: Message | undefined;
  unread: number;
  preview: string;
  topicListingId?: string;
  topicListing?: Listing;
  relationLine: string;
  pinned?: boolean;
  official?: boolean;
  eager?: boolean;
  onMore?: () => void;
}) {
  const hasUnread = unread > 0;
  const href = topicListingId
    ? `/messages/${peerId}?listing=${encodeURIComponent(topicListingId)}`
    : `/messages/${peerId}`;
  const topicLine = topicListing
    ? `دربارهٔ ${listingSubject(topicListing)}`
    : null;

  return (
    <div
      className={`flex items-stretch ${
        hasUnread ? "bg-brand-50/55 dark:bg-brand-500/10" : ""
      }`}
    >
      <Link
        href={href}
        className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 transition-colors active:bg-stone-50/90 dark:active:bg-zinc-800/60"
      >
        <Avatar
          name={peer.name}
          src={peer.avatar}
          size="md"
          showLevel={false}
          eager={eager}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={`text-[14px] truncate flex items-center gap-1 ${
                hasUnread
                  ? "font-extrabold text-ink dark:text-zinc-50"
                  : "font-bold text-ink dark:text-zinc-100"
              }`}
            >
              {pinned ? (
                <PinIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              ) : null}
              <span className="truncate">{peer.name}</span>
            </p>
            <span
              className={`text-[11px] shrink-0 nums ${
                hasUnread
                  ? "text-brand-600 font-bold"
                  : "text-ink-muted dark:text-zinc-500"
              }`}
            >
              {last?.postedAt ?? "—"}
            </span>
          </div>
          {topicLine && !official ? (
            <p className="text-[11px] font-semibold text-brand-700/80 dark:text-brand-300/90 truncate mt-px">
              {topicLine}
            </p>
          ) : (
            <p className="text-[11px] text-ink-muted truncate mt-px">
              {official ? (
                <span className="text-brand-700 dark:text-brand-300 font-semibold">
                  از سیرکل
                </span>
              ) : (
                relationLine
              )}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <p
              className={`text-[12px] leading-snug truncate flex-1 ${
                hasUnread
                  ? "text-ink dark:text-zinc-200 font-medium"
                  : "text-ink-muted dark:text-zinc-400"
              }`}
            >
              {preview}
            </p>
            {hasUnread ? (
              <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center nums shadow-sm shadow-brand-600/25">
                {toPersianDigits(unread)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      {onMore ? (
      <button
        type="button"
        onClick={onMore}
        onPointerEnter={preloadMessageSheets}
        onFocus={preloadMessageSheets}
        aria-label={`گزینه‌های گفتگو با ${peer.name}`}
        className="shrink-0 w-11 flex items-center justify-center text-ink-muted hover:text-ink dark:hover:text-zinc-200 active:bg-stone-100/80 dark:active:bg-zinc-800"
      >
        <MoreIcon className="w-5 h-5" />
      </button>
      ) : (
        <span className="w-3 shrink-0" aria-hidden />
      )}
    </div>
  );
});

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 chip !px-3 !py-1.5 !text-[12px] border transition-colors ${
        active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-[color:var(--circle-surface)] dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 text-ink-muted"
      }`}
    >
      {label}
      <span
        className={`ms-1 nums text-[11px] ${
          active ? "text-white/85" : "text-ink-faint"
        }`}
      >
        {toPersianDigits(count)}
      </span>
    </button>
  );
}
