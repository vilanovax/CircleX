"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { toPersianDigits } from "@/lib/persian";

export default function MessagesPage() {
  const { getPerson, getThread, threadPeers, unreadCount } = useStore();
  const peers = threadPeers();

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header title="پیام‌ها" />

      <div className="px-4 pt-3">
        {peers.length === 0 ? (
          <p className="text-center text-zinc-400 py-16 text-sm">
            هنوز گفتگویی نداری.
          </p>
        ) : (
          <div className="card divide-y divide-zinc-100">
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
                  className="flex items-center gap-3 p-3 active:bg-zinc-50"
                >
                  <Avatar emoji={p.avatar} level={p.level} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-zinc-900">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {last?.postedAt}
                      </span>
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        unread ? "text-zinc-800 font-medium" : "text-zinc-400"
                      }`}
                    >
                      {last?.fromMe ? "شما: " : ""}
                      {last?.text}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center nums">
                      {toPersianDigits(unread)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <p className="text-center text-[11px] text-zinc-400 mt-4 leading-relaxed">
          گفتگوها فقط بین افراد حلقه‌ی شما برقرار می‌شود — بدون مزاحمت غریبه‌ها.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
