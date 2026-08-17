"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import ListingGallery from "@/components/ListingGallery";
import ListingSpecs from "@/components/ListingSpecs";
import { lazyUi } from "@/lib/lazy-ui";
import Avatar from "@/components/Avatar";
import TrustPath from "@/components/TrustPath";
import { EndorsementList } from "@/components/Endorsements";
import {
  ChatIcon,
  CircleUsersIcon,
  FlagIcon,
  HeartIcon,
  MoreIcon,
  PencilIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import {
  badgeLabels,
  formatPrice,
  listingDisplayTitle,
  listingPrivacyAudienceLine,
  listingTypeChip,
  listingTypeLabels,
} from "@/lib/labels";
import type { BadgeType, Listing } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import LockedAccess from "@/components/LockedAccess";
import { canView, listingSellerSubtitle } from "@/lib/trust";
import { useToast } from "@/components/Toast";
import ListingAskPrompts from "@/components/ListingAskPrompts";
import {
  listingBuyerPrompts,
  type BuyerPrompt,
} from "@/lib/listing-prompts";
import { listingGalleryImages } from "@/lib/listing-image";
import SheetShell from "@/components/SheetShell";
import { useOwnerListingFlow } from "@/components/OwnerListingManager";

const ReferSheet = lazyUi(() => import("@/components/ReferSheet"));
const ReportListingSheet = lazyUi(() => import("@/components/ReportListingSheet"));

const OWNER_PLACEHOLDER: Listing = {
  id: "",
  title: "",
  description: "",
  type: "sale",
  category: "",
  image: "",
  sellerId: "me",
  postedAt: "",
  privacy: "ABC",
  endorsements: [],
  trustPath: [],
};

export default function ListingClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const listing = useStore((s) => s.listings.find((row) => row.id === id));
  const ensureListing = useStore((s) => s.ensureListing);
  const getPerson = useStore((s) => s.getPerson);
  const toggleEndorsement = useStore((s) => s.toggleEndorsement);
  const toggleSaved = useStore((s) => s.toggleSaved);
  const setListingDealStatus = useStore((s) => s.setListingDealStatus);
  const saved = useStore((s) => s.saved.includes(id));
  const hydrated = useStore((s) => s.hydrated);
  const { show } = useToast();
  const [showRefer, setShowRefer] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showEndorse, setShowEndorse] = useState(false);
  const [pathExpanded, setPathExpanded] = useState(false);
  const [promptsCollapsed, setPromptsCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const [lookup, setLookup] = useState<"idle" | "loading" | "miss">("idle");
  useEffect(() => {
    if (!hydrated) return;
    if (listing && !listing.feedPreview) {
      setLookup("idle");
      return;
    }
    let cancelled = false;
    if (!listing) setLookup("loading");
    void ensureListing(id).then((row) => {
      if (cancelled) return;
      setLookup(row ? "idle" : "miss");
    });
    return () => {
      cancelled = true;
    };
  }, [ensureListing, hydrated, id, listing]);

  const isDirectTrust =
    !!listing &&
    listing.sellerId !== "me" &&
    listing.trustPath.length === 0;

  useEffect(() => {
    setPathExpanded(false);
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (y < 48) {
        setPromptsCollapsed(false);
      } else if (delta > 8) {
        setPromptsCollapsed(true);
      } else if (delta < -8) {
        setPromptsCollapsed(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const owner = useOwnerListingFlow(listing ?? OWNER_PLACEHOLDER, {
    onDeleted: () => router.replace("/profile"),
  });

  if (!hydrated || !listing) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="آگهی" back />
        <p className="text-center text-ink-faint py-20 text-sm">
          {hydrated && lookup === "miss" ? "آگهی پیدا نشد." : "در حال بارگذاری…"}
        </p>
      </main>
    );
  }

  const seller = getPerson(listing.sellerId);
  const isMine = listing.sellerId === "me";
  const inactive = listing.dealStatus === "inactive";
  const isDirect = isDirectTrust;
  const gallery = listingGalleryImages(listing);
  const displayTitle = listingDisplayTitle(listing.title, listing.type);

  const ctaLabel = (() => {
    if (listing.type === "donation") return "برای دریافت پیام بده";
    if (listing.type === "service") return "برای رزرو پیام بده";
    if (listing.type === "sale") return "دربارهٔ کالا پیام بده";
    if (seller) return `پیام به ${seller.name}`;
    return "پیام به فروشنده";
  })();

  if (!isMine && inactive) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="آگهی" back />
        <p className="text-center text-ink-faint py-20 text-sm">آگهی پیدا نشد.</p>
      </main>
    );
  }

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

  const relationLine = seller
    ? listingSellerSubtitle(seller, listing.trustPath, getPerson)
    : "";
  const buyerPrompts = listingBuyerPrompts(listing);
  const sellerId = listing.sellerId;
  const listingId = listing.id;
  const negotiable = listing.specs?.find((s) => s.label === "قابل مذاکره");
  const endorsementCount = listing.endorsements.length;
  const myEndorsements = listing.endorsements.filter((e) => e.personId === "me");
  const footerPad = isMine
    ? "pb-[5.75rem]"
    : promptsCollapsed || buyerPrompts.length === 0
      ? "pb-[5.75rem]"
      : "pb-[8.25rem]";

  function goAsk(prompt: BuyerPrompt) {
    const q = encodeURIComponent(prompt.draft);
    router.push(
      `/messages/${sellerId}?draft=${q}&listing=${encodeURIComponent(listingId)}`,
    );
  }

  return (
    <main className={`${footerPad} min-h-[100dvh]`}>
      <Header
        title="جزئیات آگهی"
        back
        action={
          <div className="flex items-center gap-0.5">
            {isMine ? (
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
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowReport(true)}
                  className="inline-grid size-9 shrink-0 place-items-center appearance-none rounded-xl p-0 leading-none text-ink-faint hover:bg-stone-200/50 dark:hover:bg-zinc-800 transition-colors"
                  aria-label="گزارش آگهی"
                  title="گزارش آگهی"
                >
                  <FlagIcon className="w-5 h-5" />
                </button>
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
                  className={`inline-grid size-9 shrink-0 place-items-center appearance-none overflow-hidden rounded-xl p-0 leading-none transition-colors ${
                    saved
                      ? "text-pink-500 bg-pink-50 dark:bg-pink-500/10"
                      : "text-ink-faint hover:bg-stone-200/50 dark:hover:bg-zinc-800"
                  }`}
                  aria-label={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن"}
                  aria-pressed={saved}
                >
                  <HeartIcon className="w-5 h-5" filled={saved} />
                </button>
              </>
            )}
          </div>
        }
      />

      <ListingGallery
        images={gallery}
        alt={listing.title}
        category={listing.category}
        type={listing.type}
      />

      <div className="px-4 -mt-4 relative listing-detail-rise">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className={`chip ${listingTypeChip[listing.type]}`}>
            {listingTypeLabels[listing.type]}
          </span>
          {listing.category && (
            <span className="chip !text-[11px] !py-0.5 bg-transparent text-ink-muted ring-1 ring-stone-200/60 dark:ring-zinc-700">
              {listing.category}
            </span>
          )}
          {listing.condition && (
            <span className="chip !text-[11px] !py-0.5 bg-transparent text-ink-muted ring-1 ring-stone-200/60 dark:ring-zinc-700">
              {listing.condition}
            </span>
          )}
          {inactive && (
            <span className="chip !text-[11px] !py-0.5 bg-stone-100 text-ink-muted dark:bg-zinc-800 dark:text-zinc-300">
              غیرفعال
            </span>
          )}
        </div>

        <h1 className="text-[1.4rem] font-extrabold text-ink dark:text-zinc-50 leading-[1.35] tracking-tight">
          {displayTitle}
        </h1>

        <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
          {listing.price != null ? (
            <span className="text-[1.4rem] font-extrabold text-ink dark:text-zinc-50 nums tracking-tight">
              {formatPrice(listing.price)}
            </span>
          ) : (
            <span className="text-lg font-bold text-levelA">
              {listing.type === "service" ? "توافقی" : "رایگان"}
            </span>
          )}
          {negotiable?.value && /بله|کمی/.test(negotiable.value) && (
            <span className="text-[12px] font-bold text-ink-muted dark:text-zinc-400">
              · قابل مذاکره
            </span>
          )}
        </div>

        <p className="text-[13.5px] text-ink-muted dark:text-zinc-300 leading-[1.8] mt-3.5 whitespace-pre-line">
          {listing.description}
        </p>

        {listing.specs && listing.specs.length > 0 ? (
          <ListingSpecs specs={listing.specs} />
        ) : null}

        <p className="mt-3.5 text-[12px] text-ink-muted dark:text-zinc-400 leading-relaxed px-0.5">
          {[listing.city, listing.postedAt].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 text-[11.5px] text-ink-faint dark:text-zinc-500 leading-relaxed px-0.5">
          {listingPrivacyAudienceLine(
            listing.privacy,
            isMine ? "تو" : seller?.name,
          )}
        </p>
        {isMine && inactive && (
          <p className="mt-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/70 px-3.5 py-2.5 text-[12.5px] text-ink-muted dark:text-zinc-300 leading-relaxed">
            این آگهی غیرفعال است — حلقه آن را در فید نمی‌بیند. در پروفایل تو
            می‌ماند.
          </p>
        )}
      </div>

      {/* Combined seller + relation for direct; separate path card for FoF */}
      {seller && !isMine && (
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
        </section>
      )}

      {/* FoF only: trust path card */}
      {!isMine && !isDirect && (
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
            {pathExpanded && (
              <p className="mt-2 text-[12px] text-ink-muted leading-relaxed">
                زیر هر نفر نوشته شده چه نسبتی با نفر بعدی مسیر دارد — تا بدانی
                چرا این آگهی به تو رسیده.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="px-4 pt-3">
        <div className="card px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-[14px] text-ink dark:text-zinc-100">
                تأیید حلقه
                {endorsementCount > 0
                  ? ` · ${toPersianDigits(endorsementCount)}`
                  : ""}
              </h2>
              {endorsementCount > 0 ? (
                <div className="mt-2">
                  <EndorsementList endorsements={listing.endorsements} />
                </div>
              ) : (
                <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
                  هنوز کسی دربارهٔ این آگهی تأییدی ثبت نکرده.
                </p>
              )}
            </div>
            {!isMine ? (
              <button
                type="button"
                onClick={() => setShowEndorse(true)}
                className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400 py-0.5"
              >
                {myEndorsements.length > 0 ? "ویرایش تأیید ‹" : "افزودن تأیید ‹"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {!isMine && (
        <section className="px-4 pt-2 pb-4">
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
                کسی را می‌شناسی که این را بخواهد؟
              </span>
              <span className="block text-[11px] text-ink-muted mt-0.5">
                فقط داخل حلقه برایش فرستاده می‌شود
              </span>
            </span>
            <span className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400 text-center leading-tight max-w-[5.5rem]">
              فرستادن برای حلقه ‹
            </span>
          </button>
        </section>
      )}

      {isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto border-t border-stone-200/60 dark:border-zinc-800 bg-[color:var(--circle-surface)]/92 dark:bg-zinc-900/92 backdrop-blur-xl px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
              {inactive ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void setListingDealStatus(listing.id, "available");
                      show("آگهی دوباره در حلقه دیده می‌شود");
                    }}
                    className="btn-primary flex-1 !py-3.5"
                  >
                    دوباره فعال کن
                  </button>
                  <button
                    type="button"
                    onClick={owner.openEdit}
                    className="btn-ghost flex-1 !py-3.5"
                  >
                    ویرایش آگهی
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={owner.openEdit}
                  className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
                >
                  <PencilIcon className="w-5 h-5" />
                  ویرایش آگهی
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!isMine && (
        <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
          <div className="app-shell !min-h-0 !shadow-none bg-transparent">
            <div className="pointer-events-auto border-t border-stone-200/60 dark:border-zinc-800 bg-[color:var(--circle-surface)]/92 dark:bg-zinc-900/92 backdrop-blur-xl px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
              {buyerPrompts.length > 0 && (
                <div
                  className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-out ${
                    promptsCollapsed
                      ? "max-h-0 opacity-0 mb-0"
                      : "max-h-14 opacity-100 mb-2"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-[10px] font-bold text-ink-faint tracking-wide">
                      بپرس
                    </span>
                    <div className="min-w-0 flex-1">
                      <ListingAskPrompts
                        title="سؤال آماده"
                        compact
                        hideTitle
                        prompts={buyerPrompts}
                        onPick={goAsk}
                      />
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/messages/${listing.sellerId}?listing=${encodeURIComponent(listing.id)}`,
                  )
                }
                className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
              >
                <ChatIcon className="w-5 h-5" />
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEndorse && (
        <EndorseSheet
          sellerName={seller?.name ?? "فروشنده"}
          activeTypes={myEndorsements.map((e) => e.type)}
          onToggle={(type) => {
            const active = myEndorsements.some((e) => e.type === type);
            if (active) {
              toggleEndorsement(listing.id, type);
              return;
            }
            const needsConfirm =
              type === "verify_item" || type === "verify_quality";
            if (
              needsConfirm &&
              !window.confirm("آیا این را از نزدیک دیده‌اید؟")
            ) {
              return;
            }
            toggleEndorsement(listing.id, type);
          }}
          onClose={() => setShowEndorse(false)}
        />
      )}
      {showRefer && (
        <ReferSheet
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowRefer(false)}
        />
      )}
      {showReport && (
        <ReportListingSheet
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowReport(false)}
        />
      )}
      {isMine ? owner.sheets : null}
    </main>
  );
}

const ITEM_BADGES: BadgeType[] = ["verify_item", "verify_quality"];
const PERSON_BADGES: BadgeType[] = ["know_seller", "dealt_before"];

function EndorseSheet({
  sellerName,
  activeTypes,
  onToggle,
  onClose,
}: {
  sellerName: string;
  activeTypes: BadgeType[];
  onToggle: (type: BadgeType) => void;
  onClose: () => void;
}) {
  return (
    <SheetShell
      onClose={onClose}
      labelledBy="endorse-sheet-title"
      zClass="z-50"
      footer={
        <button type="button" onClick={onClose} className="btn-ghost w-full !py-3.5">
          تمام
        </button>
      }
    >
      <h2
        id="endorse-sheet-title"
        className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50"
      >
        افزودن تأیید
      </h2>
      <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
        حرف توست، نه مهر سیرکل. فقط حلقه می‌بیند.
      </p>

      <p className="mt-4 mb-1.5 text-[11px] font-bold text-ink-faint">
        دربارهٔ کالا
      </p>
      <div className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden">
        {ITEM_BADGES.map((type, i) => (
          <EndorseOption
            key={type}
            type={type}
            active={activeTypes.includes(type)}
            onToggle={() => onToggle(type)}
            divider={i < ITEM_BADGES.length - 1}
          />
        ))}
      </div>

      <p className="mt-3.5 mb-1.5 text-[11px] font-bold text-ink-faint">
        دربارهٔ {sellerName}
      </p>
      <div className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden">
        {PERSON_BADGES.map((type, i) => (
          <EndorseOption
            key={type}
            type={type}
            active={activeTypes.includes(type)}
            onToggle={() => onToggle(type)}
            divider={i < PERSON_BADGES.length - 1}
          />
        ))}
      </div>
    </SheetShell>
  );
}

function EndorseOption({
  type,
  active,
  onToggle,
  divider,
}: {
  type: BadgeType;
  active: boolean;
  onToggle: () => void;
  divider: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`w-full flex items-center gap-3 px-3.5 py-3 text-right active:bg-stone-50 dark:active:bg-zinc-800/80 ${
        divider ? "border-b border-stone-100 dark:border-zinc-800" : ""
      }`}
    >
      <span
        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
          active
            ? "bg-[color:var(--circle-trust)] border-[color:var(--circle-trust)] text-white"
            : "border-stone-300 dark:border-zinc-600"
        }`}
      >
        {active ? "✓" : ""}
      </span>
      <span className="text-[13.5px] font-semibold text-ink dark:text-zinc-100">
        {badgeLabels[type]}
      </span>
    </button>
  );
}
