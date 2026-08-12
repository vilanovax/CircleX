"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardBody, Chip } from "@heroui/react";
import { useStore } from "@/lib/store";
import HHeader from "@/components/heroui/HHeader";
import HListingImage from "@/components/heroui/HListingImage";
import HAvatar from "@/components/heroui/HAvatar";
// Complex interactive widgets reused as-is from the classic UI (out of scope to rebuild).
import ReferSheet from "@/components/ReferSheet";
import TrustPath from "@/components/TrustPath";
import { EndorsementList } from "@/components/Endorsements";
import LockedAccess from "@/components/LockedAccess";
import { ChatIcon, HeartIcon, ShieldCheckIcon } from "@/components/Icons";
import {
  badgeEmoji,
  badgeLabels,
  formatPrice,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
  relationLabels,
} from "@/lib/labels";
import type { BadgeType } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";
import { listingTypeColor } from "@/components/heroui/shared";

const ALL_BADGES: BadgeType[] = ["verify_item", "know_seller", "verify_quality", "dealt_before"];

export default function ListingHero(_props: { params: { id: string } }) {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { getListing, getPerson, toggleEndorsement, toggleSaved, isSaved } = useStore();
  const { show } = useToast();
  const [showRefer, setShowRefer] = useState(false);
  const saved = isSaved(id);

  const listing = getListing(id);
  if (!listing) {
    return (
      <main className="min-h-[100dvh]">
        <HHeader title="آگهی" back />
        <p className="text-center text-default-400 py-20 text-sm">آگهی پیدا نشد.</p>
      </main>
    );
  }

  const seller = getPerson(listing.sellerId);
  const isMine = listing.sellerId === "me";

  if (!isMine && !canView(listing, getPerson)) {
    return (
      <main className="min-h-[100dvh]">
        <HHeader title="جزئیات آگهی" back />
        <LockedAccess itemTitle={listing.title} itemKind="listing" privacy={listing.privacy} />
      </main>
    );
  }

  return (
    <main className="pb-28 min-h-[100dvh]">
      <HHeader
        title="جزئیات آگهی"
        back
        action={
          <Button
            isIconOnly
            variant="light"
            size="sm"
            aria-label={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن"}
            className={saved ? "text-pink-500" : "text-default-400"}
            onPress={() => {
              toggleSaved(id);
              show(saved ? "از نشان‌شده‌های پروفایل حذف شد" : "در پروفایل ذخیره شد ✓");
            }}
          >
            <HeartIcon className="w-6 h-6" filled={saved} />
          </Button>
        }
      />

      <div className="mx-4 mt-4">
        <HListingImage image={listing.image} alt={listing.title} size="hero" />
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Chip size="sm" variant="flat" color={listingTypeColor[listing.type]}>
            {listingTypeEmoji[listing.type]} {listingTypeLabels[listing.type]}
          </Chip>
          <Chip size="sm" variant="flat">{listing.category}</Chip>
          {listing.condition && <Chip size="sm" variant="flat">{listing.condition}</Chip>}
        </div>

        <h1 className="text-xl font-bold leading-snug">{listing.title}</h1>

        <div className="mt-2">
          {listing.price != null ? (
            <span className="text-2xl font-extrabold text-primary">{formatPrice(listing.price)}</span>
          ) : (
            <span className="text-xl font-bold text-success">{listing.type === "service" ? "توافقی" : "رایگان"}</span>
          )}
        </div>

        <p className="text-sm text-default-600 leading-relaxed mt-3 whitespace-pre-line">{listing.description}</p>

        <div className="flex items-center gap-3 text-xs text-default-400 mt-3">
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
        <Card radius="lg" shadow="sm">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheckIcon className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-sm">مسیر اعتماد</h2>
            </div>
            <TrustPath posterId={listing.sellerId} trustPath={listing.trustPath} variant="full" />
          </CardBody>
        </Card>
      </section>

      {/* Quick referral */}
      <section className="px-4 pt-3">
        <Card radius="lg" shadow="sm">
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center text-xl shrink-0">📨</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">این آگهی مناسب کسیه که می‌شناسی؟</p>
              <p className="text-[11px] text-default-400">داخل حلقه‌ی اعتمادت معرفی کن — نه اشتراک عمومی</p>
            </div>
            <Button color="primary" size="sm" className="shrink-0" onPress={() => setShowRefer(true)}>
              معرفی به دوست
            </Button>
          </CardBody>
        </Card>
      </section>

      {/* Seller */}
      {seller && !isMine && (
        <section className="px-4 pt-3">
          <Card as={Link} href={`/person/${listing.sellerId}`} radius="lg" shadow="sm" isPressable className="w-full">
            <CardBody className="p-4 flex flex-row items-center gap-3">
              <HAvatar name={seller.name} src={seller.avatar} level={seller.level} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-bold">{seller.name}</p>
                <p className="text-xs text-default-500 mt-0.5">
                  {seller.note ? `${seller.note} · ` : ""}
                  {relationLabels[seller.relation]}
                </p>
                <p className="text-xs text-default-400 mt-1">
                  {toPersianDigits(seller.deals)} معامله‌ی موفق · {seller.city}
                </p>
              </div>
              <span className="text-default-300 text-lg">‹</span>
            </CardBody>
          </Card>
        </section>
      )}

      {/* Endorsements */}
      <section className="px-4 pt-3">
        <Card radius="lg" shadow="sm">
          <CardBody className="p-4">
            <h2 className="font-bold text-sm mb-3">🛡️ تأیید و توصیه‌ها</h2>
            <EndorsementList endorsements={listing.endorsements} />

            {!isMine && (
              <div className="mt-4 pt-4 border-t border-divider">
                <p className="text-xs text-default-500 mb-2">
                  اگر این فروشنده یا کالا را تأیید می‌کنید، نشان خود را اضافه کنید:
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_BADGES.map((b) => {
                    const active = listing.endorsements.some((e) => e.personId === "me" && e.type === b);
                    return (
                      <Chip
                        key={b}
                        as="button"
                        onClick={() => toggleEndorsement(listing.id, b)}
                        color={active ? "success" : "default"}
                        variant={active ? "flat" : "bordered"}
                        className="cursor-pointer"
                      >
                        {badgeEmoji[b]} {badgeLabels[b]}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Sticky action bar */}
      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="mx-auto max-w-[480px] pointer-events-auto">
            <div className="bg-background/95 backdrop-blur border-t border-divider p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button
                color="primary"
                fullWidth
                size="lg"
                startContent={<ChatIcon className="w-5 h-5" />}
                onPress={() => router.push(`/messages/${listing.sellerId}`)}
              >
                {listing.type === "donation"
                  ? "پیام برای درخواست این کالا"
                  : listing.type === "service"
                    ? "پیام برای رزرو خدمت"
                    : "پیام به فروشنده"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRefer && (
        <ReferSheet listingId={listing.id} listingTitle={listing.title} onClose={() => setShowRefer(false)} />
      )}
    </main>
  );
}
