"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import TrustPath from "@/components/TrustPath";
import { ShieldCheckIcon } from "@/components/Icons";
import { formatPrice, privacyEmoji, privacyLabels, relationLabels } from "@/lib/labels";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";
import LockedAccess from "@/components/LockedAccess";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";

export default function RequestDetailPage() {
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
        <p className="text-center text-zinc-400 py-20 text-sm">درخواست پیدا نشد.</p>
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

      {/* Header card */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="chip bg-amber-50 text-amber-600">🔎 درخواست</span>
          <span className="chip bg-zinc-100 text-zinc-500">{request.category}</span>
          <span className="text-[11px] text-zinc-400" title={privacyLabels[request.privacy]}>
            {privacyEmoji[request.privacy]}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-zinc-100 dark:from-amber-500/10 dark:to-zinc-800 flex items-center justify-center text-4xl shrink-0">
            {request.image}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-zinc-900 leading-snug">
              {request.title}
            </h1>
            {request.budget != null && (
              <p className="text-sm font-bold text-brand-700 mt-1 nums">
                بودجه: تا {formatPrice(request.budget)}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-zinc-600 leading-relaxed mt-3 whitespace-pre-line">
          {request.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-3">
          <span>📍 {request.city}</span>
          <span>·</span>
          <span>{request.postedAt}</span>
        </div>
      </div>

      {/* Trust path */}
      <section className="px-4 pt-5">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheckIcon className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-sm text-zinc-800">مسیر اعتماد</h2>
          </div>
          <TrustPath
            posterId={request.requesterId}
            trustPath={request.trustPath}
            variant="full"
            posterRole="درخواست‌دهنده"
            viewerRole="شما"
          />
        </div>
      </section>

      {/* Requester */}
      {requester && !isMine && (
        <section className="px-4 pt-3">
          <Link
            href={`/person/${request.requesterId}`}
            className="card p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
          >
            <Avatar name={requester.name} level={requester.level} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-zinc-900">{requester.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {requester.note ? `${requester.note} · ` : ""}
                {relationLabels[requester.relation]}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                <span className="nums">{toPersianDigits(requester.deals)}</span>{" "}
                معامله‌ی موفق · {requester.city}
              </p>
            </div>
            <span className="text-zinc-300 text-lg">‹</span>
          </Link>
        </section>
      )}

      {/* Offers */}
      <section className="px-4 pt-3">
        <div className="card p-4">
          <h2 className="font-bold text-sm text-zinc-800 mb-3">
            پیشنهادها{" "}
            <span className="text-zinc-400 font-normal nums">
              ({toPersianDigits(offers.length)})
            </span>
          </h2>
          {offers.length === 0 ? (
            <p className="text-sm text-zinc-400">
              هنوز کسی پیشنهاد نداده. اولین نفر باش!
            </p>
          ) : (
            <ul className="space-y-3">
              {offers.map((o) => {
                const from = getPerson(o.fromId);
                const mine = o.fromId === "me";
                return (
                  <li key={o.id} className="flex gap-2.5">
                    {from || mine ? (
                      <Avatar
                        name={mine ? "شما" : from!.name}
                        level={mine ? undefined : from!.level}
                        size="sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-100 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-zinc-800">
                          {mine ? "شما" : from?.name ?? "ناشناس"}
                        </span>
                        {o.price != null && (
                          <span className="chip bg-brand-50 text-brand-700 nums">
                            {formatPrice(o.price)}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400 mr-auto">
                          {o.postedAt}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 leading-relaxed mt-0.5">
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

      {/* Sticky offer action */}
      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto bg-white/95 backdrop-blur border-t border-zinc-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {offered ? (
                <div className="flex gap-2">
                  <span className="btn-ghost flex-1 text-center !text-levelA">
                    ✓ پیشنهاد شما ثبت شد
                  </span>
                  <button
                    onClick={() => {
                      withdrawOffer(id);
                      show("پیشنهاد لغو شد");
                    }}
                    className="bg-zinc-100 text-zinc-600 font-medium rounded-xl px-4 active:bg-zinc-200"
                  >
                    لغو
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowOffer(true)}
                  className="btn-primary w-full !py-3.5 text-base"
                >
                  این رو دارم — پیشنهاد می‌دهم
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
            show("پیشنهاد شما ارسال شد ✓");
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
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose);

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-sheet-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 animate-slide-up outline-none"
        >
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
          <h2 id="offer-sheet-title" className="font-bold text-lg mb-1 text-zinc-900 dark:text-zinc-100">
            پیشنهاد شما
          </h2>
          <p className="text-xs text-zinc-400 mb-4">
            توضیح بده چی داری؛ درخواست‌دهنده از حلقه‌ی شماست.
          </p>

          <label className="block text-sm font-medium mb-1">پیام</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="مثلاً: یه نمونه‌ی سالم دارم، می‌تونم عکس بفرستم…"
            rows={3}
            className="field resize-none mb-4"
          />

          <label className="block text-sm font-medium mb-1">قیمت پیشنهادی (اختیاری)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            placeholder="تومان"
            className="field nums mb-5"
          />

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">
              انصراف
            </button>
            <button
              disabled={!message.trim()}
              onClick={() =>
                onSubmit(
                  message.trim(),
                  price ? Number(toEnglishDigits(price).replace(/\D/g, "")) || undefined : undefined,
                )
              }
              className="btn-primary flex-1"
            >
              ارسال پیشنهاد
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
