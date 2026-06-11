"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { ChatIcon, PencilIcon } from "@/components/Icons";
import { relationEmoji, relationLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";

export default function MessagesPage() {
  const { getPerson, getThread, threadPeers, unreadCount } = useStore();
  const peers = threadPeers();
  const [showCompose, setShowCompose] = useState(false);

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header
        title="پیام‌ها"
        action={
          <button
            onClick={() => setShowCompose(true)}
            aria-label="گفتگوی جدید"
            className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center active:bg-brand-700"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pt-3">
        {peers.length === 0 ? (
          <EmptyState onStart={() => setShowCompose(true)} />
        ) : (
          <>
            <div className="card divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
              {peers.map((peerId) => {
                const p = getPerson(peerId);
                if (!p) return null;
                const thread = getThread(peerId);
                const last = thread[thread.length - 1];
                const unread = unreadCount(peerId);
                return (
                  <Link
                    key={peerId}
                    href={`/messages/${peerId}`}
                    className={`flex items-center gap-3 p-3 transition-colors ${
                      unread
                        ? "bg-brand-50/60 dark:bg-brand-500/10 active:bg-brand-50"
                        : "active:bg-zinc-50 dark:active:bg-zinc-800"
                    }`}
                  >
                    <Avatar emoji={p.avatar} level={p.level} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {p.name}
                          </span>
                          <span className="text-[11px] font-normal text-zinc-400">
                            {" · "}
                            {relationLabels[p.relation]}
                          </span>
                        </span>
                        <span className="text-[11px] text-zinc-400 shrink-0">
                          {last?.postedAt}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p
                          className={`text-xs truncate flex-1 ${
                            unread
                              ? "text-zinc-800 dark:text-zinc-100 font-medium"
                              : "text-zinc-400"
                          }`}
                        >
                          {last?.listingId ? "📨 " : ""}
                          {last?.fromMe ? "شما: " : ""}
                          {last?.text}
                        </p>
                        {unread > 0 && (
                          <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center nums">
                            {toPersianDigits(unread)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-zinc-400 mt-4 leading-relaxed">
              گفتگوها فقط بین افراد حلقه‌ی شما برقرار می‌شود — بدون مزاحمت غریبه‌ها.
            </p>
          </>
        )}
      </div>

      {showCompose && <ComposeSheet onClose={() => setShowCompose(false)} />}
      <BottomNav />
    </main>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="card p-6 text-center mt-6">
      <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-3">
        <ChatIcon className="w-7 h-7" />
      </div>
      <p className="font-bold text-zinc-800 dark:text-zinc-100">هنوز گفتگویی نداری</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
        از یک آگهی یا پروفایل پیام بده، یا همین‌جا با کسی از حلقه‌ات گفتگو را شروع
        کن.
      </p>
      <button onClick={onStart} className="btn-primary inline-block mt-4">
        شروع گفتگو
      </button>
    </div>
  );
}

function ComposeSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { people } = useStore();
  const circle = people.filter((p) => p.inMyCircle);

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 animate-slide-up max-h-[85dvh] flex flex-col">
          <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4 shrink-0" />
          <h2 className="font-bold text-lg shrink-0">گفتگوی جدید</h2>
          <p className="text-xs text-zinc-400 mt-1 mb-3 shrink-0">
            با چه کسی از حلقه‌ات گفتگو می‌کنی؟
          </p>
          <div className="overflow-y-auto -mx-1 px-1 space-y-1">
            {circle.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">
                هنوز کسی در حلقه‌ی شما نیست.
              </p>
            ) : (
              circle.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onClose();
                    router.push(`/messages/${p.id}`);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl active:bg-zinc-50 dark:active:bg-zinc-800 text-right"
                >
                  <Avatar emoji={p.avatar} level={p.level} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {relationEmoji[p.relation]} {relationLabels[p.relation]}
                    </p>
                  </div>
                  <ChatIcon className="w-5 h-5 text-zinc-300 shrink-0" />
                </button>
              ))
            )}
          </div>
          <button onClick={onClose} className="btn-ghost w-full mt-4 shrink-0">
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
