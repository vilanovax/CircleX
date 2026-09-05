"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useStore } from "@/lib/store";
import { EMPTY_THREAD } from "@/lib/thread-index";
import {
  circleMemberPerson,
  CIRCLE_MEMBER_NAME,
  threadKey,
} from "@/lib/listing-privacy";
import Avatar from "@/components/Avatar";
import ListingImage from "@/components/ListingImage";
import Header from "@/components/Header";
import LockedMessaging from "@/components/LockedMessaging";
import { CameraIcon, SendIcon, FlagIcon, MoreIcon, CheckIcon, DoubleCheckIcon, UserPlusIcon } from "@/components/Icons";
import { personHref } from "@/lib/nav-back";
import Image from "next/image";
import { withBasePath, withoutBasePath } from "@/lib/avatar";
import { isOptimizablePhotoSrc, PHOTO_SLOT } from "@/lib/media";
import { uploadUserPhoto } from "@/lib/media-image";
import { dealStatusLabels, formatPrice } from "@/lib/labels";
import { messageClock, messageSentAt } from "@/lib/mappers";
import {
  listingSubject,
  DEAL_NOTE,
  isDealStatusNote,
  suggestThreadChips,
  type BuyerPrompt,
} from "@/lib/listing-prompts";
import { canOpenThread } from "@/lib/messaging";
import { isCircloPeer } from "@/lib/circlo";
import { isActiveCircleMember } from "@/lib/circle-member";
import { canView } from "@/lib/trust";
import {
  recalledThreadListing,
  rememberThreadListing,
  resolveThreadListingId,
  shouldAttachListingOnSend,
} from "@/lib/thread-listing";
import { chatPeerSubtitle, viaConnectorName } from "@/lib/trust";
import type { Listing, Message } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { lazyUi } from "@/lib/lazy-ui";
import { toPersianDigits } from "@/lib/persian";
import { useCatalog } from "@/lib/use-catalog";
import {
  ThreadActionsSheet,
  ThreadPromptSheet,
} from "@/app/messages/message-sheets";

const WatchSheet = lazyUi(() => import("@/app/messages/WatchSheet"));
const InviteSheet = lazyUi(() => import("@/components/InviteSheet"));
const ReportMessageSheet = lazyUi(() => import("@/components/ReportMessageSheet"));
const EndorseSheet = lazyUi(() => import("@/components/EndorseSheet"));
const AddToCircleSheet = lazyUi(() => import("@/components/AddToCircleSheet"));

