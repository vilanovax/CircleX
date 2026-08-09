"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import ListingImage from "@/components/ListingImage";
import ReferSheet from "@/components/ReferSheet";
import Avatar from "@/components/Avatar";
import TrustPath from "@/components/TrustPath";
import { EndorsementList } from "@/components/Endorsements";
import { ChatIcon, HeartIcon, ShieldCheckIcon } from "@/components/Icons";
import {
  badgeLabels,
  formatPrice,
  listingTypeLabels,
  privacyLabels,
  relationLabels,
} from "@/lib/labels";
import type { BadgeType } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import LockedAccess from "@/components/LockedAccess";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";

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
  const { getListing, getPerson, toggleEndorsement, toggleSaved, isSaved } =
    useStore();
  const { show } = useToast();
  const [showRefer, setShowRefer] = useState(false);
  const saved = isSaved(id);

  const listing = getListing(id);
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

  return (
    <main className="pb-28 min-h-[100dvh]">
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
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              saved ? "text-pink-500" : "text-ink-faint"
            }`}
            aria-label={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن"}
            aria-pressed={saved}
          >
            <HeartIcon className="w-5 h-5" filled={saved} />
          </button>
        }
      />

      <div className="mx-4 mt-3">
        <ListingImage
          image={listing.image}
          alt={listing.title}
          size="hero"
          category={listing.category}
          type={listing.type}
          frameClassName="h-44 w-full rounded-2xl bg-gradient-to-br ring-1 ring-black/[0.04] dark:ring-white/5 overflow-hidden"
        />
      </div>

      <div className="px-4 pt-4">
        <p className="text-[11px] font-medium text-ink-faint">
          {listingTypeLabels[listing.type]}
          {listing.category ? ` · ${listing.category}` : ""}
          {listing.condition ? ` · ${listing.condition}` : ""}
        </p>

        <h1 className="text-[1.35rem] font-extrabold text-ink dark:text-zinc-50 leading-snug mt-1">
          {listing.title}
        </h1>

        <div className="mt-2">
          {listing.price != null ? (
            <span className="text-xl font-extrabold text-ink dark:text-zinc-50 nums tracking-tight">
              {formatPrice(listing.price)}
            </span>
          ) : (
            <span className="text-lg font-bold text-levelA">
              {listing.type === "service" ? "توافقی" : "رایگان"}
            </span>
          )}
        </div>

        <p className="text-[13px] text-ink-muted dark:text-zinc-300 leading-relaxed mt-3 whitespace-pre-line">
          {listing.description}
        </p>

        <div className="flex items-center gap-2 text-[11px] text-ink-muted dark:text-zinc-400 mt-3">
          <span>{listing.city}</span>
          <span className="text-stone-300" aria-hidden>
            ·
          </span>
          <span>{listing.postedAt}</span>
          <span className="text-stone-300" aria-hidden>
            ·
          </span>
          <span>{privacyLabels[listing.privacy]}</span>
        </div>
      </div>

      {/* Trust path */}
      <section className="px-4 pt-4">
        <div className="card p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheckIcon className="w-4.5 h-4.5 w-[18px] h-[18px] text-levelA" />
            <h2 className="font-bold text-[13px] text-ink dark:text-zinc-100">
              مسیر اعتماد
            </h2>
          </div>
          <TrustPath
            posterId={listing.sellerId}
            trustPath={listing.trustPath}
            variant="full"
          />
        </div>
      </section>

      {/* Quick referral */}
      <section className="px-4 pt-2.5">
        <div className="card px-3.5 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center shrink-0 text-sm font-extrabold">
            م
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[13px] text-ink dark:text-zinc-100">
              مناسب کسی از حلقه‌ات است؟
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              فقط داخل حلقه معرفی کن
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRefer(true)}
            className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400 px-2 py-1.5"
          >
            معرفی ‹
          </button>
        </div>
      </section>

      {/* Seller */}
      {seller && !isMine && (
        <section className="px-4 pt-2.5">
          <Link
            href={`/person/${listing.sellerId}`}
            className="card px-3.5 py-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
          >
            <Avatar name={seller.name} level={seller.level} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[14px] text-ink dark:text-zinc-100">
                {seller.name}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                {seller.note ? `${seller.note} · ` : ""}
                {relationLabels[seller.relation]}
              </p>
              <p className="text-[11px] text-ink-faint mt-0.5">
                <span className="nums">{toPersianDigits(seller.deals)}</span>{" "}
                معامله · {seller.city}
              </p>
            </div>
            <span className="text-ink-faint text-lg" aria-hidden>
              ‹
            </span>
          </Link>
        </section>
      )}

      {/* Endorsements */}
      <section className="px-4 pt-2.5 pb-2">
        <div className="card p-3.5">
          <h2 className="font-bold text-[13px] text-ink dark:text-zinc-100 mb-3">
            تأیید و توصیه‌ها
          </h2>
          <EndorsementList endorsements={listing.endorsements} />

          {!isMine && (
            <div className="mt-3.5 pt-3.5 border-t border-stone-100 dark:border-zinc-800">
              <p className="text-[11px] text-ink-muted mb-2 leading-relaxed">
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
                          ? "bg-levelA/10 text-levelA border-levelA/30"
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
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/70 dark:border-zinc-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => router.push(`/messages/${listing.sellerId}`)}
                className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2"
              >
                <ChatIcon className="w-5 h-5" />
                {listing.type === "donation"
                  ? "پیام برای درخواست این کالا"
                  : listing.type === "service"
                    ? "پیام برای رزرو خدمت"
                    : "پیام به فروشنده"}
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
