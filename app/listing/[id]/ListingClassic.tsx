"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import ListingGallery from "@/components/ListingGallery";
import ListingSpecs from "@/components/ListingSpecs";
import { lazyUi } from "@/lib/lazy-ui";
import Avatar from "@/components/Avatar";
import TrustPath from "@/components/TrustPath";
import { EndorsementList, EndorsementSummary } from "@/components/Endorsements";
import {
  ChatIcon,
  CircleUsersIcon,
  HeartIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import {
  badgeLabels,
  formatPrice,
  listingTypeChip,
  listingTypeLabels,
  privacyDetailLabels,
  relationLabels,
} from "@/lib/labels";
import type { BadgeType } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import LockedAccess from "@/components/LockedAccess";
import { canView, privacyAudience, viewerRelationPhrase } from "@/lib/trust";
import { useToast } from "@/components/Toast";
import ListingAskPrompts from "@/components/ListingAskPrompts";
import {
  listingBuyerPrompts,
  listingMissingSpecPrompts,
  type BuyerPrompt,
} from "@/lib/listing-prompts";
import { listingGalleryImages } from "@/lib/listing-image";

const ReferSheet = lazyUi(() => import("@/components/ReferSheet"));

const ALL_BADGES: BadgeType[] = [
  "verify_item",
  "know_seller",
  "verify_quality",
  "dealt_before",
];

export default function ListingClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { getListing, getPerson, people, toggleEndorsement, toggleSaved, isSaved } =
    useStore();
  const { show } = useToast();
  const [showRefer, setShowRefer] = useState(false);
  const [pathExpanded, setPathExpanded] = useState(true);
  const saved = isSaved(id);

  const listing = getListing(id);
  const isDirectTrust =
    !!listing &&
    listing.sellerId !== "me" &&
    listing.trustPath.length === 0;

  useEffect(() => {
    setPathExpanded(!isDirectTrust);
  }, [id, isDirectTrust]);

  if (!listing) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="آگهی" back />
        <p className="text-center text-ink-faint py-20 text-sm">آگهی پیدا نشد.</p>
      </main>
    );
  }

  const seller = getPerson(listing.sellerId);
  const isMine = listing.sellerId === "me";
  const isDirect = isDirectTrust;
  const circle = people.filter((p) => p.inMyCircle);
  const gallery = listingGalleryImages(listing);

  const ctaLabel = (() => {
    if (listing.type === "donation") return "پیام برای درخواست این کالا";
    if (listing.type === "service") return "پیام برای رزرو خدمت";
    if (seller) return `پیام به ${seller.name}`;
    return "پیام به فروشنده";
  })();

  if (!isMine && !canView(listing, getPerson)) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="جزئیات آگهی" back />
        <LockedAccess
          itemTitle={listing.title}
          itemKind="listing"
          privacy={listing.privacy}
        />
      </main>
    );
  }

  const relationLine = seller ? viewerRelationPhrase(seller) : "";
  const buyerPrompts = listingBuyerPrompts(listing);
  const gapPrompts = listingMissingSpecPrompts(listing);
  const emptySpecPrompts =
    gapPrompts.length > 0 ? gapPrompts : buyerPrompts;
  const sellerId = listing.sellerId;
  const listingId = listing.id;

  function goAsk(prompt: BuyerPrompt) {
    const q = encodeURIComponent(prompt.draft);
    router.push(
      `/messages/${sellerId}?draft=${q}&listing=${encodeURIComponent(listingId)}`,
    );
  }

  return (
    <main className="pb-44 min-h-[100dvh]">
      <Header
        title="جزئیات آگهی"
        back
        action={
          <button
            type="button"
            onClick={() => {
              toggleSaved(id);
              show(
                saved
                  ? "از نشان‌شده‌های پروفایل حذف شد"
                  : "در پروفایل ذخیره شد ✓",
              );
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              saved
                ? "text-pink-500 bg-pink-50 dark:bg-pink-500/10"
                : "text-ink-faint hover:bg-stone-200/50 dark:hover:bg-zinc-800"
            }`}
            aria-label={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن"}
            aria-pressed={saved}
          >
            <HeartIcon className="w-5 h-5" filled={saved} />
          </button>
        }
      />

      <ListingGallery
        images={gallery}
        alt={listing.title}
        category={listing.category}
        type={listing.type}
      />

      <div className="px-4 -mt-3 relative listing-detail-rise">
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className={`chip ${listingTypeChip[listing.type]}`}>
            {listingTypeLabels[listing.type]}
          </span>
          {listing.category && (
            <span className="chip bg-[color:var(--circle-surface)] text-ink-muted ring-1 ring-stone-200/70 dark:ring-zinc-700">
              {listing.category}
            </span>
          )}
          {listing.condition && (
            <span className="chip bg-[color:var(--circle-surface)] text-ink-muted ring-1 ring-stone-200/70 dark:ring-zinc-700">
              {listing.condition}
            </span>
          )}
        </div>

        <h1 className="text-[1.45rem] font-extrabold text-ink dark:text-zinc-50 leading-[1.35] tracking-tight">
          {listing.title}
        </h1>

        <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
          {listing.price != null ? (
            <span className="text-[1.35rem] font-extrabold text-ink dark:text-zinc-50 nums tracking-tight">
              {formatPrice(listing.price)}
            </span>
          ) : (
            <span className="text-lg font-bold text-levelA">
              {listing.type === "service" ? "توافقی" : "رایگان"}
            </span>
          )}
        </div>

        <p className="text-[13.5px] text-ink-muted dark:text-zinc-300 leading-[1.75] mt-3.5 whitespace-pre-line">
          {listing.description}
        </p>

        {listing.specs && listing.specs.length > 0 ? (
          <ListingSpecs specs={listing.specs} />
        ) : !isMine ? (
          <section className="mt-4">
            <p className="text-[13px] font-bold text-ink dark:text-zinc-100 mb-2">
              مشخصات
            </p>
            <div className="card px-3.5 py-3">
              <p className="text-[12px] text-ink-muted leading-relaxed mb-2.5">
                فروشنده هنوز مشخصات ساختاریافته وارد نکرده — مستقیم بپرس.
              </p>
              <ListingAskPrompts
                title="سؤال سریع"
                prompts={emptySpecPrompts}
                onPick={goAsk}
              />
            </div>
          </section>
        ) : null}

        <ul className="flex flex-wrap gap-2 mt-4">
          <li className="chip bg-[color:var(--circle-surface)] text-ink-muted ring-1 ring-stone-200/60 dark:ring-zinc-700/80">
            {listing.city}
          </li>
          <li className="chip bg-[color:var(--circle-surface)] text-ink-muted ring-1 ring-stone-200/60 dark:ring-zinc-700/80">
            {listing.postedAt}
          </li>
          <li
            className="chip bg-[color:var(--circle-surface)] text-ink-muted ring-1 ring-stone-200/60 dark:ring-zinc-700/80"
            title={privacyAudience(listing.privacy, circle)}
          >
            {privacyDetailLabels[listing.privacy]}
          </li>
        </ul>
      </div>

      {/* Seller first — decide who, then trust details */}
      {seller && !isMine && (
        <section className="px-4 pt-5">
          <p className="text-[11px] font-semibold text-ink-faint mb-2 px-0.5">
            فروشنده
          </p>
          <Link
            href={`/person/${listing.sellerId}`}
            className="card px-3.5 py-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform duration-150"
          >
            <Avatar
              name={seller.name}
              src={seller.avatar}
              showLevel={false}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] text-ink dark:text-zinc-100">
                {seller.name}
              </p>
              <p className="text-[12px] text-ink-muted mt-0.5 truncate">
                {relationLine}
                {" · "}
                حلقه {relationLabels[seller.relation]}
              </p>
              <p className="text-[11px] text-ink-faint mt-1">
                <span className="nums">{toPersianDigits(seller.deals)}</span>{" "}
                معامله در سیرکل · {seller.city}
                {seller.memberSince ? (
                  <>
                    {" · "}عضو از{" "}
                    <span className="nums">{seller.memberSince}</span>
                  </>
                ) : null}
              </p>
            </div>
            <span
              className="text-[12px] font-bold text-brand-600 dark:text-brand-400 shrink-0"
              aria-hidden
            >
              پروفایل ‹
            </span>
          </Link>
        </section>
      )}

      {/* Trust — compact for direct, expandable path */}
      {!isMine && (
        <section className="px-4 pt-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-xl bg-[color:var(--circle-trust)]/12 text-[color:var(--circle-trust)] flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-[18px] h-[18px]" />
              </span>
              <div className="min-w-0">
                <h2 className="font-bold text-[14px] text-ink dark:text-zinc-100 leading-tight">
                  ارتباط شما با فروشنده
                </h2>
                {isDirect && seller ? (
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    این آگهی از حلقه مستقیم شماست
                  </p>
                ) : (
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    مسیر اعتماد تا این آگهی
                  </p>
                )}
              </div>
            </div>

            {isDirect && seller ? (
              <>
                {listing.endorsements.length > 0 ? (
                  <div className="mb-1">
                    <EndorsementSummary endorsements={listing.endorsements} />
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-muted leading-relaxed">
                    فروشنده در حلقه مستقیم شماست — جزئیات رابطه را در کارت بالا
                    می‌بینی.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setPathExpanded((v) => !v)}
                  className="mt-3 text-[12px] font-bold text-brand-600 dark:text-brand-400"
                  aria-expanded={pathExpanded}
                >
                  {pathExpanded
                    ? "بستن مسیر ارتباط"
                    : "مشاهده مسیر ارتباط ‹"}
                </button>
                {pathExpanded && (
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800">
                    <TrustPath
                      posterId={listing.sellerId}
                      trustPath={listing.trustPath}
                      variant="full"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <TrustPath
                  posterId={listing.sellerId}
                  trustPath={listing.trustPath}
                  variant="full"
                />
                {listing.endorsements.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800">
                    <EndorsementSummary endorsements={listing.endorsements} />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      <section className="px-4 pt-3">
        <div className="card p-4">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <h2 className="font-bold text-[14px] text-ink dark:text-zinc-100">
              تأیید و توصیه‌ها
            </h2>
            {listing.endorsements.length > 0 && (
              <span className="text-[11px] font-semibold text-ink-faint nums">
                {toPersianDigits(listing.endorsements.length)}
              </span>
            )}
          </div>
          <EndorsementList endorsements={listing.endorsements} />

          {!isMine && (
            <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-zinc-800">
              <p className="text-[12px] text-ink-muted mb-2.5 leading-relaxed">
                اگر فروشنده یا کالا را می‌شناسی، نشان اعتماد بده:
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_BADGES.map((b) => {
                  const active = listing.endorsements.some(
                    (e) => e.personId === "me" && e.type === b,
                  );
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleEndorsement(listing.id, b)}
                      className={`chip !px-3 !py-1.5 border transition-colors text-[12px] ${
                        active
                          ? "bg-[color:var(--circle-trust)]/12 text-[color:var(--circle-trust)] border-[color:var(--circle-trust)]/35"
                          : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200 dark:border-zinc-700"
                      }`}
                    >
                      {badgeLabels[b]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {!isMine && (
        <section className="px-4 pt-3 pb-2">
          <button
            type="button"
            onClick={() => setShowRefer(true)}
            className="w-full flex items-center gap-3 px-1 py-2 rounded-xl text-start active:opacity-80 transition-opacity"
          >
            <span className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <CircleUsersIcon className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-[13px] text-ink dark:text-zinc-100">
                کسی در حلقه‌ات دنبال چنین چیزی است؟
              </span>
              <span className="block text-[11px] text-ink-muted mt-0.5">
                آگهی را فقط داخل حلقه برایش بفرست
              </span>
            </span>
            <span className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400">
              معرفی ‹
            </span>
          </button>
        </section>
      )}

      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/70 dark:border-zinc-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2.5">
              <div className="pointer-events-auto">
                <ListingAskPrompts
                  title="سؤال آماده"
                  prompts={buyerPrompts}
                  onPick={goAsk}
                />
              </div>
              <button
                type="button"
                onClick={() => router.push(`/messages/${listing.sellerId}`)}
                className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
              >
                <ChatIcon className="w-5 h-5" />
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefer && (
        <ReferSheet
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowRefer(false)}
        />
      )}
    </main>
  );
}
