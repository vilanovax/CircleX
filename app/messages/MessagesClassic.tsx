"use client";

import Link from "next/link";
import { ThreadListSkeleton } from "@/components/Skeleton";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import SheetShell from "@/components/SheetShell";
import SwipeThreadRow from "@/components/SwipeThreadRow";
import { useToast } from "@/components/Toast";
import {
  ArchiveIcon,
  ChatIcon,
  MoreIcon,
  PencilIcon,
  PinIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/Icons";
import { threadPreview } from "@/lib/message-preview";
import { toPersianDigits } from "@/lib/persian";
import { listingSubject } from "@/lib/listing-prompts";
import {
  latestListingIdInThread,
  recalledThreadListing,
} from "@/lib/thread-listing";
import {
  chatPeerSubtitle,
  viaConnectorName,
  viewerRelationPhrase,
} from "@/lib/trust";
import type { Listing, Message, Person } from "@/lib/types";

type Filter = "all" | "unread" | "archive";

export default function MessagesClassic() {
  const people = useStore((s) => s.people);
  const networkLinks = useStore((s) => s.networkLinks);
  const getPerson = useStore((s) => s.getPerson);
  const getListing = useStore((s) => s.getListing);
  const getThread = useStore((s) => s.getThread);
  const threadPeers = useStore((s) => s.threadPeers);
  const unreadCount = useStore((s) => s.unreadCount);
  const archivedThreads = useStore((s) => s.archivedThreads);
  const pinnedThreads = useStore((s) => s.pinnedThreads);
  const archiveThread = useStore((s) => s.archiveThread);
  const unarchiveThread = useStore((s) => s.unarchiveThread);
  const togglePinThread = useStore((s) => s.togglePinThread);
  const deleteThread = useStore((s) => s.deleteThread);
  const hydrated = useStore((s) => s.hydrated);
  const { show } = useToast();
  const peers = threadPeers();
  const [showCompose, setShowCompose] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<{
    peerId: string;
    name: string;
    avatar: string;
    pinned: boolean;
    archived: boolean;
  } | null>(null);
  const [sessionTick, setSessionTick] = useState(0);
  useEffect(() => {
    setSessionTick(1);
  }, []);

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
  const inboxUnread = useMemo(
    () => inboxPeers.reduce((n, id) => n + unreadCount(id), 0),
    [inboxPeers, unreadCount],
  );

  const subtitle = useMemo(() => {
    if (!hydrated || peers.length === 0) return undefined;
    if (filter === "archive") {
      return `${toPersianDigits(archivedPeers.length)} آرشیو`;
    }
    if (inboxUnread > 0) {
      return `${toPersianDigits(inboxUnread)} خوانده‌نشده`;
    }
    return `${toPersianDigits(inboxPeers.length)} گفتگو`;
  }, [
    hydrated,
    peers.length,
    filter,
    archivedPeers.length,
    inboxUnread,
    inboxPeers.length,
  ]);

  const viaById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const peerId of peers) {
      const via = viaConnectorName(
        peerId,
        getPerson,
        networkLinks,
        people,
      );
      if (via) map[peerId] = via;
    }
    return map;
  }, [peers, getPerson, networkLinks, people]);

  const rows = useMemo(() => {
    const q = query.trim();
    const source =
      filter === "archive"
        ? archivedPeers
        : filter === "unread"
          ? inboxPeers.filter((id) => unreadCount(id) > 0)
          : inboxPeers;

    const mapped = source
      .map((peerId) => {
        const peer = getPerson(peerId);
        if (!peer) return null;
        const thread = getThread(peerId);
        const last = thread[thread.length - 1];
        const unread = unreadCount(peerId);
        const topicListingId =
          latestListingIdInThread(thread) ?? recalledThreadListing(peerId);
        const topicListing = topicListingId
          ? getListing(topicListingId)
          : undefined;
        return {
          peerId,
          peer,
          last,
          unread,
          preview: threadPreview(last, getListing),
          topicListingId,
          topicListing,
          pinned: pinnedSet.has(peerId),
          archived: archivedSet.has(peerId),
        };
      })
      .filter((row): row is NonNullable<typeof row> => {
        if (!row) return false;
        if (q && !row.peer.name.includes(q)) return false;
        return true;
      });

    if (filter === "archive") return mapped;

    const pinnedRows = mapped
      .filter((r) => r.pinned)
      .sort(
        (a, b) =>
          pinnedThreads.indexOf(a.peerId) - pinnedThreads.indexOf(b.peerId),
      );
    const rest = mapped.filter((r) => !r.pinned);
    return [...pinnedRows, ...rest];
  }, [
    query,
    filter,
    archivedPeers,
    inboxPeers,
    getPerson,
    getThread,
    getListing,
    unreadCount,
    pinnedSet,
    archivedSet,
    pinnedThreads,
    sessionTick,
  ]);

  function handleArchive(peerId: string, name: string) {
    archiveThread(peerId);
    show(`گفتگو با ${name} آرشیو شد`, {
      action: {
        label: "برگرداندن",
        onClick: () => unarchiveThread(peerId),
      },
    });
  }

  function handleUnarchive(peerId: string, name: string) {
    unarchiveThread(peerId);
    show(`گفتگو با ${name} برگشت`);
    if (filter === "archive") setFilter("all");
  }

  function handleDelete(peerId: string, name: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`گفتگو با ${name} فقط برای تو حذف شود؟`)
    ) {
      return;
    }
    deleteThread(peerId);
    show("گفتگو حذف شد");
  }

  function handlePin(peerId: string, name: string, pinned: boolean) {
    const ok = togglePinThread(peerId);
    if (!ok) {
      show("حداکثر ۳ گفتگو را می‌توانی سنجاق کنی");
      return;
    }
    show(pinned ? `سنجاق ${name} برداشته شد` : `${name} سنجاق شد`);
  }

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header
        title="پیام‌ها"
        subtitle={subtitle}
        action={
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            aria-label="گفتگوی جدید"
            className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-95 shadow-sm shadow-brand-600/20 transition-transform duration-150"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pt-3 space-y-3 listing-detail-rise">
        {hydrated && peers.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              <FilterChip
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label="همه"
                count={inboxPeers.length}
              />
              <FilterChip
                active={filter === "unread"}
                onClick={() => setFilter("unread")}
                label="خوانده‌نشده"
                count={inboxUnread}
              />
              <FilterChip
                active={filter === "archive"}
                onClick={() => setFilter("archive")}
                label="آرشیو"
                count={archivedPeers.length}
              />
            </div>
            {(peers.length >= 8 || query) && (
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
            )}
          </div>
        )}

        {!hydrated ? (
          <ThreadListSkeleton count={5} />
        ) : peers.length === 0 ? (
          <EmptyState onStart={() => setShowCompose(true)} />
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
              <SwipeThreadRow
                key={row.peerId}
                archived={row.archived}
                pinned={row.pinned}
                onArchive={() => handleArchive(row.peerId, row.peer.name)}
                onUnarchive={() => handleUnarchive(row.peerId, row.peer.name)}
                onDelete={() => handleDelete(row.peerId, row.peer.name)}
                onTogglePin={() =>
                  handlePin(row.peerId, row.peer.name, row.pinned)
                }
              >
                <ThreadRow
                  peer={row.peer}
                  peerId={row.peerId}
                  last={row.last}
                  unread={row.unread}
                  preview={row.preview}
                  topicListingId={row.topicListingId}
                  topicListing={row.topicListing}
                  relationLine={chatPeerSubtitle(row.peer, viaById[row.peerId])}
                  pinned={row.pinned}
                  eager={idx < 4}
                  onMore={() =>
                    setMenu({
                      peerId: row.peerId,
                      name: row.peer.name,
                      avatar: row.peer.avatar,
                      pinned: row.pinned,
                      archived: row.archived,
                    })
                  }
                />
              </SwipeThreadRow>
            ))}
          </div>
        )}
      </div>

      {menu && (
        <ThreadActionsSheet
          name={menu.name}
          avatar={menu.avatar}
          pinned={menu.pinned}
          archived={menu.archived}
          onClose={() => setMenu(null)}
          onPin={() => {
            handlePin(menu.peerId, menu.name, menu.pinned);
            setMenu(null);
          }}
          onArchive={() => {
            if (menu.archived) handleUnarchive(menu.peerId, menu.name);
            else handleArchive(menu.peerId, menu.name);
            setMenu(null);
          }}
          onDelete={() => {
            const id = menu.peerId;
            const name = menu.name;
            setMenu(null);
            handleDelete(id, name);
          }}
        />
      )}
      {showCompose && <ComposeSheet onClose={() => setShowCompose(false)} />}
      <BottomNav />
    </main>
  );
}

