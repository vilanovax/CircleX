"use client";

import Link from "next/link";
import { ThreadListSkeleton } from "@/components/Skeleton";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { ChatIcon, PencilIcon, ShieldCheckIcon } from "@/components/Icons";
import { relationEmoji, relationLabels } from "@/lib/labels";
import { threadPreview } from "@/lib/message-preview";
import { toPersianDigits } from "@/lib/persian";
import type { Message, Person } from "@/lib/types";

export default function MessagesPage() {
  const { getPerson, getThread, getListing, threadPeers, unreadCount, totalUnread, hydrated } =
    useStore();
  const peers = threadPeers();
  const unreadTotal = totalUnread();
  const [showCompose, setShowCompose] = useState(false);

  const subtitle = useMemo(() => {
    if (!hydrated || peers.length === 0) return undefined;
    if (unreadTotal > 0) {
      return `${toPersianDigits(unreadTotal)} پیام خوانده‌نشده`;
    }
    return `${toPersianDigits(peers.length)} گفتگو`;
  }, [hydrated, peers.length, unreadTotal]);

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header
        title="پیام‌ها"
        subtitle={subtitle}
        action={
          <button
            onClick={() => setShowCompose(true)}
            aria-label="گفتگوی جدید"
            className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center active:bg-brand-700 shadow-sm shadow-brand-600/25"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pt-3 space-y-3">
        {hydrated && peers.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-brand-50/80 dark:bg-brand-500/10 border border-brand-100/80 dark:border-brand-500/20 px-3 py-2">
            <ShieldCheckIcon className="w-4 h-4 text-brand-600 shrink-0" />
            <p className="text-[11px] text-brand-800 dark:text-brand-200 leading-relaxed">
              فقط با افراد حلقه‌ات — بدون پیام از غریبه‌ها
            </p>
          </div>
        )}

        {!hydrated ? (
          <ThreadListSkeleton count={5} />
        ) : peers.length === 0 ? (
          <EmptyState onStart={() => setShowCompose(true)} />
        ) : (
          <div className="card overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {peers.map((peerId) => {
              const p = getPerson(peerId);
              if (!p) return null;
              const thread = getThread(peerId);
              const last = thread[thread.length - 1];
              const unread = unreadCount(peerId);
              return (
                <ThreadRow
                  key={peerId}
                  peer={p}
                  peerId={peerId}
                  last={last}
                  unread={unread}
                  preview={threadPreview(last, getListing)}
                />
              );
            })}
          </div>
        )}
      </div>

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
      className={`flex items-center gap-3 px-3 py-3.5 transition-colors active:scale-[0.995] ${
        hasUnread
          ? "bg-brand-50/70 dark:bg-brand-500/10"
          : "active:bg-zinc-50 dark:active:bg-zinc-800/80"
      }`}
    >
      <div className="relative shrink-0">
        <Avatar name={peer.name} level={peer.level} size="md" />
        {hasUnread && (
          <span
            className="absolute top-0 right-0 w-3 h-3 rounded-full bg-brand-600 ring-2 ring-white dark:ring-zinc-900"
            aria-hidden
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`text-[15px] truncate ${
                hasUnread
                  ? "font-bold text-zinc-900 dark:text-zinc-50"
                  : "font-semibold text-zinc-800 dark:text-zinc-100"
              }`}
            >
              {peer.name}
            </span>
            <span className="chip bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 !text-[10px] !py-0.5 shrink-0">
              {relationEmoji[peer.relation]} {relationLabels[peer.relation]}
            </span>
          </div>
          <span
            className={`text-[11px] shrink-0 nums ${
              hasUnread ? "text-brand-600 font-semibold" : "text-zinc-400"
            }`}
          >
            {last?.postedAt}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <p
            className={`text-[13px] leading-snug truncate flex-1 ${
              hasUnread
                ? "text-zinc-800 dark:text-zinc-100 font-medium"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {preview}
          </p>
          {hasUnread ? (
            <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center nums">
              {toPersianDigits(unread)}
            </span>
          ) : (
            <span className="text-zinc-300 dark:text-zinc-600 text-sm shrink-0" aria-hidden>
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
    <div className="card p-6 text-center mt-4">
      <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-3">
        <ChatIcon className="w-7 h-7" />
      </div>
      <p className="font-bold text-zinc-800 dark:text-zinc-100">هنوز گفتگویی نداری</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
        از یک آگهی یا پروفایل پیام بده، یا همین‌جا با کسی از حلقه‌ات گفتگو را شروع کن.
      </p>
      <button type="button" onClick={onStart} className="btn-primary inline-block mt-4">
        شروع گفتگو
      </button>
      <Link href="/circle" className="block text-xs text-brand-600 font-medium mt-3">
        یا اول حلقه‌ات را بساز ›
      </Link>
    </div>
  );
}

function ComposeSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose);

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="compose-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 animate-slide-up max-h-[85dvh] flex flex-col outline-none"
        >
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4 shrink-0" />
          <h2 id="compose-title" className="font-bold text-lg shrink-0 text-zinc-900 dark:text-zinc-100">
            گفتگوی جدید
          </h2>
          <p className="text-xs text-zinc-400 mt-1 mb-3 shrink-0">
            با چه کسی از حلقه‌ات گفتگو می‌کنی؟
          </p>
          <div className="overflow-y-auto -mx-1 px-1 space-y-1">
            {circle.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-zinc-400">هنوز کسی در حلقه‌ی شما نیست.</p>
                <Link href="/circle" className="btn-primary inline-block mt-4 text-sm">
                  ساخت حلقه‌ی اعتماد
                </Link>
              </div>
            ) : (
              circle.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/messages/${p.id}`);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 active:bg-zinc-50 dark:active:bg-zinc-800 text-right transition-colors"
                >
                  <Avatar name={p.name} level={p.level} size="sm" />
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {relationEmoji[p.relation]} {relationLabels[p.relation]}
                    </p>
                  </div>
                  <ChatIcon className="w-5 h-5 text-brand-400 shrink-0" />
                </button>
              ))
            )}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost w-full mt-4 shrink-0">
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
