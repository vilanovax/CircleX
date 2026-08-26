"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import Header from "@/components/Header";
import ListingGallery from "@/components/ListingGallery";
import ListingHeroSpecs from "@/components/ListingHeroSpecs";
import ListingSpecs from "@/components/ListingSpecs";
import ListingTrustStrip from "@/components/ListingTrustStrip";
import ListingSellerMore from "@/components/ListingSellerMore";
import { lazyUi } from "@/lib/lazy-ui";
import Avatar from "@/components/Avatar";
import { EndorsementList, visibleEndorsements } from "@/components/Endorsements";
import {
  ChatIcon,
  CircleUsersIcon,
  EyeOffIcon,
  FlagIcon,
  HeartIcon,
  MoreIcon,
  NoteIcon,
  PencilIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import {
  dealStatusLabels,
  formatPrice,
  listingDisplayTitle,
  listingPrivacyAudienceLine,
  listingTypeChip,
  listingTypeLabels,
} from "@/lib/labels";
import type { Listing, Message } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import { canView, listingSellerSubtitle } from "@/lib/trust";
import {
  CIRCLE_MEMBER_NAME,
  listingAudienceLine,
  listingChatHref,
  listingPrivacySummary,
  privateListingAvatar,
} from "@/lib/listing-privacy";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";
import ListingAskPrompts from "@/components/ListingAskPrompts";
import {
  listingBuyerPrompts,
  type BuyerPrompt,
} from "@/lib/listing-prompts";
import { listingGalleryImages } from "@/lib/listing-image";
import { listingThreadPeers } from "@/lib/thread-listing";
import { pickHeroSpecs } from "@/lib/listing-hero-specs";
import { AREA_MODES, areaMode, placeDetailLabel } from "@/lib/place";
import { useOwnerListingFlow } from "@/components/OwnerListingManager";
import { ListingDetailSkeleton } from "@/components/Skeleton";
import {
  hideConfirmListing,
  hideConfirmPerson,
  hideListingCopy,
  hidePersonCopy,
} from "@/lib/hide-from-feed";

const ReferSheet = lazyUi(() => import("@/components/ReferSheet"));
const ReportListingSheet = lazyUi(() => import("@/components/ReportListingSheet"));
const EndorseSheet = lazyUi(() => import("@/components/EndorseSheet"));
const ListingNoteSheet = lazyUi(() => import("@/components/ListingPersonalNote"));
const HideFromFeedSheet = lazyUi(() => import("@/components/HideFromFeedSheet"));
const ListingAudienceSheet = lazyUi(
  () => import("@/components/ListingAudienceSheet"),
);
const TrustPath = lazyUi(() => import("@/components/TrustPath"), {
  loading: () => (
    <div className="h-16 rounded-xl bg-stone-100 dark:bg-zinc-800 animate-pulse" />
  ),
});
const LockedAccess = lazyUi(() => import("@/components/LockedAccess"));

const IDLE_MESSAGES: Message[] = [];

export default function ListingClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const id = String(params.id);
  const listing = useStore((s) => s.listings.find((row) => row.id === id));
  const listingHidden = useStore((s) => s.hiddenListings.includes(id));
  const sellerHidden = useStore((s) => {
    const row = s.listings.find((l) => l.id === id);
    return row ? s.hiddenPeople.includes(row.sellerId) : false;
  });
  const ensureListing = useStore((s) => s.ensureListing);
  const getPerson = useStore((s) => s.getPerson);
  const hydrated = useStore((s) => s.hydrated);
  const [showRefer, setShowRefer] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showEndorse, setShowEndorse] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [pathExpanded, setPathExpanded] = useState(false);
  const [lookup, setLookup] = useState<"idle" | "loading" | "miss">("idle");
  const [ownerMenuSlot, setOwnerMenuSlot] = useState<HTMLSpanElement | null>(
    null,
  );
  const listingMissing = !listing;
  const listingPreview = Boolean(listing?.feedPreview);

  useEffect(() => {
    if (!hydrated) return;
    if (!listingMissing && !listingPreview) {
      setLookup("idle");
      return;
    }
    let cancelled = false;
    if (listingMissing) setLookup("loading");
    void ensureListing(id).then((row) => {
      if (cancelled) return;
      setLookup(row ? "idle" : "miss");
    });
    return () => {
      cancelled = true;
    };
  }, [ensureListing, hydrated, id, listingMissing, listingPreview]);

  useEffect(() => {
    setPathExpanded(false);
  }, [id]);

  const gallery = useMemo(
    () => (listing ? listingGalleryImages(listing) : []),
    [listing],
  );
  const heroSpecs = useMemo(
    () => (listing?.specs ? pickHeroSpecs(listing.specs) : []),
    [listing],
  );
  const endorsementMeta = useMemo(() => {
    if (!listing) {
      return { count: 0, mine: [] as Listing["endorsements"] };
    }
    const visible = visibleEndorsements(listing.endorsements);
    return {
      count: new Set(visible.map((e) => e.personId)).size,
      mine: listing.endorsements.filter((e) => e.personId === "me"),
    };
  }, [listing]);

  if (!hydrated || !listing) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="جزئیات آگهی" back />
        {hydrated && lookup === "miss" ? (
          <p className="text-center text-ink-faint py-20 text-sm px-6 leading-relaxed">
            این آگهی برای تو قابل مشاهده نیست.
          </p>
        ) : (
          <ListingDetailSkeleton />
        )}
      </main>
    );
  }

  const seller = listing.identityHidden
    ? undefined
    : getPerson(listing.sellerId);
  const isMine = listing.sellerId === "me";
  const inactive = listing.dealStatus === "inactive";
  const isDirect =
    listing.sellerId !== "me" && listing.trustPath.length === 0;
  const displayTitle = listingDisplayTitle(listing.title, listing.type);
  const placeLine = placeDetailLabel(listing.city, listing.area);
  const deliveryMode = AREA_MODES.find(
    (row) => row.id === areaMode(listing.area),
  );
  const deliveryBit =
    deliveryMode && placeLine !== deliveryMode.label ? deliveryMode.label : "";
  const negotiable = listing.specs?.find((s) => s.label === "قابل مذاکره");
  const endorsementCount = endorsementMeta.count;
  const myEndorsements = endorsementMeta.mine;
  const buyerPrompts = listingBuyerPrompts(listing);
  const footerPad = isMine
    ? "pb-[6.25rem] scroll-pb-[6.25rem]"
    : inactive
      ? "pb-10 scroll-pb-10"
    : buyerPrompts.length === 0
      ? "pb-[12.5rem] scroll-pb-[12.5rem]"
      : "pb-[15rem] scroll-pb-[15rem]";

  const ctaLabel =
    listing.type === "donation"
      ? "پیام برای دریافت"
      : listing.type === "service"
        ? "پیام برای رزرو"
        : "پیام به فروشنده";

  if (!isMine && !inactive && !canView(listing, getPerson)) {
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

  const relationLine = seller
    ? listingSellerSubtitle(seller, listing.trustPath, getPerson)
    : "";

  return (
    <main className={`${footerPad} min-h-[100dvh]`}>
      <Header
        title="جزئیات آگهی"
        back
        action={
          isMine ? (
            <span ref={setOwnerMenuSlot} className="contents" />
          ) : (
            <ListingHeaderActions
              listingId={listing.id}
              onReport={() => setShowReport(true)}
              onReportIntent={() => {
                void import("@/components/ReportListingSheet");
              }}
              onNote={() => setShowNote(true)}
              onNoteIntent={() => {
                void import("@/components/ListingPersonalNote");
              }}
            />
          )
        }
      />

      <ListingGallery
        images={gallery}
        alt={listing.title}
        category={listing.category}
        type={listing.type}
      />

      <div className="px-4 -mt-4 relative">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className={`chip ${listingTypeChip[listing.type]}`}>
            {listingTypeLabels[listing.type]}
          </span>
          {listing.category &&
          listing.category !== listingTypeLabels[listing.type] ? (
            <span className="chip !text-[11px] !py-0.5 bg-transparent text-ink-muted ring-1 ring-stone-200/60 dark:ring-zinc-700">
              {listing.category}
            </span>
          ) : null}
          {listing.condition ? (
            <span className="chip !text-[11px] !py-0.5 bg-transparent text-ink-muted ring-1 ring-stone-200/60 dark:ring-zinc-700">
              {listing.condition}
            </span>
          ) : null}
          {inactive ? (
            <span className="chip !text-[11px] !py-0.5 bg-stone-100 text-ink-muted dark:bg-zinc-800 dark:text-zinc-300">
              غیرفعال
            </span>
          ) : listing.dealStatus === "reserved" ||
            listing.dealStatus === "agreed" ? (
            <span className="chip !text-[11px] !py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
              {dealStatusLabels[listing.dealStatus]}
            </span>
          ) : null}
          {isMine && listing.privatePublish ? (
            <span className="chip !text-[11px] !py-0.5 bg-stone-800 text-white dark:bg-zinc-100 dark:text-zinc-900">
              هویت پنهان
            </span>
          ) : null}
        </div>

        <h1 className="text-[20px] font-extrabold text-ink dark:text-zinc-50 leading-[1.35] tracking-tight">
          {displayTitle}
        </h1>

        <p className="mt-2 text-[12px] text-ink-muted dark:text-zinc-400 leading-relaxed px-0.5">
          {[placeLine, deliveryBit, listing.postedAt]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1 text-[11px] text-ink-faint dark:text-zinc-500 leading-relaxed px-0.5">
          {listing.identityHidden || (isMine && listing.privatePublish)
            ? isMine && listing.privatePublish
              ? "حلقه آگهی را می‌بیند؛ اسم و عکس تو روی آن نیست"
              : "داخل حلقهٔ تو می‌رسد"
            : listingPrivacyAudienceLine(
                listing.privacy,
                isMine ? "تو" : seller?.name,
              )}
          {!isMine && !isDirect && !listing.identityHidden
            ? " · از طریق آشنایان می‌رسد"
            : ""}
        </p>

        <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
          {listing.price != null ? (
            <span className="text-[20px] font-extrabold text-ink dark:text-zinc-50 nums tracking-tight">
              {formatPrice(listing.price)}
            </span>
          ) : (
            <span className="text-lg font-bold text-levelA">
              {listing.type === "service" ? "توافقی" : "رایگان"}
            </span>
          )}
          {negotiable?.value && /بله|کمی/.test(negotiable.value) ? (
            <span className="text-[12px] font-bold text-ink-muted dark:text-zinc-400">
              · قابل مذاکره
            </span>
          ) : null}
        </div>

        {heroSpecs.length === 3 ? (
          <ListingHeroSpecs specs={heroSpecs} />
        ) : null}

        {listing.specs && listing.specs.length > 0 ? (
          <ListingSpecs
            specs={listing.specs}
            omitLabels={heroSpecs.map((s) => s.label)}
          />
        ) : null}

        <ListingTrustStrip listing={listing} />

        <p className="text-[13px] text-ink-muted dark:text-zinc-300 leading-[1.8] mt-4 whitespace-pre-line">
          {listing.description}
        </p>

        {isMine && inactive ? (
          <p className="mt-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/70 px-3.5 py-2.5 text-[12px] text-ink-muted dark:text-zinc-300 leading-relaxed">
            این آگهی غیرفعال است — حلقه آن را در فید نمی‌بیند. در پروفایل تو
            می‌ماند.
          </p>
        ) : null}
        {!isMine && inactive ? (
          <p className="mt-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/70 px-3.5 py-2.5 text-[12px] text-ink-muted dark:text-zinc-300 leading-relaxed">
            این معامله تمام شد — آگهی در فید حلقه نیست. گفتگو را داری؛ اگر
            دیدی، حرف بگذار.
          </p>
        ) : null}
        {listingHidden && !sellerHidden ? (
          <p className="mt-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/70 px-3.5 py-2.5 text-[12px] text-ink-muted dark:text-zinc-300 leading-relaxed">
            {hideListingCopy.banner}
          </p>
        ) : null}
        {sellerHidden ? (
          <p className="mt-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/70 px-3.5 py-2.5 text-[12px] text-ink-muted dark:text-zinc-300 leading-relaxed">
            {hidePersonCopy(seller?.name ?? "فروشنده").banner}
          </p>
        ) : null}
      </div>

      {listing.identityHidden || (isMine && listing.privatePublish) ? (
        <section className="px-4 pt-3.5">
          <p className="text-[11px] font-semibold text-ink-faint mb-2 px-0.5">
            فروشنده
          </p>
          <div className="card px-3.5 py-3.5 flex items-center gap-3">
            <Avatar
              name={CIRCLE_MEMBER_NAME}
              src={listing.privateAvatar ?? privateListingAvatar(listing.id)}
              showLevel={false}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] text-ink dark:text-zinc-100">
                {CIRCLE_MEMBER_NAME}
              </p>
              <p className="text-[12px] text-ink-muted mt-0.5">
                {isMine
                  ? "حلقه تو را با این چهره می‌بیند، نه با نام و عکس پروفایل"
                  : "هویت برای اعضا پنهان است"}
              </p>
              <p className="text-[11px] text-ink-faint mt-1">
                {isMine ? "نمایش برای دیگران" : "داخل حلقهٔ تو"}
              </p>
            </div>
          </div>
        </section>
      ) : seller && !isMine ? (
        <section className="px-4 pt-3.5">
          <p className="text-[11px] font-semibold text-ink-faint mb-2 px-0.5">
            فروشنده
          </p>
          <div className="card overflow-hidden">
            <Link
              href={`/person/${listing.sellerId}`}
              className="px-3.5 py-3.5 flex items-center gap-3 active:bg-stone-50/80 dark:active:bg-zinc-800/50 transition-colors"
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
                </p>
                <p className="text-[11px] text-ink-faint mt-1 nums">
                  {toPersianDigits(seller.deals)} معامله
                  {seller.memberSince ? (
                    <>
                      {" · "}عضو از{" "}
                      <span className="nums">{seller.memberSince}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 shrink-0 text-center leading-tight max-w-[4.5rem]">
                دیدن پروفایل ‹
              </span>
            </Link>
          </div>
          <ListingSellerMore
            sellerId={listing.sellerId}
            listingId={listing.id}
          />
        </section>
      ) : null}

      {!isMine && !isDirect && !listing.identityHidden ? (
        <section className="px-4 pt-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-xl bg-[color:var(--circle-trust)]/12 text-[color:var(--circle-trust)] flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-[18px] h-[18px]" />
              </span>
              <div className="min-w-0">
                <h2 className="font-bold text-[14px] text-ink dark:text-zinc-100 leading-tight">
                  مسیر ارتباط تا فروشنده
                </h2>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  این آگهی از طریق آشنایان به تو می‌رسد
                </p>
              </div>
            </div>
            <TrustPath
              posterId={listing.sellerId}
              trustPath={listing.trustPath}
              variant="full"
            />
            <button
              type="button"
              onClick={() => setPathExpanded((v) => !v)}
              className="mt-3 text-[12px] font-bold text-brand-600 dark:text-brand-400"
              aria-expanded={pathExpanded}
            >
              {pathExpanded ? "بستن جزئیات مسیر" : "جزئیات بیشتر مسیر ‹"}
            </button>
            {pathExpanded ? (
              <p className="mt-2 text-[12px] text-ink-muted leading-relaxed">
                زیر هر نفر نوشته شده چه نسبتی با نفر بعدی مسیر دارد — تا بدانی
                چرا این آگهی به تو رسیده.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="px-4 pt-3">
        <div className="card px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-[14px] text-ink dark:text-zinc-100">
                آشنایان چه می‌گویند
                {endorsementCount > 0 && !listing.identityHidden
                  ? ` · ${toPersianDigits(endorsementCount)}`
                  : ""}
              </h2>
              {listing.identityHidden || (isMine && listing.privatePublish) ? (
                <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
                  {isMine && listing.privatePublish
                    ? "تا هویت پنهان است، اسم تو روی نظر آشنایان نمی‌آید."
                    : "در حالت هویت پنهان، نظر آشنایان روی آگهی نشان داده نمی‌شود."}
                </p>
              ) : listing.endorsements.length > 0 ? (
                <div className="mt-2">
                  <EndorsementList
                    endorsements={listing.endorsements}
                    sellerName={seller?.name ?? "فروشنده"}
                    listingId={isMine ? listing.id : undefined}
                    canHide={isMine}
                  />
                </div>
              ) : (
                <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
                  هنوز کسی چیزی نگفته. اگر این را دیده‌ای یا{" "}
                  {seller?.name ?? "فروشنده"} را می‌شناسی، بنویس.
                </p>
              )}
            </div>
            {!isMine && !listing.identityHidden ? (
              <button
                type="button"
                onClick={() => setShowEndorse(true)}
                onPointerEnter={() => {
                  void import("@/components/EndorseSheet");
                }}
                className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400 py-0.5"
              >
                {myEndorsements.length > 0 ? "ویرایش ‹" : "اگر دیده‌ای، بگو ‹"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {!isMine ? (
        <section className="px-4 pt-2 pb-5">
          {!listing.privatePublish && !inactive ? (
          <button
            type="button"
            onClick={() => setShowRefer(true)}
            onPointerEnter={() => {
              void import("@/components/ReferSheet");
            }}
            className="w-full flex items-center gap-3 px-1 py-2 rounded-xl text-start active:opacity-80 transition-opacity"
          >
            <span className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <CircleUsersIcon className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-[13px] text-ink dark:text-zinc-100">
                کسی را می‌شناسی که این را بخواهد؟
              </span>
              <span className="block text-[11px] text-ink-muted mt-0.5">
                فقط برای همان یک نفر فرستاده می‌شود
              </span>
            </span>
            <span className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400 text-center leading-tight max-w-[6.25rem]">
              برای یک آشنا بفرست ‹
            </span>
          </button>
          ) : null}
          <ListingHideControl
            listingId={listing.id}
            listingTitle={displayTitle}
            hidden={listingHidden}
          />
          {!listing.identityHidden ? (
            <ListingHidePersonControl
              personId={listing.sellerId}
              hidden={sellerHidden}
              name={seller?.name ?? "فروشنده"}
            />
          ) : null}
        </section>
      ) : null}

      {isMine ? (
        <>
          <ListingOwnerPrivacy listing={listing} />
          <ListingOwnerChrome listing={listing} menuSlot={ownerMenuSlot} />
        </>
      ) : inactive ? null : (
        <ListingBuyerFooter
          listing={listing}
          ctaLabel={ctaLabel}
          prompts={buyerPrompts}
        />
      )}

      {showNote ? (
        <ListingNoteSheet
          listingId={listing.id}
          onClose={() => setShowNote(false)}
        />
      ) : null}
      {showEndorse ? (
        <EndorseSheet
          listingId={listing.id}
          listingTitle={listing.title}
          sellerName={seller?.name ?? "فروشنده"}
          myEndorsements={myEndorsements}
          onClose={() => setShowEndorse(false)}
        />
      ) : null}
      {showRefer ? (
        <ReferSheet
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowRefer(false)}
        />
      ) : null}
      {showReport ? (
        <ReportListingSheet
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowReport(false)}
        />
      ) : null}
    </main>
  );
}

function ListingOwnerPrivacy({ listing }: { listing: Listing }) {
  const getPerson = useStore((s) => s.getPerson);
  const messages = useStore((s) =>
    listing.privatePublish ? s.messages : IDLE_MESSAGES,
  );
  const revealListingIdentity = useStore((s) => s.revealListingIdentity);
  const { show } = useToast();
  const [showAudience, setShowAudience] = useState(false);
  const peers = listingThreadPeers(messages, listing.id);
  const names = (listing.excludePersonIds ?? [])
    .map((id) => getPerson(id)?.name)
    .filter(Boolean) as string[];
  const summary = listingPrivacySummary({
    privacy: listing.privacy,
    hideIdentity: Boolean(listing.privatePublish),
    excludePersonNames: names,
    excludeRelationTypes: listing.excludeRelationTypes ?? [],
  });
  const audienceLine = listingAudienceLine(listing.privacy);
  const revealed = new Set(listing.identityRevealedPeerIds ?? []);

  return (
    <section className="px-4 pt-3">
      <div className="card px-3.5 py-3.5 space-y-3">
        <div>
          <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
            حریم خصوصی این آگهی
          </p>
          <div className="mt-1.5 space-y-1">
            <button
              type="button"
              onClick={() => setShowAudience(true)}
              className="block w-full text-right text-[12px] font-semibold text-brand-600 dark:text-brand-400 leading-relaxed underline-offset-2 hover:underline"
            >
              {audienceLine}
            </button>
            {summary
              .filter((line) => line !== audienceLine)
              .map((line) => (
                <p
                  key={line}
                  className="text-[12px] text-ink-muted dark:text-zinc-400 leading-relaxed"
                >
                  {line}
                </p>
              ))}
          </div>
        </div>
        {listing.privatePublish && peers.length > 0 ? (
          <div>
            <p className="text-[12px] font-bold text-ink dark:text-zinc-200 mb-1.5">
              گفتگوها
            </p>
            <ul className="space-y-2">
              {peers.map((peerId) => {
                const person = getPerson(peerId);
                const shown = revealed.has(peerId);
                return (
                  <li
                    key={peerId}
                    className="flex items-center justify-between gap-2"
                  >
                    <Link
                      href={listingChatHref(listing, { peerId })}
                      className="min-w-0 text-[13px] font-semibold text-ink dark:text-zinc-100 truncate"
                    >
                      {person?.name ?? "عضو حلقه"}
                      <span className="block text-[11px] font-medium text-ink-faint">
                        {shown ? "هویت نمایش داده شده" : "هویت پنهان"}
                      </span>
                    </Link>
                    {!shown ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            !window.confirm(
                              `بعد از نمایش هویت، ${person?.name ?? "این نفر"} نام و تصویر تو را خواهد دید و امکان پنهان‌کردن اطلاعاتی که دیده است وجود ندارد.`,
                            )
                          ) {
                            return;
                          }
                          void revealListingIdentity(listing.id, peerId)
                            .then(() => show("هویت در این گفتگو نمایش داده شد"))
                            .catch((err) =>
                              show(
                                err instanceof ApiError
                                  ? err.message
                                  : "انجام نشد",
                              ),
                            );
                        }}
                        className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400"
                      >
                        نمایش هویت
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
      {showAudience ? (
        <ListingAudienceSheet
          privacy={listing.privacy}
          excludePersonIds={listing.excludePersonIds}
          excludeRelationTypes={listing.excludeRelationTypes}
          onClose={() => setShowAudience(false)}
        />
      ) : null}
    </section>
  );
}

function ListingHeaderActions({
  listingId,
  onReport,
  onReportIntent,
  onNote,
  onNoteIntent,
}: {
  listingId: string;
  onReport: () => void;
  onReportIntent: () => void;
  onNote: () => void;
  onNoteIntent: () => void;
}) {
  const reportsOn = useCatalog().flags.listingReports;
  const hasNote = useStore((s) => Boolean(s.listingNotes[listingId]?.trim()));
  return (
    <div className="flex items-center gap-0 overflow-visible">
      {reportsOn ? (
        <button
          type="button"
          onClick={onReport}
          onPointerEnter={onReportIntent}
          className={HEADER_ICON}
          aria-label="گزارش آگهی"
          title="گزارش آگهی"
        >
          <FlagIcon className="block h-[18px] w-[18px]" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onNote}
        onPointerEnter={onNoteIntent}
        className={HEADER_ICON}
        aria-label="یادداشت برای این آگهی"
        aria-pressed={hasNote}
        title="یادداشت برای این آگهی"
      >
        <NoteIcon className="block h-[18px] w-[18px]" />
        {hasNote ? (
          <span className="absolute end-1 top-1 size-2 rounded-full bg-red-500 ring-2 ring-[color:var(--circle-surface)] dark:bg-red-400 dark:ring-zinc-900" />
        ) : null}
      </button>
      <ListingSaveButton id={listingId} />
    </div>
  );
}

const HEADER_ICON =
  "relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-visible rounded-lg p-0 leading-none text-ink-faint hover:bg-stone-200/50 dark:hover:bg-zinc-800 transition-colors appearance-none";

function ListingHideControl({
  listingId,
  listingTitle,
  hidden,
}: {
  listingId: string;
  listingTitle: string;
  hidden: boolean;
}) {
  const toggleHiddenListing = useStore((s) => s.toggleHiddenListing);
  const { show } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function apply(nextHidden: boolean) {
    return toggleHiddenListing(listingId)
      .then(() => show(nextHidden ? hideListingCopy.toastOn : hideListingCopy.toastOff))
      .catch((err) => {
        show(err instanceof ApiError ? err.message : hideListingCopy.fail);
        throw err;
      });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (hidden) {
            void apply(false);
            return;
          }
          setConfirmOpen(true);
        }}
        onPointerEnter={() => {
          if (!hidden) void import("@/components/HideFromFeedSheet");
        }}
        className="mt-1 w-full flex items-center gap-3 px-1 py-2 rounded-xl text-start active:opacity-80 transition-opacity"
      >
        <span className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-800 text-ink-muted dark:text-zinc-400 flex items-center justify-center shrink-0">
          <EyeOffIcon className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-[13px] text-ink dark:text-zinc-100">
            {hidden ? hideListingCopy.titleHidden : hideListingCopy.title}
          </span>
          <span className="block text-[11px] text-ink-muted mt-0.5">
            {hidden ? hideListingCopy.hintHidden : hideListingCopy.hint}
          </span>
        </span>
      </button>
      {confirmOpen ? (
        <HideFromFeedSheet
          kind="listing"
          subject={listingTitle}
          title={hideConfirmListing.title}
          body={hideConfirmListing.body}
          confirmLabel={hideConfirmListing.confirm}
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            await apply(true);
            setConfirmOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function ListingHidePersonControl({
  personId,
  hidden,
  name,
}: {
  personId: string;
  hidden: boolean;
  name: string;
}) {
  const toggleHiddenPerson = useStore((s) => s.toggleHiddenPerson);
  const { show } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const copy = hidePersonCopy(name);
  const confirm = hideConfirmPerson(name);

  function apply(nextHidden: boolean) {
    return toggleHiddenPerson(personId)
      .then(() => show(nextHidden ? copy.toastOn : copy.toastOff))
      .catch((err) => {
        show(err instanceof ApiError ? err.message : hideListingCopy.fail);
        throw err;
      });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (hidden) {
            void apply(false);
            return;
          }
          setConfirmOpen(true);
        }}
        onPointerEnter={() => {
          if (!hidden) void import("@/components/HideFromFeedSheet");
        }}
        className="mt-1 w-full flex items-center gap-3 px-1 py-2 rounded-xl text-start active:opacity-80 transition-opacity"
      >
        <span className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-800 text-ink-muted dark:text-zinc-400 flex items-center justify-center shrink-0">
          <EyeOffIcon className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-[13px] text-ink dark:text-zinc-100">
            {hidden ? copy.titleHidden : copy.title}
          </span>
          <span className="block text-[11px] text-ink-muted mt-0.5">
            {hidden ? copy.hintHidden : copy.hint}
          </span>
        </span>
      </button>
      {confirmOpen ? (
        <HideFromFeedSheet
          kind="person"
          subject={name}
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirm}
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            await apply(true);
            setConfirmOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function ListingSaveButton({ id }: { id: string }) {
  const saved = useStore((s) => s.saved.includes(id));
  const hasNote = useStore((s) => Boolean(s.listingNotes[id]?.trim()));
  const toggleSaved = useStore((s) => s.toggleSaved);
  const { show } = useToast();

  return (
    <button
      type="button"
      onClick={() => {
        void toggleSaved(id).then(() =>
          show(
            saved
              ? hasNote
                ? "نشان برداشته شد؛ یادداشتت ماند"
                : "از نشان‌شده‌های پروفایل حذف شد"
              : "در پروفایل ذخیره شد ✓",
          ),
        );
      }}
      className={`${HEADER_ICON} ${
        saved
          ? "text-pink-500 bg-pink-50 dark:bg-pink-500/10"
          : ""
      }`}
      aria-label={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن"}
      aria-pressed={saved}
    >
      <HeartIcon className="block h-[18px] w-[18px] overflow-visible" filled={saved} />
    </button>
  );
}

function ListingOwnerChrome({
  listing,
  menuSlot,
}: {
  listing: Listing;
  menuSlot: HTMLElement | null;
}) {
  const router = useRouter();
  const { show } = useToast();
  const setListingDealStatus = useStore((s) => s.setListingDealStatus);
  const owner = useOwnerListingFlow(listing, {
    onDeleted: () => router.replace("/profile"),
  });
  const inactive = listing.dealStatus === "inactive";

  const menu = (
    <button
      type="button"
      onClick={owner.openMenu}
      className="inline-grid size-9 shrink-0 place-items-center appearance-none rounded-xl p-0 leading-none text-ink-faint hover:bg-stone-200/50 dark:hover:bg-zinc-800 transition-colors"
      aria-label="گزینه‌های آگهی"
      aria-haspopup="dialog"
      aria-expanded={owner.menuOpen}
      title="گزینه‌های آگهی"
    >
      <MoreIcon className="w-5 h-5" />
    </button>
  );

  return (
    <>
      {menuSlot ? createPortal(menu, menuSlot) : null}
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="app-shell pointer-events-none !min-h-0 !shadow-none bg-transparent">
          <div className="pointer-events-none border-t border-stone-200/60 dark:border-zinc-800 bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
            {inactive ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void setListingDealStatus(listing.id, "available");
                    show("آگهی دوباره در حلقه دیده می‌شود");
                  }}
                  className="btn-primary pointer-events-auto flex-1 !py-3.5 min-h-[3.25rem]"
                >
                  دوباره فعال کن
                </button>
                <button
                  type="button"
                  onClick={owner.openEdit}
                  className="btn-ghost pointer-events-auto flex-1 !py-3.5 min-h-[3.25rem]"
                >
                  ویرایش آگهی
                </button>
              </div>
            ) : listing.dealStatus === "agreed" ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void setListingDealStatus(listing.id, "inactive");
                    show("آگهی از فید حلقه برداشته شد");
                  }}
                  className="btn-primary pointer-events-auto flex-1 !py-3.5 min-h-[3.25rem]"
                >
                  از فید بردار
                </button>
                <button
                  type="button"
                  onClick={owner.openEdit}
                  className="btn-ghost pointer-events-auto flex-1 !py-3.5 min-h-[3.25rem]"
                >
                  ویرایش
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={owner.openEdit}
                className="btn-primary pointer-events-auto w-full !py-3.5 min-h-[3.25rem] flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
              >
                <PencilIcon className="w-5 h-5" />
                ویرایش آگهی
              </button>
            )}
          </div>
        </div>
      </div>
      {owner.sheets}
    </>
  );
}

function ListingBuyerFooter({
  listing,
  ctaLabel,
  prompts,
}: {
  listing: Listing;
  ctaLabel: string;
  prompts: BuyerPrompt[];
}) {
  const router = useRouter();
  const addMessage = useStore((s) => s.addMessage);
  const { show } = useToast();
  const [asking, setAsking] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const y = window.scrollY;
        const delta = y - lastScrollY.current;
        if (y < 48) setCollapsed(false);
        else if (delta > 8) setCollapsed(true);
        else if (delta < -8) setCollapsed(false);
        lastScrollY.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  async function goAsk(prompt: BuyerPrompt) {
    if (asking) return;
    setAsking(prompt.id);
    try {
      if (listing.privatePublish) {
        await addMessage("", prompt.draft, listing.id, true);
      } else {
        await addMessage(listing.sellerId, prompt.draft, listing.id);
      }
      router.push(listingChatHref(listing));
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ارسال نشد. دوباره بزن.");
      router.push(listingChatHref(listing, { draft: prompt.draft }));
    } finally {
      setAsking(null);
    }
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="app-shell pointer-events-none !min-h-0 !shadow-none bg-transparent">
        <div className="pointer-events-none border-t border-stone-200/60 dark:border-zinc-800 bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
          {prompts.length > 0 ? (
            <div
              className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-out ${
                collapsed
                  ? "max-h-0 opacity-0 mb-0 pointer-events-none"
                  : "pointer-events-auto max-h-14 opacity-100 mb-2"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[11px] font-bold text-ink-faint tracking-wide">
                  {asking ? "…" : "بپرس"}
                </span>
                <div className="min-w-0 flex-1">
                  <ListingAskPrompts
                    title="سؤال آماده"
                    compact
                    hideTitle
                    prompts={prompts}
                    onPick={goAsk}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => router.push(listingChatHref(listing))}
            className="btn-primary pointer-events-auto w-full !py-3.5 min-h-[3.25rem] flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
          >
            <ChatIcon className="w-5 h-5" />
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
