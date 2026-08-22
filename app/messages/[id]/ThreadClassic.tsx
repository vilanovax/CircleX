"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import Avatar from "@/components/Avatar";
import ListingImage from "@/components/ListingImage";
import ListingAskPrompts from "@/components/ListingAskPrompts";
import Header from "@/components/Header";
import LockedMessaging from "@/components/LockedMessaging";
import { SendIcon } from "@/components/Icons";
import { formatPrice } from "@/lib/labels";
import {
  listingSubject,
  suggestThreadChips,
  type BuyerPrompt,
} from "@/lib/listing-prompts";
import { canOpenThread } from "@/lib/messaging";
import { canView } from "@/lib/trust";
import {
  latestListingIdInThread,
  recalledThreadListing,
  rememberThreadListing,
  resolveThreadListingId,
  shouldAttachListingOnSend,
} from "@/lib/thread-listing";
import { chatPeerSubtitle, viaConnectorName } from "@/lib/trust";
import type { Message } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function ThreadClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const peerId = String(params.id);
  const people = useStore((s) => s.people);
  const listings = useStore((s) => s.listings);
  const requests = useStore((s) => s.requests);
  const networkLinks = useStore((s) => s.networkLinks);
  const getPerson = useStore((s) => s.getPerson);
  const getThread = useStore((s) => s.getThread);
  const getListing = useStore((s) => s.getListing);
  const ensureListing = useStore((s) => s.ensureListing);
  const addMessage = useStore((s) => s.addMessage);
  const markThreadRead = useStore((s) => s.markThreadRead);
  const setListingDealStatus = useStore((s) => s.setListingDealStatus);
  const { show } = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [listingLoadState, setListingLoadState] = useState<
    "idle" | "loading" | "ready" | "missing"
  >("idle");
  const draftApplied = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const peer = getPerson(peerId);
  const thread = getThread(peerId);
  const queryListingId = searchParams.get("listing");
  const [sessionListingId, setSessionListingId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    setSessionListingId(recalledThreadListing(peerId));
  }, [peerId]);

  const activeListingId = useMemo(() => {
    const id = resolveThreadListingId({
      peerId,
      queryListingId,
      thread,
    });
    // resolve prefers query → thread; fall back to post-mount session recall
    return id ?? sessionListingId;
  }, [peerId, queryListingId, thread, sessionListingId]);

  useEffect(() => {
    if (activeListingId) setSessionListingId(activeListingId);
  }, [activeListingId]);

  const contextListing = activeListingId
    ? getListing(activeListingId)
    : undefined;
  const isSellerOfContext = contextListing?.sellerId === "me";
  const dealStatus = contextListing?.dealStatus ?? "available";

  useEffect(() => {
    if (!activeListingId) {
      setListingLoadState("idle");
      return;
    }
    rememberThreadListing(peerId, activeListingId);
    if (contextListing) {
      setListingLoadState("ready");
      return;
    }
    let cancelled = false;
    setListingLoadState("loading");
    void ensureListing(activeListingId).then((row) => {
      if (cancelled) return;
      setListingLoadState(row ? "ready" : "missing");
    });
    return () => {
      cancelled = true;
    };
  }, [activeListingId, contextListing, ensureListing, peerId]);

  const viaName = useMemo(
    () => viaConnectorName(peerId, getPerson, networkLinks, people),
    [peerId, getPerson, networkLinks, people],
  );

  const subtitle = peer ? chatPeerSubtitle(peer, viaName) : "";

  const chips = useMemo(
    () =>
      suggestThreadChips({
        listing: contextListing,
        isSeller: isSellerOfContext,
        threadLength: thread.length,
      }),
    [contextListing, isSellerOfContext, thread.length],
  );

  const hasVisibleOfferings = useMemo(
    () =>
      listings.some((l) => l.sellerId === peerId && canView(l, getPerson)) ||
      requests.some((r) => r.requesterId === peerId && canView(r, getPerson)),
    [listings, requests, peerId, getPerson],
  );

  const canChat = peer
    ? canOpenThread(peer, {
        hasThread: thread.length > 0,
        listing: contextListing,
        getPerson,
        hasVisibleOfferings,
      })
    : false;

  useEffect(() => {
    markThreadRead(peerId);
  }, [peerId, markThreadRead]);

  useEffect(() => {
    if (draftApplied.current) return;
    const draft = searchParams.get("draft");
    if (!draft) return;
    draftApplied.current = true;
    setText(draft);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [searchParams]);

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

  if (activeListingId && listingLoadState === "loading") {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-sm text-ink-faint">در حال باز کردن گفتگو…</p>
      </main>
    );
  }

  if (!canChat) {
    return (
      <main className="min-h-[100dvh] pb-8">
        <Header
          back
          fallbackHref="/messages"
          title={peer.name}
          subtitle="پیام قفل است"
        />
        <LockedMessaging
          peer={peer}
          listingContext={Boolean(activeListingId)}
        />
      </main>
    );
  }

  async function send() {
    const t = text.trim();
    if (!t || sending) return;
    const attachListing = shouldAttachListingOnSend(thread, activeListingId)
      ? activeListingId
      : undefined;
    if (activeListingId) rememberThreadListing(peerId, activeListingId);
    setSending(true);
    try {
      await addMessage(peerId, t, attachListing);
      setText("");
    } catch (err) {
      show(
        err instanceof ApiError ? err.message : "ارسال نشد. دوباره بزن.",
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function notifySendError(err: unknown) {
    show(err instanceof ApiError ? err.message : "ارسال نشد. دوباره بزن.");
  }

  function applyChip(prompt: BuyerPrompt) {
    setText(prompt.draft);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const len = prompt.draft.length;
      el.setSelectionRange(len, len);
    });
  }

  const emptyHint = contextListing
    ? `دربارهٔ ${listingSubject(contextListing)} — اولین پیام را بفرست.`
    : "اولین پیام را بفرست.";

  const chipTitle =
    thread.length === 0
      ? isSellerOfContext
        ? "برای پاسخ سریع:"
        : "برای شروع می‌تونی بپرسی:"
      : isSellerOfContext
        ? "پاسخ پیشنهادی:"
        : "می‌تونی بپرسی:";

  return (
    <main className="flex flex-col h-[100dvh]">
      <Header back fallbackHref="/messages">
        <Link
          href={`/person/${peerId}`}
          className="flex items-center gap-2.5 min-w-0 active:opacity-70"
        >
          <Avatar name={peer.name} src={peer.avatar} size="sm" showLevel={false} />
          <div className="min-w-0">
            <p className="font-extrabold text-[14px] text-ink dark:text-zinc-100 leading-tight truncate">
              {peer.name}
            </p>
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 truncate">
              {subtitle}
            </p>
          </div>
        </Link>
      </Header>

      {contextListing && (
        <div className="shrink-0 border-b border-stone-200/70 dark:border-zinc-800 bg-[color:var(--circle-surface)] dark:bg-zinc-900 px-3 py-2.5">
          <Link
            href={`/listing/${contextListing.id}`}
            className="flex items-center gap-2.5 active:opacity-80"
          >
            <ListingImage
              image={contextListing.image}
              alt={contextListing.title}
              size="sm"
              category={contextListing.category}
              type={contextListing.type}
              frameClassName="w-11 h-11 rounded-lg overflow-hidden shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-ink dark:text-zinc-100 truncate">
                {contextListing.title}
              </p>
              <p className="text-[11px] text-ink-muted nums">
                {contextListing.price != null
                  ? formatPrice(contextListing.price)
                  : contextListing.type === "service"
                    ? "توافقی"
                    : "رایگان"}
                {" · "}
                {dealStatus === "inactive"
                  ? "غیرفعال"
                  : dealStatus === "reserved"
                    ? "رزرو شده"
                    : dealStatus === "agreed"
                      ? "توافق شده"
                      : "موجود"}
              </p>
            </div>
            <span className="text-ink-faint text-sm" aria-hidden>
              ‹
            </span>
          </Link>
          {isSellerOfContext && dealStatus !== "inactive" && (
            <div className="mt-2.5">
              <p className="text-[10px] font-semibold text-ink-faint mb-1.5">
                وضعیت آگهی را برای طرف مقابل مشخص کن
              </p>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  [
                    ["available", "موجود"],
                    ["reserved", "رزرو"],
                    ["agreed", "توافق"],
                  ] as const
                ).map(([id, label]) => {
                  const active = dealStatus === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setListingDealStatus(contextListing.id, id);
                        if (id === "reserved") {
                          void addMessage(
                            peerId,
                            "این آگهی را موقتاً رزرو کردم تا هماهنگ کنیم.",
                          ).catch(notifySendError);
                        } else if (id === "agreed") {
                          void addMessage(
                            peerId,
                            "روی این آگهی به توافق رسیدیم ✓",
                          ).catch(notifySendError);
                        } else {
                          void addMessage(
                            peerId,
                            "آگهی دوباره موجود است.",
                          ).catch(notifySendError);
                        }
                      }}
                      className={`shrink-0 chip !px-2.5 !py-1 !text-[11px] border ${
                        active
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-stone-50 text-ink-muted border-stone-200/80 dark:bg-zinc-800 dark:border-zinc-700"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
            <Avatar name={peer.name} src={peer.avatar} size="lg" showLevel={false} />
            <p className="font-bold text-ink dark:text-zinc-100 mt-4">
              گفتگو با {peer.name}
            </p>
            <p className="text-[13px] text-ink-muted mt-1.5 leading-relaxed max-w-xs">
              {emptyHint}
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
                          <Avatar name={peer.name} src={peer.avatar} size="sm" showLevel={false} />
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

      <div className="shrink-0 bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/70 dark:border-zinc-800 px-2.5 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        {chips.length > 0 ? (
          <div className="mb-2">
            <ListingAskPrompts
              prompts={chips}
              onPick={applyChip}
              title={chipTitle}
              compact
            />
          </div>
        ) : null}
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
            disabled={!text.trim() || sending}
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
            {msg.fromMe ? "آگهی‌ای که فرستادید:" : "آگهی معرفی‌شده:"}
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
  const getListing = useStore((s) => s.getListing);
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
