"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import Avatar from "@/components/Avatar";
import ListingImage from "@/components/ListingImage";
import Header from "@/components/Header";
import LockedMessaging from "@/components/LockedMessaging";
import { relationLabels, levelShort, formatPrice } from "@/lib/labels";
import { canDirectMessage } from "@/lib/messaging";

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

  if (!canDirectMessage(peer, thread.length > 0)) {
    return (
      <main className="min-h-[100dvh]">
        <Header back title="پیام" />
        <LockedMessaging peer={peer} />
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
          <Avatar name={peer.name} level={peer.level} size="sm" />
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
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-[#f4f4f7] dark:bg-[#0a0a0c]">
        {thread.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16 px-6">
            <Avatar name={peer.name} level={peer.level} size="lg" />
            <p className="font-semibold text-zinc-800 dark:text-zinc-100 mt-4">
              گفتگو با {peer.name}
            </p>
            <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
              اولین پیام را بفرست — در حلقه‌ی اعتمادت امن است.
            </p>
          </div>
        ) : (
          thread.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.fromMe ? "justify-end" : "justify-start"}`}
            >
              {!msg.fromMe && (
                <Avatar name={peer.name} level={peer.level} size="sm" />
              )}
              <div
                className={`max-w-[76%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.fromMe
                    ? "bg-brand-600 text-white rounded-bl-md shadow-sm shadow-brand-600/20"
                    : "bg-white text-zinc-800 shadow-card rounded-br-md dark:bg-zinc-900 dark:text-zinc-100 dark:border dark:border-zinc-800"
                }`}
              >
                {msg.listingId ? (
                  <>
                    <p className="text-[11px] font-medium mb-1.5 opacity-80">
                      {msg.fromMe ? "آگهی‌ای که فرستادی:" : "آگهی معرفی‌شده:"}
                    </p>
                    <ReferralCard listingId={msg.listingId} fromMe={msg.fromMe} />
                    {msg.text.trim() && (
                      <p className="whitespace-pre-line mt-2 text-[13px] opacity-90">{msg.text}</p>
                    )}
                  </>
                ) : (
                  <p className="whitespace-pre-line">{msg.text}</p>
                )}
                <span
                  className={`block text-[10px] mt-1.5 ${
                    msg.fromMe ? "text-brand-100/90" : "text-zinc-400"
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
      <div className="shrink-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
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
function ReferralCard({ listingId, fromMe }: { listingId: string; fromMe?: boolean }) {
  const { getListing } = useStore();
  const listing = getListing(listingId);
  if (!listing) return null;
  return (
    <Link
      href={`/listing/${listing.id}`}
      className={`flex items-center gap-2.5 rounded-xl p-2.5 active:opacity-90 border ${
        fromMe
          ? "bg-white/15 border-white/25 text-white"
          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200/70 dark:border-zinc-700"
      }`}
    >
      <ListingImage
        image={listing.image}
        alt={listing.title}
        size="sm"
        category={listing.category}
        type={listing.type}
        frameClassName={`w-11 h-11 rounded-lg overflow-hidden shrink-0 ${
          fromMe ? "ring-1 ring-white/25" : ""
        }`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-semibold truncate ${
            fromMe ? "text-white" : "text-zinc-900 dark:text-zinc-100"
          }`}
        >
          {listing.title}
        </p>
        <p
          className={`text-[11px] font-bold nums ${
            fromMe ? "text-brand-100" : "text-brand-700 dark:text-brand-300"
          }`}
        >
          {listing.price != null
            ? formatPrice(listing.price)
            : listing.type === "service"
              ? "توافقی"
              : "رایگان"}
        </p>
      </div>
      <span
        className={`text-lg shrink-0 ${fromMe ? "text-white/60" : "text-zinc-300 dark:text-zinc-600"}`}
      >
        ‹
      </span>
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
