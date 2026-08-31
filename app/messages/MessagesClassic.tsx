"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreadListSkeleton } from "@/components/Skeleton";
import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
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
import { activeCircleCount } from "@/lib/circle-member";
import { toPersianDigits } from "@/lib/persian";
import { listingSubject } from "@/lib/listing-prompts";
import { messageSentAt } from "@/lib/mappers";
import { recalledThreadListing } from "@/lib/thread-listing";
import {
  circleMemberPerson,
  parseThreadKey,
} from "@/lib/listing-privacy";
import { chatPeerSubtitle, viaConnectorName } from "@/lib/trust";
import type { Listing, Message, Person } from "@/lib/types";
import MessagesInboxExplain from "@/components/MessagesInboxExplain";

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
  const refreshInbox = useStore((s) => s.refreshInbox);
  const threadIndex = useStore((s) => s.threadIndex);
  const getPerson = useStore((s) => s.getPerson);
  const getListing = useStore((s) => s.getListing);
  const people = useStore((s) => s.people);
  const archivedThreads = useStore((s) => s.archivedThreads);
  const pinnedThreads = useStore((s) => s.pinnedThreads);
  const archiveThread = useStore((s) => s.archiveThread);
  const unarchiveThread = useStore((s) => s.unarchiveThread);
  const togglePinThread = useStore((s) => s.togglePinThread);
  const deleteThread = useStore((s) => s.deleteThread);
  const { show } = useToast();
  const circleCount = activeCircleCount(people);

  useEffect(() => {
    void refreshInbox().catch(() => {});
  }, [refreshInbox]);

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<ThreadMenu | null>(null);
  const deferredQuery = useDeferredValue(query);

  const peers = useMemo(
    () => threadIndex.peerIds.filter((id) => !isCircloPeer(id)),
    [threadIndex.peerIds],
  );
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

  /** Circlo is always listed under «همه» — keep chip + subtitle in sync. */
  const allInboxCount = inboxPeers.length + 1;

  const subtitle = !hydrated
    ? undefined
    : filter === "archive"
      ? `${toPersianDigits(archivedPeers.length)} آرشیو`
      : inboxUnread > 0
        ? `${toPersianDigits(inboxUnread)} خوانده‌نشده`
        : inboxPeers.length === 0
          ? "هنوز گفتگوی شخصی نیست"
          : `${toPersianDigits(allInboxCount)} گفتگو`;

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
    for (const key of source) {
      const { peerId, listingId } = parseThreadKey(key);
      const last = threadIndex.lastByPeer.get(key);
      const topicListingId =
        listingId ??
        threadIndex.listingIdByPeer.get(key) ??
        recalledThreadListing(peerId);
      const topicListing = topicListingId
        ? getListing(topicListingId)
        : undefined;
      const peer = last?.peerHidden
        ? circleMemberPerson(peerId, topicListingId)
        : getPerson(peerId);
      if (!peer) continue;
      if (
        q &&
        !peer.name.includes(q) &&
        !(topicListing && topicListing.title.includes(q))
      ) {
        continue;
      }
      mapped.push({
        rowKey: key,
        peerId,
        peer,
        last,
        unread: threadIndex.unreadByPeer.get(key) ?? 0,
        preview: threadPreview(last, getListing),
        topicListingId,
        topicListing,
        scoped: Boolean(listingId),
        relationLine: last?.peerHidden
          ? "هویت برای اعضا پنهان است"
          : chatPeerSubtitle(peer, viaConnectorName(peerId, getPerson)),
        pinned: pinnedSet.has(key),
        archived: archivedSet.has(key),
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

    if (filter === "archive") {
      return mapped.sort(
        (a, b) =>
          messageSentAt(b.last ?? { postedAt: "", sentAt: 0 }) -
          messageSentAt(a.last ?? { postedAt: "", sentAt: 0 }),
      );
    }

    const pinnedRows = mapped
      .filter((r) => r.pinned)
      .sort(
        (a, b) =>
          pinnedThreads.indexOf(a.rowKey) - pinnedThreads.indexOf(b.rowKey),
      );
    const rest = mapped
      .filter((r) => !r.pinned)
      .sort(
        (a, b) =>
          messageSentAt(b.last ?? { postedAt: "", sentAt: 0 }) -
          messageSentAt(a.last ?? { postedAt: "", sentAt: 0 }),
      );
    const circloRow = showCirclo
      ? [
          {
            peerId: CIRCLO_PEER_ID,
            rowKey: CIRCLO_PEER_ID,
            scoped: false,
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

  const onFilterAll = useCallback(
    () => startTransition(() => setFilter("all")),
    [],
  );
  const onFilterUnread = useCallback(
    () => startTransition(() => setFilter("unread")),
    [],
  );
  const onFilterArchive = useCallback(
    () => startTransition(() => setFilter("archive")),
    [],
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

      <div className="px-4 pt-3 space-y-3">
        {hydrated ? (
          <div className="space-y-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              <FilterChip
                active={filter === "all"}
                onClick={onFilterAll}
                label="همه"
                count={allInboxCount}
              />
              <FilterChip
                active={filter === "unread"}
                onClick={onFilterUnread}
                label="خوانده‌نشده"
                count={inboxUnread}
              />
              <FilterChip
                active={filter === "archive"}
                onClick={onFilterArchive}
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
                key={row.rowKey ?? row.peerId}
                peer={row.peer}
                peerId={row.peerId}
                rowKey={row.rowKey ?? row.peerId}
                last={row.last}
                unread={row.unread}
                preview={row.preview}
                topicListingId={row.topicListingId}
                topicListing={row.topicListing}
                scoped={Boolean(row.scoped)}
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

        {hydrated &&
        filter === "all" &&
        !deferredQuery.trim() &&
        inboxPeers.length === 0 ? (
          <MessagesInboxExplain emptyCircle={circleCount === 0} />
        ) : null}
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
  rowKey,
  last,
  unread,
  preview,
  topicListingId,
  topicListing,
  scoped,
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
  rowKey: string;
  last: Message | undefined;
  unread: number;
  preview: string;
  topicListingId?: string;
  topicListing?: Listing;
  scoped?: boolean;
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
    <div className={official ? undefined : "cv-card"}>
      <SwipeThreadRow
        archived={archived}
        pinned={pinned}
        disabled={official}
        onArchive={() => onArchive(rowKey, peer.name)}
        onUnarchive={() => onUnarchive(rowKey, peer.name)}
        onDelete={() => onDelete(rowKey, peer.name)}
        onTogglePin={() => onPin(rowKey, peer.name, pinned)}
      >
        <ThreadRow
          peer={peer}
          peerId={peerId}
          last={last}
          unread={unread}
          preview={preview}
          topicListingId={topicListingId}
          topicListing={topicListing}
          scoped={scoped}
          relationLine={relationLine}
          pinned={pinned}
          official={official}
          eager={eager}
          moreSlot={
            official ? undefined : (
              <ThreadMoreButton
                rowKey={rowKey}
                name={peer.name}
                avatar={peer.avatar}
                pinned={pinned}
                archived={archived}
                onMore={onMore}
              />
            )
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
  scoped,
  relationLine,
  pinned,
  official,
  eager,
  moreSlot,
}: {
  peer: Person;
  peerId: string;
  last: Message | undefined;
  unread: number;
  preview: string;
  topicListingId?: string;
  topicListing?: Listing;
  scoped?: boolean;
  relationLine: string;
  pinned?: boolean;
  official?: boolean;
  eager?: boolean;
  moreSlot?: ReactNode;
}) {
  const router = useRouter();
  const hasUnread = unread > 0;
  const href =
    topicListingId
      ? `/messages/${peerId}?listing=${encodeURIComponent(topicListingId)}&scoped=1`
      : `/messages/${peerId}`;
  const topicLine = topicListing
    ? `دربارهٔ ${listingSubject(topicListing)}`
    : null;

  const openThread = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      // Soft-nav can no-op under content-visibility / interrupted transitions;
      // force push so Circlo and scoped rows always open.
      e.preventDefault();
      router.push(href);
    },
    [href, router],
  );

  return (
    <div
      className={`flex items-stretch ${
        hasUnread ? "bg-brand-50/55 dark:bg-brand-500/10" : ""
      }`}
    >
      <Link
        href={href}
        onClick={openThread}
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
              dir="rtl"
              className={`text-[11px] shrink-0 ${
                hasUnread
                  ? "text-brand-600 font-bold"
                  : "text-ink-muted dark:text-zinc-500"
              }`}
            >
              {last?.postedAt
                ? last.postedAt
                : official
                  ? ""
                  : "—"}
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
              <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center nums shadow-sm shadow-brand-600/25">
                {toPersianDigits(unread)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      {moreSlot ?? <span className="w-3 shrink-0" aria-hidden />}
    </div>
  );
});

const ThreadMoreButton = memo(function ThreadMoreButton({
  rowKey,
  name,
  avatar,
  pinned,
  archived,
  onMore,
}: {
  rowKey: string;
  name: string;
  avatar: string;
  pinned: boolean;
  archived: boolean;
  onMore: (menu: ThreadMenu) => void;
}) {
  const onClick = useCallback(() => {
    onMore({ peerId: rowKey, name, avatar, pinned, archived });
  }, [onMore, rowKey, name, avatar, pinned, archived]);

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={preloadMessageSheets}
      onFocus={preloadMessageSheets}
      aria-label={`گزینه‌های گفتگو با ${name}`}
      className="shrink-0 w-11 flex items-center justify-center text-ink-muted hover:text-ink dark:hover:text-zinc-200 active:bg-stone-100/80 dark:active:bg-zinc-800"
    >
      <MoreIcon className="w-5 h-5" />
    </button>
  );
});

const FilterChip = memo(function FilterChip({
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
});