export default function ThreadClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const goInbox = useCallback(() => {
    router.replace("/messages");
  }, [router]);
  const peerId = String(params.id);
  const queryListingId = searchParams.get("listing");
  const scoped = searchParams.get("scoped") === "1";
  const listingThread = Boolean(queryListingId?.trim()) || scoped;
  const inboxKey = threadKey(
    peerId,
    listingThread ? queryListingId : undefined,
  );
  const thread = useStore(
    (s) => s.threadIndex.threadByPeer.get(inboxKey) ?? EMPTY_THREAD,
  );
  const refreshInbox = useStore((s) => s.refreshInbox);
  const storedPeer = useStore((s) => s.getPerson(peerId));
  const getPerson = useStore((s) => s.getPerson);
  const revealListingIdentity = useStore((s) => s.revealListingIdentity);
  const getListing = useStore((s) => s.getListing);
  const ensureListing = useStore((s) => s.ensureListing);
  const addMessage = useStore((s) => s.addMessage);
  const markThreadRead = useStore((s) => s.markThreadRead);
  const setListingDealStatus = useStore((s) => s.setListingDealStatus);
  const archiveThread = useStore((s) => s.archiveThread);
  const unarchiveThread = useStore((s) => s.unarchiveThread);
  const togglePinThread = useStore((s) => s.togglePinThread);
  const deleteThread = useStore((s) => s.deleteThread);
  const archivedThreads = useStore((s) => s.archivedThreads);
  const pinnedThreads = useStore((s) => s.pinnedThreads);
  const joinCount = useStore((s) => s.joinRequests.length);
  const hasOwnListing = useStore((s) =>
    s.listings.some((row) => row.sellerId === "me"),
  );
  const hasVisibleOfferings = useStore((s) => {
    const len = s.threadIndex.threadByPeer.get(inboxKey)?.length ?? 0;
    if (len > 0) return true;
    const gp = s.getPerson;
    for (const listing of s.listings) {
      if (listing.sellerId === peerId && canView(listing, gp)) return true;
    }
    for (const request of s.requests) {
      if (request.requesterId === peerId && canView(request, gp)) return true;
    }
    return false;
  });
  const { show } = useToast();
  const addToCircle = useStore((s) => s.addToCircle);
  const theyAddedMe = useStore((s) =>
    s.addedYou.some((p) => p.id === peerId),
  );
  const watchesOn = useCatalog().flags.watches;
  const [showAddToCircle, setShowAddToCircle] = useState(false);
  const [showCircloWatches, setShowCircloWatches] = useState(false);
  const [showCircloInvite, setShowCircloInvite] = useState(false);
  const [reportMsg, setReportMsg] = useState<Message | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showEndorse, setShowEndorse] = useState(false);
  const [listingLoadState, setListingLoadState] = useState<
    "idle" | "loading" | "ready" | "missing"
  >("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  const [sessionListingId, setSessionListingId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    void refreshInbox().catch(() => {});
  }, [refreshInbox]);

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
  const hidePeer = Boolean(
    scoped &&
      contextListing?.privatePublish &&
      !isSellerOfContext &&
      contextListing.identityHidden,
  );
  const peer = hidePeer
    ? circleMemberPerson(peerId, activeListingId)
    : storedPeer;
  const dealStatus = contextListing?.dealStatus ?? "available";
  const identityShownToPeer = Boolean(
    isSellerOfContext &&
      scoped &&
      contextListing?.privatePublish &&
      contextListing.identityRevealedPeerIds?.includes(peerId),
  );
  const visibleThread = useMemo(() => {
    if (!identityShownToPeer) return thread;
    return thread.filter((msg) => !(msg.kind === "system" && msg.fromMe));
  }, [thread, identityShownToPeer]);

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

  const viaName = useMemo(() => {
    const hopId = contextListing?.trustPath?.[0]?.personId;
    const fromListing = hopId ? getPerson(hopId)?.name : undefined;
    return fromListing || viaConnectorName(peerId, getPerson);
  }, [contextListing?.trustPath, getPerson, peerId]);

  const subtitle = peer ? chatPeerSubtitle(peer, viaName) : "";

  const canChat = peer
    ? contextListing?.privatePublish
      ? canView(contextListing, getPerson) || isSellerOfContext || thread.length > 0
      : canOpenThread(peer, {
          hasThread: thread.length > 0,
          listing: contextListing,
          getPerson,
          hasVisibleOfferings,
        }) ||
        // Closed listing still opens if we already share a circle (messages may land after boot).
        (Boolean(activeListingId) && isActiveCircleMember(peer))
    : false;

  useEffect(() => {
    markThreadRead(peerId, listingThread ? queryListingId : undefined);
  }, [peerId, markThreadRead, listingThread, queryListingId]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length]);

  if (!peer) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-sm text-ink-faint">کاربر پیدا نشد.</p>
      </main>
    );
  }

  if (isCircloPeer(peerId)) {
    const joins = joinCount;
    return (
      <main className="flex flex-col h-[100dvh]">
        <Header back fallbackHref="/messages" onBack={goInbox}>
          <div className="flex min-h-9 min-w-0 items-center gap-2.5">
            <Avatar name={peer.name} src={peer.avatar} size="sm" showLevel={false} />
            <div className="flex min-w-0 flex-col justify-center">
              <p className="m-0 truncate text-[14px] font-extrabold leading-none text-ink dark:text-zinc-100">
                {peer.name}
              </p>
              <p className="m-0 mt-1 truncate text-[11px] leading-none text-ink-muted dark:text-zinc-400">
                از سیرکل · فقط اطلاع
              </p>
            </div>
          </div>
        </Header>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {thread.length === 0 ? (
            <p className="text-center text-[13px] text-ink-muted leading-relaxed px-6 pt-16">
              درخواست ورود، پذیرش دعوت، و آگهی‌هایی که گوش‌به‌زنگ‌شان هستی اینجا
              می‌آید. میان‌برها پایین صفحه است.
            </p>
          ) : (
            <div className="space-y-3">
              {thread.map((msg) => (
                <div key={msg.id} className="flex justify-start">
                  <div
                    dir="rtl"
                    className="max-w-[88%] rounded-2xl bg-[color:var(--circle-surface)] text-ink shadow-card dark:bg-zinc-900 dark:text-zinc-100 dark:border dark:border-zinc-800 px-3.5 py-2.5 text-[13px] leading-relaxed"
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.actionHref && msg.actionLabel ? (
                      <Link
                        href={msg.actionHref}
                        className="mt-2.5 inline-flex items-center justify-center rounded-xl bg-brand-600 text-white text-[12px] font-bold px-3 py-2 active:scale-[0.98]"
                      >
                        {msg.actionLabel}
                      </Link>
                    ) : null}
                    <span dir="rtl" className="block text-[11px] mt-1.5 text-ink-faint">
                      {msg.postedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="shrink-0 border-t border-stone-200/70 dark:border-zinc-800 bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl px-3 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <p className="text-[11px] font-semibold text-ink-faint px-0.5 mb-1.5">
            میان‌بر
          </p>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {watchesOn ? (
              <CircloChip
                label="گوش‌به‌زنگ"
                onClick={() => setShowCircloWatches(true)}
              />
            ) : null}
            <CircloChip
              label={hasOwnListing ? "آگهی جدید" : "اولین آگهی"}
              onClick={() => router.push("/new")}
            />
            <CircloChip
              label={
                joins > 0
                  ? `حلقه · ${toPersianDigits(joins)}`
                  : "حلقه‌ی من"
              }
              onClick={() => router.push("/circle")}
            />
            <CircloChip
              label="دعوت"
              onClick={() => setShowCircloInvite(true)}
            />
          </div>
          <p className="text-[11px] text-ink-faint text-center mt-2 leading-relaxed">
            سیرکلو گفتگو نیست — نمی‌توانی جواب بدهی.
          </p>
        </div>
          {showCircloWatches && watchesOn ? (
          <WatchSheet onClose={() => setShowCircloWatches(false)} />
        ) : null}
        {showCircloInvite ? (
          <InviteSheet onClose={() => setShowCircloInvite(false)} />
        ) : null}
      </main>
    );
  }

  if (!thread.length && activeListingId && listingLoadState === "loading") {
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
          onBack={goInbox}
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

  function notifySendError(err: unknown) {
    show(err instanceof ApiError ? err.message : "ارسال نشد. دوباره بزن.");
  }

  const listingGone = Boolean(activeListingId) && listingLoadState === "missing";
  const listingClosed =
    listingGone || contextListing?.dealStatus === "inactive";

  const emptyHint = listingClosed
    ? listingGone
      ? "آگهی دیگر در دسترس نیست."
      : "معامله تمام شد. از خانه یا پیام‌ها ادامه بده."
    : contextListing
      ? `دربارهٔ ${listingSubject(contextListing)} — اولین پیام را بفرست.`
      : "اولین پیام را بفرست.";

  return (
    <main className="flex flex-col h-[100dvh]">
      <Header
        back
        fallbackHref="/messages"
        onBack={goInbox}
        action={
          <button
            type="button"
            aria-label="گزینه‌های گفتگو"
            onClick={() => setShowActions(true)}
            className="inline-grid size-9 shrink-0 place-items-center text-ink-muted active:text-ink dark:text-zinc-400 dark:active:text-zinc-100"
          >
            <MoreIcon className="h-5 w-5" />
          </button>
        }
      >
        {hidePeer ? (
          <div className="flex min-h-9 min-w-0 items-center gap-2.5">
            <Avatar name={peer.name} src={peer.avatar} size="sm" showLevel={false} />
            <div className="flex min-w-0 flex-col justify-center">
              <p className="m-0 truncate text-[14px] font-extrabold leading-none text-ink dark:text-zinc-100">
                {CIRCLE_MEMBER_NAME}
              </p>
              <p className="m-0 mt-1 truncate text-[11px] leading-none text-ink-muted dark:text-zinc-400">
                هویت برای اعضا پنهان است
              </p>
            </div>
          </div>
        ) : (
          <Link
            href={personHref(peerId, "messages")}
            className="flex min-h-9 min-w-0 items-center gap-2.5 active:opacity-70"
          >
            <Avatar name={peer.name} src={peer.avatar} size="sm" showLevel={false} />
            <div className="flex min-w-0 flex-col justify-center">
              <p className="m-0 truncate text-[14px] font-extrabold leading-none text-ink dark:text-zinc-100">
                {peer.name}
              </p>
              <p className="m-0 mt-1 truncate text-[11px] leading-none text-ink-muted dark:text-zinc-400">
                {isSellerOfContext && scoped && contextListing?.privatePublish
                  ? identityShownToPeer
                    ? `هویت تو برای ${peer.name} پیداست`
                    : `هویت تو برای ${peer.name} پنهان است`
                  : `گفتگو · ${subtitle}`}
              </p>
            </div>
          </Link>
        )}
      </Header>

      {(contextListing || listingGone) && (
        <div className="shrink-0 border-b border-stone-200/60 bg-[color:var(--circle-surface)] px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
          {listingGone || !contextListing ? (
            <p className="text-[12px] text-ink-muted py-1">
              آگهی مورد نظر حذف شده است
            </p>
          ) : (
            <>
              <Link
                href={`/listing/${contextListing.id}`}
                className="flex items-center gap-2 rounded-xl bg-stone-50/90 px-1.5 py-1 ring-1 ring-stone-200/70 active:opacity-80 dark:bg-zinc-800/60 dark:ring-zinc-700"
              >
                <ListingImage
                  image={contextListing.image}
                  alt={contextListing.title}
                  size="sm"
                  category={contextListing.category}
                  type={contextListing.type}
                  frameClassName="h-9 w-9 shrink-0 overflow-hidden rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="block truncate text-[12.5px] font-bold leading-snug text-ink dark:text-zinc-100">
                    {contextListing.title}
                  </p>
                  <p className="mt-px block nums text-[11px] leading-snug text-ink-muted">
                    {contextListing.price != null
                      ? formatPrice(contextListing.price)
                      : contextListing.type === "service"
                        ? "توافقی"
                        : "رایگان"}
                    {dealStatus &&
                    dealStatus !== "available" &&
                    dealStatus !== "inactive"
                      ? ` · ${dealStatusLabels[dealStatus]}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 pe-1 text-sm text-ink-faint" aria-hidden>
                  ‹
                </span>
              </Link>
            </>
          )}
          {!hidePeer &&
          !isCircloPeer(peerId) &&
          !isActiveCircleMember(peer) &&
          (viaName || thread.length > 0) ? (
            <div className="mt-1.5 rounded-xl bg-stone-50/90 px-2.5 py-2 ring-1 ring-stone-200/70 dark:bg-zinc-800/60 dark:ring-zinc-700">
              <p className="text-[12px] text-ink-muted leading-snug">
                {theyAddedMe
                  ? `${peer.name} تو را به حلقه‌اش اضافه کرد.`
                  : viaName
                    ? `${peer.name} را از طریق ${viaName} می‌شناسی.`
                    : `${peer.name} از مسیر حلقه‌ات به تو رسیده.`}{" "}
                اگر خودت می‌شناسی‌اش، به حلقه‌ات اضافه کن.
              </p>
              <button
                type="button"
                onClick={() => setShowAddToCircle(true)}
                className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-700 dark:text-brand-400"
              >
                <UserPlusIcon className="h-3.5 w-3.5" />
                به حلقه‌ات اضافه کن
              </button>
            </div>
          ) : null}
          {hidePeer ? (
            <p className="mt-1.5 text-[11.5px] text-ink-muted leading-snug">
              هویت آگهی‌دهنده پنهان است — اگر پیام بفرستی، او تو را با نام واقعی
              می‌بیند.
            </p>
          ) : null}
          {isSellerOfContext &&
          scoped &&
          contextListing?.privatePublish &&
          !identityShownToPeer ? (
            <button
              type="button"
              onClick={() => {
                if (
                  !window.confirm(
                    `بعد از نمایش هویت، ${peer.name} نام و تصویر تو را خواهد دید و امکان پنهان‌کردن اطلاعاتی که دیده است وجود ندارد.`,
                  )
                ) {
                  return;
                }
                void revealListingIdentity(contextListing.id, peerId)
                  .then(() => show("هویت در این گفتگو نمایش داده شد"))
                  .catch((err) =>
                    show(err instanceof ApiError ? err.message : "انجام نشد"),
                  );
              }}
              className="mt-1.5 text-[12px] font-bold text-brand-600 dark:text-brand-400"
            >
              نمایش هویت من به این فرد
            </button>
          ) : null}
          {contextListing && isSellerOfContext && dealStatus !== "inactive" ? (
            <div
              className="mt-1.5 flex gap-1"
              role="group"
              aria-label={`وضعیت برای ${peer.name}`}
            >
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
                      if (dealStatus === id) return;
                      setListingDealStatus(contextListing.id, id);
                      if (id === "reserved") {
                        void addMessage(
                          peerId,
                          DEAL_NOTE.reserved,
                          contextListing.id,
                          true,
                        ).catch(notifySendError);
                      } else if (id === "agreed") {
                        void addMessage(
                          peerId,
                          DEAL_NOTE.agreed,
                          contextListing.id,
                          true,
                        ).catch(notifySendError);
                      } else {
                        void addMessage(
                          peerId,
                          DEAL_NOTE.available,
                          contextListing.id,
                          true,
                        ).catch(notifySendError);
                      }
                    }}
                    className={`chip !px-2 !py-0.5 !text-[11px] border ${
                      active
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-transparent text-ink-muted border-stone-200/90 dark:border-zinc-600"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : null}
          {contextListing &&
          isSellerOfContext &&
          dealStatus === "agreed" ? (
            <button
              type="button"
              onClick={() => {
                void setListingDealStatus(contextListing.id, "inactive");
                void addMessage(
                  peerId,
                  DEAL_NOTE.done,
                  contextListing.id,
                  true,
                ).catch(notifySendError);
                show("آگهی از فید حلقه برداشته شد");
              }}
              className="mt-1.5 text-[12px] font-bold text-brand-700 dark:text-brand-300"
            >
              آگهی را از فید بردار
            </button>
          ) : null}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-2 flex flex-col"
        style={{
          backgroundColor: "var(--circle-canvas)",
        }}
      >
        {visibleThread.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-12 px-6">
            <Avatar name={peer.name} src={peer.avatar} size="lg" showLevel={false} />
            <p className="font-bold text-ink dark:text-zinc-100 mt-3">
              گفتگو با {peer.name}
            </p>
            <p className="text-[13px] text-ink-muted mt-1 leading-relaxed max-w-xs">
              {emptyHint}
            </p>
          </div>
        ) : (
          <div className="mt-auto">
            {visibleThread.map((msg, i) => {
              const prev = visibleThread[i - 1];
              const next = visibleThread[i + 1];
              const showDay =
                !prev || threadDayKey(prev) !== threadDayKey(msg);
              const samePrev = Boolean(
                prev &&
                  prev.fromMe === msg.fromMe &&
                  prev.kind !== "system" &&
                  msg.kind !== "system" &&
                  !showDay,
              );
              const sameNext = Boolean(
                next &&
                  next.fromMe === msg.fromMe &&
                  next.kind !== "system" &&
                  msg.kind !== "system" &&
                  threadDayKey(next) === threadDayKey(msg),
              );
              const showAvatar = !msg.fromMe && !sameNext;
              const showTime = !sameNext;

              return (
                <div key={msg.id}>
                  {showDay ? <DayDivider label={threadDayLabel(msg)} /> : null}
                  {msg.kind === "system" ? (
                    <p className="text-center text-[11px] text-ink-faint px-8 py-1 leading-snug">
                      {msg.fromMe
                        ? `هویت تو برای ${storedPeer?.name ?? peer.name} نمایش داده شد`
                        : "آگهی‌دهنده هویت خود را نمایش داد"}
                    </p>
                  ) : (
                  <div
                    dir="ltr"
                    className={`flex items-end gap-1.5 ${
                      msg.fromMe ? "justify-end" : "justify-start"
                    } ${samePrev ? "mt-0.5" : "mt-1.5"}`}
                  >
                    {!msg.fromMe && (
                      <div className="w-7 shrink-0">
                        {showAvatar ? (
                          <Avatar name={peer.name} src={peer.avatar} size="sm" showLevel={false} />
                        ) : null}
                      </div>
                    )}
                    <Bubble
                      msg={msg}
                      contextListingId={activeListingId}
                      clusteredTop={samePrev}
                      clusteredBottom={sameNext}
                      showTime={showTime}
                    />
                    {!msg.fromMe && showAvatar ? (
                      <button
                        type="button"
                        aria-label="گزارش پیام"
                        onClick={() => setReportMsg(msg)}
                        className="mb-0.5 shrink-0 rounded-full p-1 text-ink-faint hover:bg-black/[0.05] hover:text-ink dark:hover:bg-white/[0.06]"
                      >
                        <FlagIcon className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      !msg.fromMe ? <span className="w-6 shrink-0" /> : null
                    )}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {listingClosed ? (
        <div className="shrink-0 border-t border-stone-200/70 dark:border-zinc-800 bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-center text-[13px] text-ink-muted leading-relaxed">
            {listingGone
              ? "آگهی حذف شده و گفتگو بسته است."
              : "معامله تمام شد — ارسال پیام بسته است."}
          </p>
          {!listingGone &&
          contextListing &&
          !isSellerOfContext &&
          !contextListing.identityHidden ? (
            <button
              type="button"
              onClick={() => setShowEndorse(true)}
              className="btn-primary mt-2.5 w-full min-h-11 text-[13px] font-bold"
            >
              اگر دیدی، حرف بگذار
            </button>
          ) : null}
          <Link
            href="/"
            replace
            className={
              !listingGone &&
              contextListing &&
              !isSellerOfContext &&
              !contextListing.identityHidden
                ? "btn-ghost mt-2 flex w-full min-h-11 items-center justify-center text-[13px] font-bold"
                : "btn-primary mt-2.5 flex w-full min-h-11 items-center justify-center text-[13px] font-bold"
            }
          >
            بازگشت به خانه
          </Link>
        </div>
      ) : (
        <ThreadComposer
          peerId={peerId}
          listingThread={listingThread}
          activeListingId={activeListingId}
          inboxKey={inboxKey}
          contextListing={contextListing}
          isSellerOfContext={isSellerOfContext}
          searchParams={searchParams}
        />
      )}
      {showActions ? (
        <ThreadActionsSheet
          name={hidePeer ? CIRCLE_MEMBER_NAME : peer.name}
          avatar={peer.avatar}
          pinned={pinnedThreads.includes(inboxKey) || pinnedThreads.includes(peerId)}
          archived={archivedThreads.includes(inboxKey) || archivedThreads.includes(peerId)}
          listingHref={contextListing ? `/listing/${contextListing.id}` : undefined}
          onClose={() => setShowActions(false)}
          onPin={() => {
            setShowActions(false);
            void togglePinThread(inboxKey).then((ok) => {
              if (!ok) show("حداکثر سه گفتگو سنجاق می‌شود");
            });
          }}
          onArchive={() => {
            const archived =
              archivedThreads.includes(inboxKey) ||
              archivedThreads.includes(peerId);
            setShowActions(false);
            if (archived) {
              void unarchiveThread(inboxKey);
              show("به پیام‌ها برگشت");
            } else {
              void archiveThread(inboxKey);
              show("آرشیو شد");
              router.push("/messages");
            }
          }}
          onDelete={() => {
            setShowActions(false);
            void deleteThread(inboxKey);
            router.push("/messages");
          }}
        />
      ) : null}
      {reportMsg ? (
        <ReportMessageSheet
          messageId={reportMsg.id}
          preview={reportMsg.text.trim() || (reportMsg.imageUrl ? "عکس" : "")}
          onClose={() => setReportMsg(null)}
        />
      ) : null}
      {showEndorse && contextListing ? (
        <EndorseSheet
          listingId={contextListing.id}
          listingTitle={contextListing.title}
          sellerName={peer.name}
          myEndorsements={contextListing.endorsements.filter(
            (e) => e.personId === "me",
          )}
          onClose={() => setShowEndorse(false)}
        />
      ) : null}
      {showAddToCircle ? (
        <AddToCircleSheet
          person={{
            ...peer,
            relation: "friend",
            level: "B",
            note: viaName ? `از طریق ${viaName}` : peer.note,
          }}
          onClose={() => setShowAddToCircle(false)}
          onAdd={(input) => {
            void addToCircle(peerId, input)
              .then(() => {
                setShowAddToCircle(false);
                show(`${peer.name} به حلقه‌ات اضافه شد ✓`);
              })
              .catch((err) =>
                show(
                  err instanceof ApiError ? err.message : "اضافه نشد. دوباره بزن.",
                ),
              );
          }}
        />
      ) : null}
    </main>
  );
}

const ThreadComposer = memo(function ThreadComposer({
  peerId,
  listingThread,
  activeListingId,
  inboxKey,
  contextListing,
  isSellerOfContext,
  searchParams,
}: {
  peerId: string;
  listingThread: boolean;
  activeListingId?: string;
  inboxKey: string;
  contextListing?: Listing;
  isSellerOfContext: boolean;
  searchParams: ReturnType<typeof useSearchParams>;
}) {
  const addMessage = useStore((s) => s.addMessage);
  const thread = useStore(
    (s) => s.threadIndex.threadByPeer.get(inboxKey) ?? EMPTY_THREAD,
  );
  const { show } = useToast();
  const [text, setText] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const draftApplied = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [showMorePrompts, setShowMorePrompts] = useState(false);
  const lastFromMe = thread[thread.length - 1]?.fromMe === true;
  const sellerHasReplied = thread.some((m) => m.fromMe);
  const chips = useMemo(
    () =>
      suggestThreadChips({
        listing: contextListing,
        isSeller: isSellerOfContext,
        threadLength: thread.length,
        lastFromMe,
        sellerHasReplied,
      }),
    [
      contextListing,
      isSellerOfContext,
      thread.length,
      lastFromMe,
      sellerHasReplied,
    ],
  );

  useEffect(() => {
    return () => {
      if (pendingPhoto) URL.revokeObjectURL(pendingPhoto);
    };
  }, [pendingPhoto]);

  useEffect(() => {
    if (draftApplied.current) return;
    const draft = searchParams.get("draft");
    if (!draft) return;
    draftApplied.current = true;
    setText(draft);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [searchParams]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [text]);

  const clearPendingPhoto = useCallback(() => {
    setPendingPhoto((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
    pendingFileRef.current = null;
    if (photoInputRef.current) photoInputRef.current.value = "";
  }, []);

  function onPickPhoto(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setPendingPhoto((url) => {
      if (url) URL.revokeObjectURL(url);
      return URL.createObjectURL(file);
    });
    pendingFileRef.current = file;
  }

  async function sendBody(body: string, imageUrl?: string) {
    const t = body.trim();
    if ((!t && !imageUrl) || sending) return;
    const attachListing = shouldAttachListingOnSend(thread, activeListingId)
      ? activeListingId
      : undefined;
    const sendListingId = listingThread
      ? activeListingId ?? attachListing
      : attachListing;
    if (activeListingId) rememberThreadListing(peerId, activeListingId);
    setSending(true);
    try {
      await addMessage(
        peerId,
        t,
        sendListingId,
        Boolean(listingThread && sendListingId),
        imageUrl,
      );
      setText("");
      clearPendingPhoto();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ارسال نشد. دوباره بزن.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function send() {
    const t = text.trim();
    const file = pendingFileRef.current;
    if ((!t && !file) || sending) return;
    if (!file) {
      await sendBody(t);
      return;
    }
    try {
      const imageUrl = await uploadUserPhoto(file);
      await sendBody(t, imageUrl);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ارسال نشد. دوباره بزن.");
    }
  }

  function applyChip(prompt: BuyerPrompt) {
    const last = thread[thread.length - 1];
    const instant =
      thread.length === 0 ||
      Boolean(last && !last.fromMe) ||
      Boolean(last?.fromMe && isDealStatusNote(last.text));
    if (instant) {
      void sendBody(prompt.draft);
      return;
    }
    setText(prompt.draft);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const len = prompt.draft.length;
      el.setSelectionRange(len, len);
    });
  }

  const quickChips = chips.slice(0, 2);
  const moreChips = chips.slice(2);

  return (
    <div className="shrink-0 bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/70 dark:border-zinc-800 px-2.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {quickChips.length > 0 ? (
        <div className="mb-1.5 flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {quickChips.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={sending}
              onClick={() => applyChip(p)}
              className="shrink-0 rounded-full border border-stone-200/90 bg-stone-50/90 px-3 py-1.5 text-[12px] font-semibold text-ink transition-transform active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
          {moreChips.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowMorePrompts(true)}
              className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-700 transition-transform active:scale-[0.97] dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-200"
            >
              بیشتر
            </button>
          ) : null}
        </div>
      ) : null}
      {pendingPhoto ? (
        <div className="mb-2 flex items-center gap-2">
          <img
            src={pendingPhoto}
            alt=""
            className="h-16 w-16 rounded-xl object-cover ring-1 ring-stone-200/80 dark:ring-zinc-700"
          />
          <button
            type="button"
            onClick={clearPendingPhoto}
            className="text-[12px] font-bold text-ink-muted dark:text-zinc-400"
          >
            حذف عکس
          </button>
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickPhoto(e.target.files)}
        />
        <button
          type="button"
          disabled={sending}
          onClick={() => photoInputRef.current?.click()}
          aria-label="افزودن عکس"
          className="shrink-0 w-11 h-11 rounded-full border border-stone-200 dark:border-zinc-700 bg-stone-50/80 dark:bg-zinc-800/80 text-ink-muted dark:text-zinc-300 flex items-center justify-center active:scale-95 disabled:opacity-35"
        >
          <CameraIcon className="w-5 h-5" />
        </button>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          placeholder="پیام بنویس…"
          className="flex-1 resize-none max-h-28 min-h-[44px] rounded-2xl border border-stone-200 dark:border-zinc-700 bg-stone-50/80 dark:bg-zinc-800/80 px-3.5 py-2.5 text-[13px] text-ink dark:text-zinc-100 placeholder:text-ink-faint outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 leading-relaxed"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={(!text.trim() && !pendingPhoto) || sending}
          aria-label="ارسال"
          className="shrink-0 w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center active:scale-95 disabled:opacity-35 shadow-md shadow-brand-600/25 transition-transform duration-150"
        >
          <SendIcon className="w-5 h-5 -ms-0.5" />
        </button>
      </div>
      {showMorePrompts ? (
        <ThreadPromptSheet
          prompts={moreChips}
          onPick={applyChip}
          onClose={() => setShowMorePrompts(false)}
        />
      ) : null}
    </div>
  );
});

const CircloChip = memo(function CircloChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold border-stone-200/90 dark:border-zinc-700 bg-stone-50/90 dark:bg-zinc-800/80 text-ink dark:text-zinc-100 transition-transform active:scale-[0.97]"
    >
      {label}
    </button>
  );
});

function threadDayKey(msg: Message, now = Date.now()): string {
  const t = messageSentAt(msg);
  if (t > 0) {
    const d = new Date(t);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  const label = msg.postedAt.replace(/\u200F/g, "").trim();
  if (
    !label ||
    label === "همین حالا" ||
    label.includes("دقیقه") ||
    label.includes("ساعت")
  ) {
    const d = new Date(now);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  if (label === "دیروز") {
    const d = new Date(now - 86_400_000);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  return label;
}

function threadDayLabel(msg: Message, now = Date.now()): string {
  const t = messageSentAt(msg);
  if (t > 0) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const day = new Date(t);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
    if (diff <= 0) return "امروز";
    if (diff === 1) return "دیروز";
    if (diff < 7) return `${toPersianDigits(diff)} روز پیش`;
  }
  const label = msg.postedAt.replace(/\u200F/g, "").trim();
  if (
    !label ||
    label === "همین حالا" ||
    label.includes("دقیقه") ||
    label.includes("ساعت")
  ) {
    return "امروز";
  }
  return label;
}

const DayDivider = memo(function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-1.5">
      <span
        className="text-[11px] font-semibold text-ink-faint dark:text-zinc-500 px-1.5 py-0.5"
        dir="rtl"
      >
        {label}
      </span>
    </div>
  );
});

const Bubble = memo(function Bubble({
  msg,
  contextListingId,
  clusteredTop,
  clusteredBottom,
  showTime,
}: {
  msg: Message;
  contextListingId?: string;
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

  const referralId =
    msg.listingId &&
    msg.listingId !== contextListingId &&
    msg.listingId !== msg.threadListingId
      ? msg.listingId
      : undefined;

  return (
    <div
      dir="rtl"
      className={`max-w-[78%] px-3 py-1.5 text-[13px] leading-snug text-right ${radius} ${
        msg.fromMe
          ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
          : "bg-[color:var(--circle-surface)] text-ink shadow-card dark:bg-zinc-900 dark:text-zinc-100 dark:border dark:border-zinc-800"
      }`}
    >
      {referralId ? (
        <>
          <p className="text-[11px] font-medium mb-1.5 opacity-80">
            {msg.fromMe ? "آگهی‌ای که فرستادید:" : "آگهی معرفی‌شده:"}
          </p>
          <ReferralCard listingId={referralId} fromMe={msg.fromMe} />
          {msg.imageUrl ? <ChatPhoto src={msg.imageUrl} /> : null}
          {msg.text.trim() && (
            <p className="whitespace-pre-line mt-2 opacity-95">{msg.text}</p>
          )}
        </>
      ) : (
        <>
          {msg.imageUrl ? <ChatPhoto src={msg.imageUrl} /> : null}
          {msg.text.trim() ? (
            <p className={`whitespace-pre-line ${msg.imageUrl ? "mt-2" : ""}`}>
              {msg.text}
            </p>
          ) : null}
        </>
      )}
      {showTime ? (
        <span
          dir="rtl"
          className={`mt-0.5 flex items-center justify-start gap-1 text-[11px] nums leading-none ${
            msg.fromMe ? "text-white/70" : "text-ink-faint"
          }`}
        >
          {msg.fromMe ? (
            msg.seenByPeer ? (
              <DoubleCheckIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
            ) : (
              <CheckIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
            )
          ) : null}
          <span>{messageClock(msg)}</span>
        </span>
      ) : null}
    </div>
  );
});

const ChatPhoto = memo(function ChatPhoto({ src }: { src: string }) {
  const path = withoutBasePath(src);
  const optimize = isOptimizablePhotoSrc(path);
  const imageSrc = withBasePath(path);
  return (
    <a
      href={imageSrc}
      target="_blank"
      rel="noreferrer"
      className="relative block -mx-1 h-64 w-full overflow-hidden rounded-xl"
    >
      {optimize ? (
        <Image
          src={imageSrc}
          alt="عکس پیام"
          fill
          sizes={`(max-width: 480px) 100vw, ${PHOTO_SLOT.chat}px`}
          className="object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt="عکس پیام"
          className="h-full w-full object-cover"
        />
      )}
    </a>
  );
});

function ReferralCard({
  listingId,
  fromMe,
}: {
  listingId: string;
  fromMe?: boolean;
}) {
  const getListing = useStore((s) => s.getListing);
  const ensureListing = useStore((s) => s.ensureListing);
  const listing = getListing(listingId);

  useEffect(() => {
    if (listing && !listing.feedPreview) return;
    void ensureListing(listingId);
  }, [ensureListing, listing, listingId]);

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