function ThreadRow({
  peer,
  peerId,
  last,
  unread,
  preview,
  topicListingId,
  topicListing,
  relationLine,
  pinned,
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
  eager?: boolean;
  onMore: () => void;
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
          {topicLine ? (
            <p className="text-[11px] font-semibold text-brand-700/80 dark:text-brand-300/90 truncate mt-px">
              {topicLine}
            </p>
          ) : (
            <p className="text-[11px] text-ink-muted truncate mt-px">
              {relationLine}
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
      <button
        type="button"
        onClick={onMore}
        aria-label={`گزینه‌های گفتگو با ${peer.name}`}
        className="shrink-0 w-11 flex items-center justify-center text-ink-muted hover:text-ink dark:hover:text-zinc-200 active:bg-stone-100/80 dark:active:bg-zinc-800"
      >
        <MoreIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

function ThreadActionsSheet({
  name,
  avatar,
  pinned,
  archived,
  onClose,
  onPin,
  onArchive,
  onDelete,
}: {
  name: string;
  avatar: string;
  pinned: boolean;
  archived: boolean;
  onClose: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <SheetShell
      onClose={onClose}
      labelledBy="thread-actions-title"
      zClass="z-50"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost w-full !py-3.5"
        >
          انصراف
        </button>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={name} src={avatar} size="md" showLevel={false} />
        <div className="min-w-0">
          <h2
            id="thread-actions-title"
            className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight truncate"
          >
            {name}
          </h2>
          <p className="text-[12px] text-ink-muted mt-0.5">
            این کارها فقط در لیست پیام‌های تو دیده می‌شود
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden">
        <ActionRow
          icon={<PinIcon className="w-[18px] h-[18px]" />}
          iconClass={
            pinned
              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
              : "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300"
          }
          title={pinned ? "برداشتن سنجاق" : "سنجاق بالای لیست"}
          hint={
            pinned
              ? "از بالای پیام‌ها پایین می‌آید"
              : "همیشه بالای بقیه گفتگوها می‌ماند"
          }
          onClick={onPin}
        />
        <div className="h-px bg-stone-100 dark:bg-zinc-800" />
        <ActionRow
          icon={<ArchiveIcon className="w-[18px] h-[18px]" />}
          iconClass="bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
          title={archived ? "بازگرداندن به پیام‌ها" : "آرشیو کردن"}
          hint={
            archived
              ? "دوباره در تب «همه» دیده می‌شود"
              : "از لیست اصلی می‌رود؛ از تب آرشیو برمی‌گردد"
          }
          onClick={onArchive}
        />
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="mt-3 w-full rounded-2xl border border-red-200/80 dark:border-red-500/25 bg-red-50/70 dark:bg-red-500/10 px-3.5 py-3 flex items-center gap-3 text-right active:scale-[0.99] transition-transform"
      >
        <span className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
          <TrashIcon className="w-[18px] h-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-bold text-red-700 dark:text-red-300">
            حذف برای من
          </span>
          <span className="block text-[11.5px] text-red-700/70 dark:text-red-300/70 mt-0.5 leading-snug">
            از دستگاه تو پاک می‌شود — برای {name} باقی می‌ماند
          </span>
        </span>
      </button>
    </SheetShell>
  );
}

function ActionRow({
  icon,
  iconClass,
  title,
  hint,
  onClick,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-3 text-right active:bg-stone-50 dark:active:bg-zinc-800/80 transition-colors"
    >
      <span
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-ink dark:text-zinc-100">
          {title}
        </span>
        <span className="block text-[11.5px] text-ink-muted mt-0.5 leading-snug">
          {hint}
        </span>
      </span>
    </button>
  );
}

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

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="card p-6 text-center mt-2">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-3">
        <ChatIcon className="w-7 h-7" />
      </div>
      <p className="font-bold text-ink dark:text-zinc-100">هنوز گفتگویی نداری</p>
      <p className="text-sm text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
        از یک آگهی پیام بده، یا همین‌جا با کسی از حلقه شروع کن.
      </p>
      <button type="button" onClick={onStart} className="btn-primary inline-block mt-4">
        پیام دادن
      </button>
      <Link href="/circle" className="block text-xs text-brand-600 font-medium mt-3">
        یا اول حلقه‌ات را بساز ‹
      </Link>
    </div>
  );
}

function ComposeSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const people = useStore((s) => s.people);
  const circle = useMemo(() => activeCircle(people), [people]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim();
    if (!needle) return circle;
    return circle.filter((p) => p.name.includes(needle));
  }, [circle, q]);

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="compose-title"
      zClass="z-50"
      footer={
        <button type="button" onClick={onClose} className="btn-ghost w-full !py-3">
          انصراف
        </button>
      }
    >
      <div className="flex items-start justify-between gap-3 mb-3 px-0.5">
        <div>
          <h2
            id="compose-title"
            className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50"
          >
            گفتگوی جدید
          </h2>
          <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1">
            فقط حلقه‌ات اینجاست
          </p>
        </div>
      </div>

      {circle.length > 0 && (
        <label className="relative block mb-3">
          <SearchIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی نام…"
            className="input !pr-9 !py-2.5 !text-[13px]"
            autoComplete="off"
            autoFocus
          />
        </label>
      )}

      <div className="card overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800 mb-2">
        {circle.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-ink-muted">هنوز کسی در حلقه‌ات نیست.</p>
            <Link href="/circle" className="btn-primary inline-block mt-4 text-sm">
              ساخت حلقه
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 px-4 text-sm text-ink-muted">کسی با این نام نیست.</p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onClose();
                router.push(`/messages/${p.id}`);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-right active:bg-stone-50/90 dark:active:bg-zinc-800/70 transition-colors"
            >
              <Avatar name={p.name} src={p.avatar} size="sm" showLevel={false} />
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
                  {p.name}
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  {viewerRelationPhrase(p)}
                </p>
              </div>
              <span className="text-brand-600" aria-hidden>
                <ChatIcon className="w-4 h-4" />
              </span>
            </button>
          ))
        )}
      </div>
    </SheetShell>
  );
}
