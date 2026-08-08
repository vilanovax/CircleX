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
import { relationLabels } from "@/lib/labels";
import { threadPreview } from "@/lib/message-preview";
import { toPersianDigits } from "@/lib/persian";
import type { Message, Person } from "@/lib/types";

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

  const subtitle = useMemo(() => {
    if (!hydrated || peers.length === 0) return undefined;
    if (unreadTotal > 0) {
      return `${toPersianDigits(unreadTotal)} خوانده‌نشده`;
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
            className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:bg-brand-700 shadow-sm shadow-brand-600/20"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pt-3 space-y-3">
        {hydrated && peers.length > 0 && (
          <p className="flex items-center gap-1.5 text-[11px] text-ink-muted dark:text-zinc-400 px-0.5 leading-relaxed">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-levelA shrink-0" />
            فقط با افراد حلقه‌ات — بدون پیام از غریبه‌ها
          </p>
        )}

        {!hydrated ? (
          <ThreadListSkeleton count={5} />
        ) : peers.length === 0 ? (
          <EmptyState onStart={() => setShowCompose(true)} />
        ) : (
          <div className="card overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
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
      className="flex items-center gap-3 px-3.5 py-3 transition-colors active:bg-stone-50/90 dark:active:bg-zinc-800/60"
    >
      <Avatar name={peer.name} level={peer.level} size="sm" />

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
            <span className="ms-1.5 font-medium text-[11px] text-ink-muted dark:text-zinc-500">
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
            {last?.postedAt}
          </span>
        </div>

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
          {hasUnread && (
            <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center nums">
              {toPersianDigits(unread)}
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
      <Link
        href="/circle"
        className="block text-xs text-brand-600 font-medium mt-3"
      >
        یا اول حلقه‌ات را بساز ‹
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
        <div
          className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="compose-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-[color:var(--circle-surface)] dark:bg-zinc-900 rounded-t-[1.35rem] px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-slide-up max-h-[85dvh] flex flex-col outline-none shadow-[0_-8px_40px_rgba(26,24,22,0.12)]"
        >
          <div className="w-9 h-1 bg-stone-300/80 dark:bg-zinc-600 rounded-full mx-auto mb-4 shrink-0" />

          <div className="flex items-start justify-between gap-3 mb-3 px-0.5 shrink-0">
            <div>
              <h2
                id="compose-title"
                className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50"
              >
                گفتگوی جدید
              </h2>
              <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1">
                با چه کسی از حلقه‌ات؟
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-[13px] font-semibold text-ink-muted px-2 py-1 rounded-lg active:bg-stone-100 dark:active:bg-zinc-800"
            >
              بستن
            </button>
          </div>

          <div className="overflow-y-auto card divide-y divide-stone-100 dark:divide-zinc-800">
            {circle.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-ink-muted">هنوز کسی در حلقه‌ی شما نیست.</p>
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
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-right active:bg-stone-50/90 dark:active:bg-zinc-800/70 transition-colors"
                >
                  <Avatar name={p.name} level={p.level} size="sm" />
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      {relationLabels[p.relation]}
                    </p>
                  </div>
                  <span className="text-ink-faint text-base" aria-hidden>
                    ‹
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
