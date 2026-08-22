"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import TrustPath from "@/components/TrustPath";
import SheetShell from "@/components/SheetShell";
import { ChatIcon, ShieldCheckIcon, TrashIcon } from "@/components/Icons";
import {
  formatPrice,
  formatRequestBudget,
  requestPrivacyAudienceLine,
} from "@/lib/labels";
import { canDirectMessage } from "@/lib/messaging";
import {
  formatTomanInput,
  parseTomanInput,
  tomanInWords,
  toPersianDigits,
} from "@/lib/persian";
import LockedAccess from "@/components/LockedAccess";
import { canView, listingSellerSubtitle, viewerRelationPhrase } from "@/lib/trust";
import { placeDetailLabel } from "@/lib/place";
import { useToast } from "@/components/Toast";
import type { Person, Request as CircleRequest } from "@/lib/types";

export default function RequestClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const request = useStore((s) => s.requests.find((r) => r.id === id));
  const ensureRequest = useStore((s) => s.ensureRequest);
  const hydrated = useStore((s) => s.hydrated);
  const getPerson = useStore((s) => s.getPerson);
  const getThread = useStore((s) => s.getThread);
  const offersAll = useStore((s) => s.offers);
  const addOffer = useStore((s) => s.addOffer);
  const withdrawOffer = useStore((s) => s.withdrawOffer);
  const meAvatar = useStore((s) => s.me.avatar);
  const { show } = useToast();
  const [showOffer, setShowOffer] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [pathExpanded, setPathExpanded] = useState(false);
  const [lookup, setLookup] = useState<"idle" | "loading" | "miss">("idle");

  useEffect(() => {
    if (!hydrated) return;
    if (request) {
      setLookup("idle");
      return;
    }
    let cancelled = false;
    setLookup("loading");
    void ensureRequest(id).then((row) => {
      if (cancelled) return;
      setLookup(row ? "idle" : "miss");
    });
    return () => {
      cancelled = true;
    };
  }, [ensureRequest, hydrated, id, request]);

  const offers = useMemo(
    () => offersAll.filter((o) => o.requestId === id),
    [offersAll, id],
  );
  const offered = useMemo(
    () => offers.some((o) => o.fromId === "me"),
    [offers],
  );

  if (!hydrated || !request) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="درخواست" back />
        <p className="text-center text-ink-faint py-20 text-sm">
          {hydrated && lookup === "miss" ? "درخواست پیدا نشد." : "در حال بارگذاری…"}
        </p>
      </main>
    );
  }

  const requester = getPerson(request.requesterId);
  const isMine = request.requesterId === "me";
  const isDirect =
    !!requester &&
    request.requesterId !== "me" &&
    request.trustPath.length === 0;
  const showPath = !isMine && !isDirect && request.trustPath.length > 0;
  const relationLine =
    requester && !isMine
      ? listingSellerSubtitle(requester, request.trustPath, getPerson)
      : "";
  const canMsgRequester =
    !isMine &&
    requester &&
    canDirectMessage(requester, getThread(requester.id).length > 0);

  if (!isMine && !canView(request, getPerson)) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="جزئیات درخواست" back />
        <LockedAccess
          itemTitle={request.title}
          itemKind="request"
          privacy={request.privacy}
        />
      </main>
    );
  }

  const footerPad = isMine ? "pb-8" : "pb-28";

  return (
    <main className={`${footerPad} min-h-[100dvh]`}>
      <Header title="جزئیات درخواست" back />

      <div className="px-4 pt-3 listing-detail-rise">
        <div className="rounded-[1.25rem] border border-amber-200/70 dark:border-amber-500/20 bg-gradient-to-bl from-amber-50 via-[color:var(--circle-surface)] to-[color:var(--circle-surface)] dark:from-amber-500/12 dark:via-zinc-900 dark:to-zinc-900 overflow-hidden shadow-[0_1px_0_rgba(26,24,22,0.04)]">
          <div className="px-4 pt-3.5 pb-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-extrabold bg-amber-600 text-white tracking-wide shadow-sm shadow-amber-600/20">
                درخواست
              </span>
              <span className="chip !px-2 !py-0.5 !text-[11px] bg-[color:var(--circle-surface)]/80 text-ink-muted ring-1 ring-stone-200/70 dark:ring-zinc-700 dark:bg-zinc-800/80">
                {request.category}
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-[3.75rem] h-[3.75rem] rounded-2xl bg-amber-100 dark:bg-amber-500/20 ring-1 ring-amber-200/80 dark:ring-amber-500/30 flex items-center justify-center text-[1.75rem] shrink-0">
                {request.image}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h1 className="text-[1.3rem] font-extrabold text-ink dark:text-zinc-50 leading-[1.35] tracking-tight">
                  {request.title}
                </h1>
                {request.budget != null || request.budgetUnit === "negotiable" ? (
                  <p
                    className={`mt-2 tracking-tight ${
                      request.budget != null
                        ? "text-[1.15rem] font-extrabold text-ink dark:text-zinc-50 nums"
                        : "text-[13px] font-bold text-levelA"
                    }`}
                  >
                    {formatRequestBudget(request.budget, request.budgetUnit)}
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] font-bold text-levelA">
                    توافقی
                  </p>
                )}
              </div>
            </div>

            {request.description.trim() ? (
              <p className="text-[13.5px] text-ink-muted dark:text-zinc-300 leading-[1.75] mt-3.5 whitespace-pre-line">
                {request.description}
              </p>
            ) : null}

            <p className="mt-3 text-[11px] text-ink-faint dark:text-zinc-500 nums leading-relaxed">
              {[placeDetailLabel(request.city, request.area), request.postedAt]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="px-4 py-2.5 bg-amber-100/40 dark:bg-amber-500/10 border-t border-amber-200/40 dark:border-amber-500/15 flex items-start gap-2">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-800/70 dark:text-amber-200/70 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-950/70 dark:text-amber-100/70 leading-relaxed">
              {requestPrivacyAudienceLine(
                request.privacy,
                isMine ? "تو" : requester?.name,
              )}
            </p>
          </div>
        </div>
      </div>

      {isMine ? (
        <p className="px-4 pt-3.5 text-[12px] font-semibold text-amber-900/80 dark:text-amber-200/90">
          درخواست تو — پیشنهادهای حلقه را اینجا می‌بینی.
        </p>
      ) : null}

      {isMine ? (
        <OffersSection
          offers={offers}
          getPerson={getPerson}
          getThread={getThread}
          meAvatar={meAvatar}
          isOwner
          onMessage={(peerId) => router.push(`/messages/${peerId}`)}
        />
      ) : null}

      {requester && !isMine && (
        <section className="px-4 pt-4 animate-fade-up">
          <p className="text-[11px] font-semibold text-ink-faint mb-2 px-0.5">
            درخواست‌دهنده
          </p>
          <div className="card overflow-hidden">
            <Link
              href={`/person/${request.requesterId}`}
              className="px-3.5 py-3 flex items-center gap-3 active:bg-stone-50/80 dark:active:bg-zinc-800/50 transition-colors"
            >
              <Avatar
                name={requester.name}
                src={requester.avatar}
                showLevel={false}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] text-ink dark:text-zinc-100 leading-tight">
                  {requester.name}
                </p>
                <p className="text-[12px] text-ink-muted mt-0.5 truncate">
                  {relationLine}
                </p>
                <p className="text-[11px] text-ink-faint mt-1 nums">
                  {toPersianDigits(requester.deals)} معامله
                  {requester.city ? ` · ${requester.city}` : ""}
                </p>
              </div>
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 shrink-0">
                پروفایل ‹
              </span>
            </Link>
            {canMsgRequester ? (
              <div className="px-3.5 pb-3 -mt-0.5">
                <button
                  type="button"
                  onClick={() => router.push(`/messages/${requester.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-100/90 dark:bg-zinc-800 py-2.5 text-[12px] font-bold text-ink dark:text-zinc-200 active:opacity-80"
                >
                  <ChatIcon className="w-4 h-4" />
                  پیام به {requester.name}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {showPath && (
        <section className="px-4 pt-3 animate-fade-up">
          <div className="card p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-8 h-8 rounded-xl bg-[color:var(--circle-trust)]/12 text-[color:var(--circle-trust)] flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-[18px] h-[18px]" />
              </span>
              <div className="min-w-0">
                <h2 className="font-bold text-[14px] text-ink dark:text-zinc-100 leading-tight">
                  مسیر ارتباط
                </h2>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  از طریق آشنایان به تو می‌رسد
                </p>
              </div>
            </div>
            <TrustPath
              posterId={request.requesterId}
              trustPath={request.trustPath}
              variant="full"
            />
            <button
              type="button"
              onClick={() => setPathExpanded((v) => !v)}
              className="mt-3 text-[12px] font-bold text-brand-600 dark:text-brand-400"
              aria-expanded={pathExpanded}
            >
              {pathExpanded ? "بستن جزئیات" : "جزئیات بیشتر مسیر ‹"}
            </button>
            {pathExpanded && (
              <p className="mt-2 text-[12px] text-ink-muted leading-relaxed">
                زیر هر نفر نسبت با نفر بعدی مسیر است — تا بدانی چرا این درخواست
                به تو رسیده.
              </p>
            )}
          </div>
        </section>
      )}

      {!isMine ? (
        <OffersSection
          offers={offers}
          getPerson={getPerson}
          getThread={getThread}
          meAvatar={meAvatar}
          isOwner={false}
          onMessage={(peerId) => router.push(`/messages/${peerId}`)}
          onWithdraw={() => setShowWithdrawConfirm(true)}
        />
      ) : null}

      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/70 dark:border-zinc-800 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {offered ? (
                <button
                  type="button"
                  onClick={() => setShowOffer(true)}
                  className="w-full rounded-xl bg-stone-100 dark:bg-zinc-800 py-3.5 text-[14px] font-bold text-ink dark:text-zinc-100 active:scale-[0.99] transition-transform"
                >
                  ویرایش پیشنهاد
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowOffer(true)}
                  className="btn-primary w-full !py-3.5 text-[15px] shadow-lg shadow-brand-600/20 active:scale-[0.99] transition-transform"
                >
                  پیشنهاد بده
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showOffer && (
        <OfferSheet
          request={request}
          editing={offered}
          initialMessage={offers.find((o) => o.fromId === "me")?.message}
          initialPrice={offers.find((o) => o.fromId === "me")?.price}
          onClose={() => setShowOffer(false)}
          onSubmit={async (message, price) => {
            await addOffer({ requestId: id, message, price });
            setShowOffer(false);
            show(offered ? "پیشنهادت به‌روز شد ✓" : "پیشنهادت فرستاده شد ✓");
          }}
        />
      )}

      {showWithdrawConfirm && (
        <WithdrawOfferSheet
          requestTitle={request.title}
          onClose={() => setShowWithdrawConfirm(false)}
          onConfirm={async () => {
            await withdrawOffer(id);
            setShowWithdrawConfirm(false);
            show("پیشنهادت حذف شد");
          }}
        />
      )}
    </main>
  );
}

function OffersSection({
  offers,
  getPerson,
  getThread,
  meAvatar,
  isOwner,
  onMessage,
  onWithdraw,
}: {
  offers: {
    id: string;
    fromId: string;
    message: string;
    price?: number;
    postedAt: string;
  }[];
  getPerson: (id: string) => Person | undefined;
  getThread: (peerId: string) => { length: number };
  meAvatar?: string;
  isOwner: boolean;
  onMessage: (peerId: string) => void;
  onWithdraw?: () => void;
}) {
  const sorted = [...offers].sort((a, b) => {
    if (a.fromId === "me" && b.fromId !== "me") return -1;
    if (b.fromId === "me" && a.fromId !== "me") return 1;
    return 0;
  });

  return (
    <section
      className={`px-4 ${isOwner ? "pt-3" : "pt-4"} pb-2 animate-fade-up`}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5 px-0.5">
        <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-ink dark:text-zinc-200">
          <span>پیشنهادها</span>
          {offers.length > 0 ? (
            <span className="inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-[11px] font-bold text-amber-900 dark:text-amber-200 nums">
              {toPersianDigits(offers.length)}
            </span>
          ) : null}
        </h2>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 dark:border-zinc-700 bg-[color:var(--circle-surface)]/60 dark:bg-zinc-900/40 px-4 py-5 text-center">
          <p className="text-[13px] font-semibold text-ink-muted dark:text-zinc-300">
            {isOwner ? "هنوز پیشنهادی نیامده" : "هنوز پیشنهادی نیست"}
          </p>
          <p className="text-[11px] text-ink-faint mt-1 leading-relaxed">
            {isOwner
              ? "وقتی کسی پاسخ بدهد اینجا می‌بینی."
              : "اگر می‌تونی کمک کنی، اولین پیشنهاد را بفرست."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((o, i) => {
            const from = getPerson(o.fromId);
            const mine = o.fromId === "me";
            const peer = mine ? undefined : from;
            const showDetail = isOwner || mine;
            const canMsg =
              isOwner &&
              peer &&
              canDirectMessage(peer, getThread(peer.id).length > 0);
            const displayName = mine ? "شما" : (peer?.name ?? "ناشناس");
            const relation = mine
              ? null
              : peer
                ? viewerRelationPhrase(peer)
                : "";

            return (
              <li
                key={o.id}
                className={`rounded-2xl border px-3.5 py-3 ${
                  mine
                    ? "border-brand-200/80 dark:border-brand-500/25 bg-brand-50/50 dark:bg-brand-500/10 shadow-sm shadow-brand-900/5"
                    : "border-stone-200/80 dark:border-zinc-800 bg-[color:var(--circle-surface)] dark:bg-zinc-900 shadow-sm shadow-stone-200/40 dark:shadow-none"
                }`}
                style={
                  i < 3 ? { animationDelay: `${i * 40}ms` } : undefined
                }
              >
                <div className="flex gap-3">
                  {mine ? (
                    <Avatar
                      name="شما"
                      src={meAvatar ?? from?.avatar}
                      showLevel={false}
                      size="sm"
                    />
                  ) : peer ? (
                    <Link
                      href={`/person/${peer.id}`}
                      className="shrink-0 active:opacity-80"
                    >
                      <Avatar
                        name={peer.name}
                        src={peer.avatar}
                        showLevel={false}
                        size="sm"
                      />
                    </Link>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-800 shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {mine || !peer ? (
                          <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
                            {displayName}
                          </p>
                        ) : (
                          <Link
                            href={`/person/${peer.id}`}
                            className="text-[13px] font-bold text-ink dark:text-zinc-100 active:opacity-70"
                          >
                            {peer.name}
                          </Link>
                        )}
                        {relation ? (
                          <p className="text-[11px] text-ink-faint mt-0.5 truncate">
                            {relation}
                          </p>
                        ) : null}
                      </div>
                      {showDetail ? (
                        <p className="text-[11px] text-ink-faint nums shrink-0 pt-0.5">
                          {o.postedAt}
                        </p>
                      ) : null}
                    </div>

                    {showDetail ? (
                      <>
                        <p className="text-[13px] text-ink-muted dark:text-zinc-300 leading-relaxed mt-2">
                          {o.message}
                        </p>
                        <div
                          className={`mt-2.5 flex items-end gap-3 ${
                            o.price != null ? "justify-between" : "justify-end"
                          }`}
                        >
                          {o.price != null ? (
                            <p className="text-[1.05rem] font-extrabold text-ink dark:text-zinc-50 nums tracking-tight leading-none">
                              {formatPrice(o.price)}
                            </p>
                          ) : null}
                          {mine && onWithdraw ? (
                            <button
                              type="button"
                              onClick={onWithdraw}
                              className="inline-flex items-center gap-1 shrink-0 text-[12px] font-bold text-red-600/90 dark:text-red-400 active:opacity-70"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              حذف پیشنهاد
                            </button>
                          ) : isOwner ? (
                            <div className="flex items-center gap-3">
                              {peer ? (
                                <Link
                                  href={`/person/${peer.id}`}
                                  className="text-[11px] font-bold text-ink-muted dark:text-zinc-400 active:text-brand-600"
                                >
                                  پروفایل ‹
                                </Link>
                              ) : null}
                              {canMsg && peer ? (
                                <button
                                  type="button"
                                  onClick={() => onMessage(peer.id)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400"
                                >
                                  <ChatIcon className="w-3.5 h-3.5" />
                                  پیام
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <p className="text-[12px] font-semibold text-ink-muted dark:text-zinc-400 mt-1.5">
                        پیشنهاد داده
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function OfferSheet({
  request,
  onClose,
  onSubmit,
  editing = false,
  initialMessage = "",
  initialPrice,
}: {
  request: CircleRequest;
  onClose: () => void;
  onSubmit: (message: string, price?: number) => void;
  editing?: boolean;
  initialMessage?: string;
  initialPrice?: number;
}) {
  const [message, setMessage] = useState(initialMessage);
  const [price, setPrice] = useState(
    initialPrice != null ? formatTomanInput(String(initialPrice)) : "",
  );
  const parsed = parseTomanInput(price);
  const spoken = parsed != null ? tomanInWords(parsed) : null;
  const budgetLine = formatRequestBudget(request.budget, request.budgetUnit);

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="offer-sheet-title"
      maxHeight="88dvh"
      zClass="z-[60]"
      footer={
        <div className="flex gap-2 pb-0.5">
          <button
            type="button"
            disabled={!message.trim()}
            onClick={() => onSubmit(message.trim(), parsed)}
            className="btn-primary flex-1 !py-3.5 !font-bold active:scale-[0.98] disabled:opacity-40"
          >
            {editing ? "ذخیره پیشنهاد" : "فرستادن پیشنهاد"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1 !py-3.5 active:scale-[0.98]"
          >
            انصراف
          </button>
        </div>
      }
    >
      <div className="pb-1">
        <h2
          id="offer-sheet-title"
          className="font-extrabold text-[1.2rem] text-ink dark:text-zinc-50 tracking-tight"
        >
          {editing ? "ویرایش پیشنهاد" : "پیشنهاد بده"}
        </h2>
        <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
          {editing
            ? "پیام یا مبلغ را عوض کن و دوباره بفرست."
            : "کوتاه بگو چطور می‌تونی کمک کنی."}
        </p>

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 ring-1 ring-amber-200/70 dark:ring-amber-500/25 px-3 py-3">
          {request.image ? (
            <span
              className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/20 ring-1 ring-amber-200/70 dark:ring-amber-500/25 flex items-center justify-center text-[1.35rem] shrink-0"
              aria-hidden
            >
              {request.image}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug line-clamp-2">
              {request.title}
            </p>
            <p className="text-[12px] font-semibold text-amber-900/75 dark:text-amber-200/80 mt-1 nums">
              {budgetLine}
            </p>
          </div>
        </div>

        <label className="block mt-5">
          <span className="text-[12px] font-bold text-ink dark:text-zinc-200">
            پیام
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="مثلاً: می‌تونم معرفی کنم / خودم انجام می‌دم…"
            rows={3}
            spellCheck={false}
            autoCorrect="off"
            className="field resize-none mt-1.5 leading-relaxed"
            autoFocus
          />
        </label>

        <div className="mt-4">
          <label
            htmlFor="offer-price"
            className="flex items-baseline justify-between gap-2"
          >
            <span className="text-[12px] font-bold text-ink dark:text-zinc-200">
              مبلغ پیشنهادی
            </span>
            <span className="text-[11px] font-medium text-ink-faint">
              اختیاری · تومان
            </span>
          </label>
          <div className="relative mt-1.5">
            <input
              id="offer-price"
              value={price}
              onChange={(e) => setPrice(formatTomanInput(e.target.value))}
              inputMode="numeric"
              autoComplete="off"
              placeholder="مثلاً ۳٬۰۰۰٬۰۰۰"
              aria-describedby={spoken ? "offer-price-words" : undefined}
              className="field nums !pl-14 !text-[1.05rem] !font-bold tracking-tight"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-ink-muted pointer-events-none">
              تومان
            </span>
          </div>
          {spoken ? (
            <p
              id="offer-price-words"
              className="mt-1.5 text-[12px] text-ink-muted dark:text-zinc-400 leading-relaxed"
            >
              {spoken}
            </p>
          ) : null}
        </div>
      </div>
    </SheetShell>
  );
}

function WithdrawOfferSheet({
  requestTitle,
  onClose,
  onConfirm,
}: {
  requestTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <SheetShell
      onClose={onClose}
      labelledBy="withdraw-offer-title"
      maxHeight="70dvh"
      zClass="z-[70]"
      footer={
        <div className="flex gap-2 pb-0.5">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 text-white font-bold py-3.5 text-[15px] active:scale-[0.98] active:bg-red-700"
          >
            حذف پیشنهاد
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1 !py-3.5 active:scale-[0.98]"
          >
            انصراف
          </button>
        </div>
      }
    >
      <div className="pb-1">
        <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
          <TrashIcon className="w-5 h-5" />
        </div>
        <h2
          id="withdraw-offer-title"
          className="font-extrabold text-[1.2rem] text-ink dark:text-zinc-50 tracking-tight"
        >
          پیشنهاد حذف شود؟
        </h2>
        <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
          از این درخواست برداشته می‌شود. درخواست‌دهنده دیگر آن را نمی‌بیند.
        </p>
        <p className="mt-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/80 px-3 py-2.5 text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug line-clamp-2">
          {requestTitle}
        </p>
      </div>
    </SheetShell>
  );
}
