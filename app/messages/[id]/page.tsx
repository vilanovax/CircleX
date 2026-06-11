"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import Avatar from "@/components/Avatar";
import Header from "@/components/Header";
import { relationLabels, levelShort, formatPrice } from "@/lib/labels";

export default function ConversationPage() {
  const params = useParams();
  const peerId = String(params.id);
  const { getPerson, getThread, addMessage, markThreadRead } = useStore();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const peer = getPerson(peerId);
  const thread = getThread(peerId);

  // Mark incoming messages as read when the thread is opened.
  useEffect(() => {
    markThreadRead(peerId);
  }, [peerId, markThreadRead]);

  // Keep the latest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  if (!peer) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-sm text-zinc-400">کاربر پیدا نشد.</p>
      </main>
    );
  }

  function send() {
    const t = text.trim();
    if (!t) return;
    addMessage(peerId, t);
    setText("");
  }

  return (
    <main className="flex flex-col h-[100dvh]">
      {/* Conversation header (shared Header with a custom title slot) */}
      <Header back>
        <Link
          href={`/person/${peerId}`}
          className="flex items-center gap-2 min-w-0 active:opacity-70"
        >
          <Avatar emoji={peer.avatar} level={peer.level} size="sm" />
          <div className="min-w-0">
            <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
              {peer.name}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {relationLabels[peer.relation]} · {levelShort[peer.level]}
            </p>
          </div>
        </Link>
      </Header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#f4f4f7] dark:bg-[#0a0a0c]">
        {thread.length === 0 ? (
          <div className="text-center text-zinc-400 text-sm pt-20">
            گفتگو را با {peer.name} شروع کنید.
          </div>
        ) : (
          thread.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.fromMe
                    ? "bg-brand-600 text-white rounded-bl-md"
                    : "bg-white text-zinc-800 shadow-card rounded-br-md dark:border dark:border-zinc-800"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                {msg.listingId && <ReferralCard listingId={msg.listingId} />}
                <span
                  className={`block text-[11px] mt-1 ${
                    msg.fromMe ? "text-brand-100" : "text-zinc-400"
                  }`}
                >
                  {msg.postedAt}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 bg-white border-t border-zinc-100 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="پیام بنویس…"
            className="field !py-2.5 resize-none max-h-28 flex-1"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            aria-label="ارسال"
            className="shrink-0 w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center active:bg-brand-700 disabled:opacity-40"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}

/** Compact listing preview attached to a referral message. */
function ReferralCard({ listingId }: { listingId: string }) {
  const { getListing } = useStore();
  const listing = getListing(listingId);
  if (!listing) return null;
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="mt-2 flex items-center gap-2.5 bg-zinc-50 border border-zinc-200/70 rounded-xl p-2 active:opacity-90"
    >
      <div className="w-11 h-11 rounded-lg bg-zinc-100 flex items-center justify-center text-2xl shrink-0">
        {listing.image}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-zinc-900 truncate">
          {listing.title}
        </p>
        <p className="text-[11px] text-brand-700 font-bold nums">
          {listing.price != null
            ? formatPrice(listing.price)
            : listing.type === "service"
              ? "توافقی"
              : "رایگان"}
        </p>
      </div>
      <span className="text-zinc-300 text-lg shrink-0">‹</span>
    </Link>
  );
}

function SendIcon({ className }: { className?: string }) {
  // Arrow pointing right→ flipped for RTL send direction (points left).
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 4 3 11l6 2 2 6 9-15Z" />
      <path d="M9 13l4-4" />
    </svg>
  );
}
