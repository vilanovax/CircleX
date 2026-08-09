"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import Avatar from "@/components/Avatar";
import ListingImage from "@/components/ListingImage";
import Header from "@/components/Header";
import LockedMessaging from "@/components/LockedMessaging";
import { SendIcon, ShieldCheckIcon } from "@/components/Icons";
import { levelChip, levelShort, relationLabels, formatPrice } from "@/lib/labels";
import { canDirectMessage } from "@/lib/messaging";
import type { Message } from "@/lib/types";

export default function ThreadClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const peerId = String(params.id);
  const { getPerson, getThread, addMessage, markThreadRead } = useStore();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const peer = getPerson(peerId);
  const thread = getThread(peerId);

  useEffect(() => {
    markThreadRead(peerId);
  }, [peerId, markThreadRead]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [text]);

  if (!peer) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-sm text-ink-faint">کاربر پیدا نشد.</p>
      </main>
    );
  }

  if (!canDirectMessage(peer, thread.length > 0)) {
    return (
      <main className="min-h-[100dvh] pb-8">
        <Header
          back
          fallbackHref="/messages"
          title={peer.name}
          subtitle="پیام قفل است"
        />
        <LockedMessaging peer={peer} />
      </main>
    );
  }

  function send() {
    const t = text.trim();
    if (!t) return;
    addMessage(peerId, t);
    setText("");
    inputRef.current?.focus();
  }

  return (
    <main className="flex flex-col h-[100dvh]">
      <Header back fallbackHref="/messages">
        <Link
          href={`/person/${peerId}`}
          className="flex items-center gap-2.5 min-w-0 active:opacity-70"
        >
          <Avatar name={peer.name} level={peer.level} size="sm" />
          <div className="min-w-0">
            <p className="font-extrabold text-[14px] text-ink dark:text-zinc-100 leading-tight truncate">
              {peer.name}
            </p>
            <p className="flex items-center gap-1.5 mt-0.5 min-w-0">
              <span className="text-[11px] text-ink-muted dark:text-zinc-400 truncate">
                {relationLabels[peer.relation]}
              </span>
              {/* Skip level chip when it repeats the relation word (e.g. آشنا / آشنا). */}
              {levelShort[peer.level] !== relationLabels[peer.relation] && (
                <span
                  className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${levelChip[peer.level]}`}
                >
                  {levelShort[peer.level]}
                </span>
              )}
            </p>
          </div>
        </Link>
      </Header>

      <div className="shrink-0 px-3 py-1.5 bg-levelA/8 dark:bg-levelA/10 border-b border-levelA/15">
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-levelA font-medium">
          <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0" />
          گفتگوی امن داخل حلقه
        </p>
      </div>

      <div
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3"
        style={{
          backgroundColor: "var(--circle-canvas)",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.035) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      >
        {thread.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16 px-6">
            <Avatar name={peer.name} level={peer.level} size="lg" />
            <p className="font-bold text-ink dark:text-zinc-100 mt-4">
              گفتگو با {peer.name}
            </p>
            <p className="text-[13px] text-ink-muted mt-1.5 leading-relaxed max-w-xs">
              اولین پیام را بفرست — فقط افراد حلقه‌ات اینجا هستند.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {thread.map((msg, i) => {
              const prev = thread[i - 1];
              const next = thread[i + 1];
              const showDay =
                !prev || dayKey(prev.postedAt) !== dayKey(msg.postedAt);
              const samePrev = Boolean(prev && prev.fromMe === msg.fromMe);
              const sameNext = Boolean(next && next.fromMe === msg.fromMe);
              const showAvatar = !msg.fromMe && !sameNext;
              // Day chip covers relative labels; keep per-bubble time for clock-like stamps.
              const showTime = !sameNext && isClockStamp(msg.postedAt);

              return (
                <div key={msg.id}>
                  {showDay && <DayDivider label={dayKey(msg.postedAt)} />}
                  <div
                    // LTR row geometry so justify-end = screen-right (WhatsApp-like),
                    // while bubble text stays RTL via unicode / nested dir.
                    dir="ltr"
                    className={`flex items-end gap-2 ${
                      msg.fromMe ? "justify-end" : "justify-start"
                    } ${samePrev && !showDay ? "mt-0.5" : "mt-2.5"}`}
                  >
                    {!msg.fromMe && (
                      <div className="w-8 shrink-0">
                        {showAvatar ? (
                          <Avatar name={peer.name} level={peer.level} size="sm" />
                        ) : null}
                      </div>
                    )}
                    <Bubble
                      msg={msg}
                      clusteredTop={samePrev && !showDay}
                      clusteredBottom={sameNext}
                      showTime={showTime}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/70 dark:border-zinc-800 px-2.5 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
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
            className="flex-1 resize-none max-h-28 min-h-[44px] rounded-2xl border border-stone-200 dark:border-zinc-700 bg-stone-50/80 dark:bg-zinc-800/80 px-3.5 py-2.5 text-[13px] text-ink dark:text-zinc-100 placeholder:text-ink-faint outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 leading-relaxed"
          />
          <button
            type="button"
            onClick={send}
            disabled={!text.trim()}
            aria-label="ارسال"
            className="shrink-0 w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center active:scale-95 disabled:opacity-35 shadow-md shadow-brand-600/25 transition-transform duration-150"
          >
            <SendIcon className="w-5 h-5 -ms-0.5" />
          </button>
        </div>
      </div>
    </main>
  );
}

function dayKey(postedAt: string): string {
  // Mock data uses relative Persian labels; treat each label as a day bucket.
  return postedAt.trim() || "—";
}

function isClockStamp(postedAt: string): boolean {
  return /[:：]/.test(postedAt) || postedAt.includes("همین");
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[11px] font-semibold text-ink-muted dark:text-zinc-400 bg-[color:var(--circle-surface)]/90 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-zinc-700 px-2.5 py-0.5 rounded-full shadow-sm nums">
        {label}
      </span>
    </div>
  );
}

function Bubble({
  msg,
  clusteredTop,
  clusteredBottom,
  showTime,
}: {
  msg: Message;
  clusteredTop: boolean;
  clusteredBottom: boolean;
  showTime: boolean;
}) {
  // Tail toward the screen edge: own (right) → right corners; peer (left) → left.
  const radius = msg.fromMe
    ? [
        "rounded-2xl",
        clusteredTop ? "rounded-br-md" : "rounded-br-2xl",
        clusteredBottom ? "rounded-tr-md" : "rounded-tr-2xl",
        "rounded-bl-2xl",
        "rounded-tl-2xl",
      ].join(" ")
    : [
        "rounded-2xl",
        clusteredTop ? "rounded-bl-md" : "rounded-bl-2xl",
        clusteredBottom ? "rounded-tl-md" : "rounded-tl-2xl",
        "rounded-br-2xl",
        "rounded-tr-2xl",
      ].join(" ");

  return (
    <div
      dir="rtl"
      className={`max-w-[78%] px-3.5 py-2.5 text-[13px] leading-relaxed text-right ${radius} ${
        msg.fromMe
          ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
          : "bg-[color:var(--circle-surface)] text-ink shadow-card dark:bg-zinc-900 dark:text-zinc-100 dark:border dark:border-zinc-800"
      }`}
    >
      {msg.listingId ? (
        <>
          <p className="text-[11px] font-medium mb-1.5 opacity-80">
            {msg.fromMe ? "آگهی‌ای که فرستادی:" : "آگهی معرفی‌شده:"}
          </p>
          <ReferralCard listingId={msg.listingId} fromMe={msg.fromMe} />
          {msg.text.trim() && (
            <p className="whitespace-pre-line mt-2 opacity-95">{msg.text}</p>
          )}
        </>
      ) : (
        <p className="whitespace-pre-line">{msg.text}</p>
      )}
      {showTime && (
        <span
          className={`block text-[10px] mt-1.5 nums ${
            msg.fromMe ? "text-white/70" : "text-ink-faint"
          }`}
        >
          {msg.postedAt}
        </span>
      )}
    </div>
  );
}

function ReferralCard({
  listingId,
  fromMe,
}: {
  listingId: string;
  fromMe?: boolean;
}) {
  const { getListing } = useStore();
  const listing = getListing(listingId);
  if (!listing) return null;
  return (
    <Link
      href={`/listing/${listing.id}`}
      className={`flex items-center gap-2.5 rounded-xl p-2 active:opacity-90 border ${
        fromMe
          ? "bg-white/15 border-white/25 text-white"
          : "bg-stone-50 dark:bg-zinc-800 border-stone-200/70 dark:border-zinc-700"
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
            fromMe ? "text-white" : "text-ink dark:text-zinc-100"
          }`}
        >
          {listing.title}
        </p>
        <p
          className={`text-[11px] font-bold nums ${
            fromMe ? "text-white/80" : "text-ink dark:text-zinc-200"
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
        className={`text-base shrink-0 ${fromMe ? "text-white/60" : "text-ink-faint"}`}
        aria-hidden
      >
        ‹
      </span>
    </Link>
  );
}
