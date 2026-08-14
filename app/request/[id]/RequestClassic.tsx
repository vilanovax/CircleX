"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import TrustPath from "@/components/TrustPath";
import SheetShell from "@/components/SheetShell";
import { ShieldCheckIcon } from "@/components/Icons";
import { formatPrice, privacyLabels, relationLabels } from "@/lib/labels";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";
import LockedAccess from "@/components/LockedAccess";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";

export default function RequestClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const id = String(params.id);
  const { getRequest, getPerson, getOffers, hasOffered, addOffer, withdrawOffer } =
    useStore();
  const { show } = useToast();
  const [showOffer, setShowOffer] = useState(false);

  const request = getRequest(id);
  if (!request) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="درخواست" back />
        <p className="text-center text-ink-faint py-20 text-sm">درخواست پیدا نشد.</p>
      </main>
    );
  }

  const requester = getPerson(request.requesterId);
  const isMine = request.requesterId === "me";

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

  const offers = getOffers(id);
  const offered = hasOffered(id);

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header title="جزئیات درخواست" back />

      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="chip bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            درخواست
          </span>
          <span className="chip bg-stone-100 dark:bg-zinc-800 text-ink-muted">
            {request.category}
          </span>
          <span className="text-[11px] text-ink-faint">
            {privacyLabels[request.privacy]}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-2xl bg-stone-50 dark:bg-zinc-800/80 ring-1 ring-stone-100 dark:ring-zinc-700/60 flex items-center justify-center text-3xl shrink-0">
            {request.image}
          </div>
          <div className="min-w-0">
            <h1 className="text-[1.35rem] font-extrabold text-ink dark:text-zinc-50 leading-snug">
              {request.title}
            </h1>
            {request.budget != null && (
              <p className="text-[15px] font-extrabold text-ink dark:text-zinc-100 mt-1 nums tracking-tight">
                بودجه: تا {formatPrice(request.budget)}
              </p>
            )}
          </div>
        </div>

        {request.description.trim() ? (
          <p className="text-[13px] text-ink-muted dark:text-zinc-300 leading-relaxed mt-3 whitespace-pre-line">
            {request.description}
          </p>
        ) : null}

        <div className="flex items-center gap-2 text-[11px] text-ink-muted dark:text-zinc-400 mt-3">
          <span>{request.city}</span>
          <span className="text-stone-300" aria-hidden>
            ·
          </span>
          <span>{request.postedAt}</span>
        </div>
      </div>

      <section className="px-4 pt-4">
        <div className="card p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheckIcon className="w-[18px] h-[18px] text-levelA" />
            <h2 className="font-bold text-[13px] text-ink dark:text-zinc-100">
              مسیر ارتباط
            </h2>
          </div>
          <TrustPath
            posterId={request.requesterId}
            trustPath={request.trustPath}
            variant="full"
          />
        </div>
      </section>

      {requester && !isMine && (
        <section className="px-4 pt-2.5">
          <Link
            href={`/person/${request.requesterId}`}
            className="card px-3.5 py-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
          >
            <Avatar name={requester.name} src={requester.avatar} level={requester.level} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[14px] text-ink dark:text-zinc-100">
                {requester.name}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                {requester.note ? `${requester.note} · ` : ""}
                {relationLabels[requester.relation]}
              </p>
              <p className="text-[11px] text-ink-faint mt-0.5">
                <span className="nums">{toPersianDigits(requester.deals)}</span>{" "}
                معامله · {requester.city}
              </p>
            </div>
            <span className="text-ink-faint text-lg" aria-hidden>
              ‹
            </span>
          </Link>
        </section>
      )}

      <section className="px-4 pt-2.5 pb-2">
        <div className="card p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-bold text-[13px] text-ink dark:text-zinc-100">
              پیشنهادها
            </h2>
            <span className="text-[11px] font-semibold text-ink-faint nums">
              {toPersianDigits(offers.length)}
            </span>
          </div>
          {offers.length === 0 ? (
            <p className="text-[13px] text-ink-faint">
              هنوز کسی پیشنهاد نداده. اولین نفر باشید.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-zinc-800 -mx-3.5">
              {offers.map((o) => {
                const from = getPerson(o.fromId);
                const mine = o.fromId === "me";
                return (
                  <li key={o.id} className="flex gap-2.5 px-3.5 py-3">
                    {from || mine ? (
                      <Avatar
                        name={mine ? "شما" : from!.name}
                        src={from?.avatar}
                        level={mine ? undefined : from!.level}
                        size="sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-800 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-bold text-ink dark:text-zinc-100">
                          {mine ? "شما" : from?.name ?? "ناشناس"}
                        </span>
                        {o.price != null && (
                          <span className="text-[12px] font-bold text-ink nums">
                            {formatPrice(o.price)}
                          </span>
                        )}
                        <span className="text-[11px] text-ink-faint ms-auto nums">
                          {o.postedAt}
                        </span>
                      </div>
                      <p className="text-[13px] text-ink-muted dark:text-zinc-300 leading-relaxed mt-0.5">
                        {o.message}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/70 dark:border-zinc-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {offered ? (
                <div className="flex gap-2">
                  <span className="btn-ghost flex-1 text-center !text-levelA">
                    ✓ پیشنهاد شما ثبت شد
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      withdrawOffer(id);
                      show("پیشنهاد لغو شد");
                    }}
                    className="bg-stone-100 dark:bg-zinc-800 text-ink-muted font-medium rounded-xl px-4 active:bg-stone-200 dark:active:bg-zinc-700"
                  >
                    لغو
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowOffer(true)}
                  className="btn-primary w-full !py-3.5 text-base"
                >
                  این را دارم — پیشنهاد می‌دهم
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showOffer && (
        <OfferSheet
          onClose={() => setShowOffer(false)}
          onSubmit={(message, price) => {
            addOffer({ requestId: id, message, price });
            setShowOffer(false);
            show("پیشنهاد شما فرستاده شد ✓");
          }}
        />
      )}
    </main>
  );
}

function OfferSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (message: string, price?: number) => void;
}) {
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");

  return (
    <SheetShell onClose={onClose} labelledBy="offer-sheet-title">
      <div className="flex items-start justify-between gap-3 mb-3 px-0.5">
        <div>
          <h2
            id="offer-sheet-title"
            className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50"
          >
            پیشنهاد شما
          </h2>
          <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1">
            توضیح دهید چه دارید؛ درخواست‌دهنده از حلقهٔ شماست.
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

      <label className="block text-[13px] font-medium mb-1 text-ink dark:text-zinc-200">
        پیام
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="مثلاً: یه نمونه‌ی سالم دارم، می‌تونم عکس بفرستم…"
        rows={3}
        className="field resize-none mb-4"
      />

      <label className="block text-[13px] font-medium mb-1 text-ink dark:text-zinc-200">
        قیمت پیشنهادی (اختیاری)
      </label>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        inputMode="numeric"
        placeholder="تومان"
        className="field nums mb-5"
      />

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1">
          انصراف
        </button>
        <button
          type="button"
          disabled={!message.trim()}
          onClick={() =>
            onSubmit(
              message.trim(),
              price
                ? Number(toEnglishDigits(price).replace(/\D/g, "")) ||
                  undefined
                : undefined,
            )
          }
          className="btn-primary flex-1"
        >
          فرستادن پیشنهاد
        </button>
      </div>
    </SheetShell>
  );
}
