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
  badgeEmoji,
  badgeLabels,
  formatPrice,
  listingTypeChip,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
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

export default function ListingDetailPage() {
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
        <p className="text-center text-zinc-400 py-20 text-sm">آگهی پیدا نشد.</p>
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
            onClick={() => {
              toggleSaved(id);
              show(
                saved
                  ? "از نشان‌شده‌های پروفایل حذف شد"
                  : "در پروفایل ذخیره شد ✓",
              );
            }}
            className={`w-9 h-9 flex items-center justify-center ${
              saved ? "text-pink-500" : "text-zinc-400"
            }`}
            aria-label={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن"}
            aria-pressed={saved}
          >
            <HeartIcon className="w-6 h-6" filled={saved} />
          </button>
        }
      />

      <div className="mx-4 mt-4">
        <ListingImage
          image={listing.image}
          alt={listing.title}
          size="hero"
          category={listing.category}
          type={listing.type}
        />
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`chip ${listingTypeChip[listing.type]}`}>
            {listingTypeEmoji[listing.type]} {listingTypeLabels[listing.type]}
          </span>
          <span className="chip bg-zinc-100 text-zinc-500">{listing.category}</span>
          {listing.condition && (
            <span className="chip bg-zinc-100 text-zinc-500">{listing.condition}</span>
          )}
        </div>

        <h1 className="text-xl font-bold text-zinc-900 leading-snug">
          {listing.title}
        </h1>

        <div className="mt-2">
          {listing.price != null ? (
            <span className="text-2xl font-extrabold text-brand-700 nums">
              {formatPrice(listing.price)}
            </span>
          ) : (
            <span className="text-xl font-bold text-levelA">
              {listing.type === "service" ? "توافقی" : "رایگان"}
            </span>
          )}
        </div>

        <p className="text-sm text-zinc-600 leading-relaxed mt-3 whitespace-pre-line">
          {listing.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-3">
          <span>📍 {listing.city}</span>
          <span>·</span>
          <span>{listing.postedAt}</span>
          <span>·</span>
          <span title={privacyLabels[listing.privacy]}>
            {privacyEmoji[listing.privacy]} {privacyLabels[listing.privacy]}
          </span>
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
            posterId={listing.sellerId}
            trustPath={listing.trustPath}
            variant="full"
          />
        </div>
      </section>

      {/* Quick referral */}
      <section className="px-4 pt-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xl shrink-0">
            📨
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-zinc-800">
              این آگهی مناسب کسیه که می‌شناسی؟
            </p>
            <p className="text-[11px] text-zinc-400">
              داخل حلقه‌ی اعتمادت معرفی کن — نه اشتراک عمومی
            </p>
          </div>
          <button
            onClick={() => setShowRefer(true)}
            className="btn-primary !px-4 !py-2.5 text-sm shrink-0"
          >
            معرفی به دوست
          </button>
        </div>
      </section>

      {/* Seller */}
      {seller && !isMine && (
        <section className="px-4 pt-3">
          <Link
            href={`/person/${listing.sellerId}`}
            className="card p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
          >
            <Avatar name={seller.name} level={seller.level} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-zinc-900">{seller.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {seller.note ? `${seller.note} · ` : ""}
                {relationLabels[seller.relation]}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                <span className="nums">{toPersianDigits(seller.deals)}</span>{" "}
                معامله‌ی موفق ·{" "}
                {seller.city}
              </p>
            </div>
            <span className="text-zinc-300 text-lg">‹</span>
          </Link>
        </section>
      )}

      {/* Endorsements */}
      <section className="px-4 pt-3">
        <div className="card p-4">
          <h2 className="font-bold text-sm text-zinc-800 mb-3">
            🛡️ تأیید و توصیه‌ها
          </h2>
          <EndorsementList endorsements={listing.endorsements} />

          {!isMine && (
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <p className="text-xs text-zinc-500 mb-2">
                اگر این فروشنده یا کالا را تأیید می‌کنید، نشان خود را اضافه کنید:
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_BADGES.map((b) => {
                  const active = listing.endorsements.some(
                    (e) => e.personId === "me" && e.type === b,
                  );
                  return (
                    <button
                      key={b}
                      onClick={() => toggleEndorsement(listing.id, b)}
                      className={`chip !px-3 !py-1.5 border transition-colors ${
                        active
                          ? "bg-levelA/10 text-levelA border-levelA/30 dark:bg-green-500/15"
                          : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {badgeEmoji[b]} {badgeLabels[b]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sticky action bar — single CTA (refer lives in card above) */}
      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-zinc-100 dark:border-zinc-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
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
