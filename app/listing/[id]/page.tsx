"use client";

import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
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
import { canView } from "@/lib/trust";

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
        <div className="flex flex-col items-center text-center px-8 py-20">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-3xl mb-4">
            🔒
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed">
            این آگهی فقط برای{" "}
            <span className="font-medium">{privacyLabels[listing.privacy]}</span>{" "}
            قابل نمایش است و شما در این محدوده‌ی اعتماد قرار نمی‌گیرید.
          </p>
        </div>
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
            onClick={() => toggleSaved(id)}
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

      {/* Hero image */}
      <div className="mx-4 mt-4 h-44 rounded-2xl bg-gradient-to-br from-brand-50 to-zinc-100 flex items-center justify-center text-7xl">
        {listing.image}
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

      {/* Seller */}
      {seller && !isMine && (
        <section className="px-4 pt-3">
          <div className="card p-4 flex items-center gap-3">
            <Avatar emoji={seller.avatar} level={seller.level} size="lg" />
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
          </div>
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
                          ? "bg-levelA/10 text-levelA border-levelA/30"
                          : "bg-white text-zinc-600 border-zinc-200"
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

      {/* Sticky action bar */}
      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto bg-white/95 backdrop-blur border-t border-zinc-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2">
              <button
                onClick={() => router.push("/messages")}
                className="btn-ghost flex items-center justify-center gap-2 px-5"
              >
                <ChatIcon className="w-5 h-5" />
                پیام
              </button>
              <button
                onClick={() => router.push("/messages")}
                className="btn-primary flex-1 !py-3"
              >
                {listing.type === "donation"
                  ? "درخواست این کالا"
                  : listing.type === "service"
                    ? "رزرو خدمت"
                    : "تماس با فروشنده"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
