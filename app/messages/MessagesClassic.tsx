"use client";

import Link from "next/link";
import { ThreadListSkeleton } from "@/components/Skeleton";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import SheetShell from "@/components/SheetShell";
import {
  ChatIcon,
  PencilIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import { relationLabels } from "@/lib/labels";
import { threadPreview } from "@/lib/message-preview";
import { toPersianDigits } from "@/lib/persian";
import type { Message, Person } from "@/lib/types";

type Filter = "all" | "unread";

export default function MessagesClassic() {
  const {
    getPerson,
    getThread,
    getListing,
    threadPeers,
    unreadCount,
    totalUnread,
    hydrated,
  } = useStore();
  const peers = threadPeers();
  const unreadTotal = totalUnread();
  const [showCompose, setShowCompose] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const subtitle = useMemo(() => {
    if (!hydrated || peers.length === 0) return undefined;
    if (unreadTotal > 0) {
      return `${toPersianDigits(unreadTotal)} خوانده‌نشده`;
    }
    return `${toPersianDigits(peers.length)} گفتگو`;
  }, [hydrated, peers.length, unreadTotal]);

  const rows = useMemo(() => {
    const q = query.trim();
    return peers
      .map((peerId) => {
        const peer = getPerson(peerId);
        if (!peer) return null;
        const thread = getThread(peerId);
        const last = thread[thread.length - 1];
        const unread = unreadCount(peerId);
        return {
          peerId,
          peer,
          last,
          unread,
          preview: threadPreview(last, getListing),
        };
      })
      .filter((row): row is NonNullable<typeof row> => {
        if (!row) return false;
        if (filter === "unread" && row.unread === 0) return false;
        if (q && !row.peer.name.includes(q)) return false;
        return true;
      });
  }, [peers, getPerson, getThread, getListing, unreadCount, filter, query]);

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
          <div className="card overflow-hidden">
            <div className="px-3.5 pt-3.5 pb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
                  صندوق پیام
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                  {unreadTotal > 0
                    ? `${toPersianDigits(unreadTotal)} پیام منتظر جوابت`
                    : "همهٔ گفتگوها خوانده شده"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <StatPill
                  label="گفتگو"
                  value={toPersianDigits(peers.length)}
                />
                {unreadTotal > 0 && (
                  <StatPill
                    label="جدید"
                    value={toPersianDigits(unreadTotal)}
                    accent
                  />
                )}
              </div>
            </div>
            <div className="px-3.5 pb-3 flex items-center gap-1.5 text-[11px] text-levelA leading-relaxed">
              <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0" />
              فقط با افراد حلقه‌ات — بدون پیام از غریبه‌ها
            </div>
          </div>
        )}

        {hydrated && peers.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <FilterChip
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label="همه"
                count={peers.length}
              />
              <FilterChip
                active={filter === "unread"}
                onClick={() => setFilter("unread")}
                label="خوانده‌نشده"
                count={unreadTotal}
              />
            </div>
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
                ? "پیام خوانده‌نشده‌ای نیست — یا فیلتر را عوض کن."
                : "نام دیگری امتحان کن."}
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
            {rows.map(({ peerId, peer, last, unread, preview }) => (
              <ThreadRow
                key={peerId}
                peer={peer}
                peerId={peerId}
                last={last}
                unread={unread}
                preview={preview}
              />
            ))}
          </div>
        )}
      </div>

      {showCompose && <ComposeSheet onClose={() => setShowCompose(false)} />}
      <BottomNav />
    </main>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-2.5 py-1.5 text-center min-w-[3.25rem] ${
        accent
          ? "bg-brand-600 text-white"
          : "bg-stone-100 dark:bg-zinc-800 text-ink dark:text-zinc-100"
      }`}
    >
      <p className="text-[13px] font-extrabold nums leading-none">{value}</p>
      <p
        className={`text-[9px] mt-0.5 ${
          accent ? "text-white/80" : "text-ink-muted"
        }`}
      >
        {label}
      </p>
    </div>
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
      className={`chip !px-3 !py-1.5 !text-[12px] border transition-colors ${
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

function ThreadRow({
  peer,
  peerId,
  last,
  unread,
  preview,
}: {
  peer: Person;
  peerId: string;
  last: Message | undefined;
  unread: number;
  preview: string;
}) {
  const hasUnread = unread > 0;

  return (
    <Link
      href={`/messages/${peerId}`}
      className={`flex items-center gap-3 px-3.5 py-3 transition-colors active:bg-stone-50/90 dark:active:bg-zinc-800/60 ${
        hasUnread ? "bg-brand-50/55 dark:bg-brand-500/10" : ""
      }`}
    >
      <Avatar name={peer.name} src={peer.avatar} level={peer.level} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={`text-[14px] truncate ${
              hasUnread
                ? "font-extrabold text-ink dark:text-zinc-50"
                : "font-bold text-ink dark:text-zinc-100"
            }`}
          >
            {peer.name}
            <span className="ms-1.5 inline-block align-middle font-medium text-[10px] text-ink-muted dark:text-zinc-500 px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800">
              {relationLabels[peer.relation]}
            </span>
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

        <div className="flex items-center gap-2 mt-1">
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
          ) : (
            <span className="shrink-0 text-ink-faint text-sm" aria-hidden>
              ‹
            </span>
          )}
        </div>
      </div>
    </Link>
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
        از یک آگهی پیام بده، یا همین‌جا با کسی از حلقه‌ات شروع کن.
      </p>
      <button type="button" onClick={onStart} className="btn-primary inline-block mt-4">
        شروع گفتگو
      </button>
      <Link href="/circle" className="block text-xs text-brand-600 font-medium mt-3">
        یا اول حلقه‌ات را بساز ‹
      </Link>
    </div>
  );
}

function ComposeSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);
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
            فقط افراد حلقه‌ات اینجا هستند
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
            <p className="text-sm text-ink-muted">هنوز کسی در حلقه‌ی شما نیست.</p>
            <Link href="/circle" className="btn-primary inline-block mt-4 text-sm">
              ساخت حلقه‌ی اعتماد
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
              <Avatar name={p.name} src={p.avatar} level={p.level} size="sm" />
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
                  {p.name}
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  {relationLabels[p.relation]} · سطح {p.level}
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
