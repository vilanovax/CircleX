"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import IntroRequestSheet from "@/components/IntroRequestSheet";
import AddToCircleSheet from "@/components/AddToCircleSheet";
import { canDirectMessage } from "@/lib/messaging";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import SocialCreditCard from "@/components/SocialCreditCard";
import TrustPath from "@/components/TrustPath";
import ListingCard from "@/components/ListingCard";
import RequestCard from "@/components/RequestCard";
import EmptyState from "@/components/EmptyState";
import { ProfileSkeleton } from "@/components/Skeleton";
import { ChatIcon, ShieldCheckIcon, UserPlusIcon } from "@/components/Icons";
import {
  badgeEmoji,
  badgeLabels,
  levelChip,
  levelShort,
  relationEmoji,
  relationLabels,
} from "@/lib/labels";
import { buildSocialCredit } from "@/lib/social-credit";
import { canView } from "@/lib/trust";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import type {
  BadgeType,
  Endorsement,
  Listing,
  Person,
  TrustHop,
  TrustLevel,
} from "@/lib/types";

const LEVELS: TrustLevel[] = ["A", "B", "C"];
const ENDORSE_BADGES: BadgeType[] = [
  "know_seller",
  "verify_quality",
  "verify_item",
  "dealt_before",
];
type ContentTab = "listings" | "requests";

export default function PersonClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const {
    getPerson,
    listings,
    requests,
    removePerson,
    setLevel,
    addToCircle,
    getThread,
    toggleEndorsement,
    hydrated,
  } = useStore();
  const { show } = useToast();
  const [showIntro, setShowIntro] = useState(false);
  const [showAddToCircle, setShowAddToCircle] = useState(false);
  const [contentTab, setContentTab] = useState<ContentTab>("listings");

  const person = getPerson(id);

  if (!hydrated) {
    return (
      <main className="pb-28 min-h-[100dvh]">
        <Header title="پروفایل اعتماد" back />
        <ProfileSkeleton />
      </main>
    );
  }

  if (!person || id === "me") {
    return (
      <main className="min-h-[100dvh]">
        <Header title="پروفایل" back />
        <p className="text-center text-zinc-400 py-20 text-sm">کاربر پیدا نشد.</p>
      </main>
    );
  }

  const thread = getThread(id);
  const canMessage = canDirectMessage(person, thread.length > 0);

  const theirListings = listings.filter(
    (l) => l.sellerId === id && canView(l, getPerson),
  );
  const theirRequests = requests.filter(
    (r) => r.requesterId === id && canView(r, getPerson),
  );

  const pathSource =
    theirListings.find((l) => l.trustPath.length > 0) ??
    theirRequests.find((r) => r.trustPath.length > 0);
  const trustPath = pathSource?.trustPath ?? [];

  const networkActivity = theirListings.length + theirRequests.length;
  const socialCredit = buildSocialCredit(person, listings, networkActivity);

  const endorsementsReceived = theirListings.flatMap((l) =>
    l.endorsements.map((e) => ({ listing: l, endorsement: e })),
  );
  const endorsementsGiven = listings.flatMap((l) =>
    l.endorsements
      .filter((e) => e.personId === id)
      .map((e) => ({ listing: l, endorsement: e })),
  );

  const endorserIds = Array.from(
    new Set(endorsementsReceived.map((x) => x.endorsement.personId)),
  );

  const activityParts: string[] = [
    `${toPersianDigits(socialCredit.score)} اعتبار`,
  ];
  if (theirListings.length > 0) {
    activityParts.push(`${toPersianDigits(theirListings.length)} آگهی`);
  }
  if (theirRequests.length > 0) {
    activityParts.push(`${toPersianDigits(theirRequests.length)} درخواست`);
  }

  const showTrustPath = !person.inMyCircle || trustPath.length > 0;
  const personName = person.name;
  const hasListings = theirListings.length > 0;
  const hasRequests = theirRequests.length > 0;
  const showContentTabs = hasListings && hasRequests;
  const activeTab: ContentTab =
    showContentTabs ? contentTab : hasListings ? "listings" : "requests";

  const unendorsedListings = theirListings.filter(
    (l) => !l.endorsements.some((e) => e.personId === "me"),
  );

  function handleRemoveFromCircle() {
    if (
      !window.confirm(
        `${personName} از حلقه‌ی شما حذف شود؟ دسترسی مستقیم به پیام بسته می‌شود.`,
      )
    ) {
      return;
    }
    removePerson(id);
    show(`${personName} از حلقه حذف شد`);
    router.push("/circle");
  }

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header title="پروفایل اعتماد" back />

      <div className="px-4 pt-4">
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <Avatar name={person.name} level={person.level} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {person.name}
                </h2>
                <span className={`chip ${levelChip[person.level]}`}>
                  {levelShort[person.level]}
                </span>
                {socialCredit.verified && (
                  <span className="chip bg-green-50 text-levelA dark:bg-green-500/15 text-[10px]">
                    <ShieldCheckIcon className="w-3 h-3" /> {socialCredit.verifiedLabel}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {relationEmoji[person.relation]} {relationLabels[person.relation]}
                {person.city && (
                  <span className="text-zinc-400"> · 📍 {person.city}</span>
                )}
              </p>
              {person.note && (
                <p className="text-xs text-zinc-400 mt-1">{person.note}</p>
              )}
              <p className="text-xs font-medium text-brand-700 dark:text-brand-300 mt-1.5 nums">
                {activityParts.join(" · ")}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                عضو از {socialCredit.memberSince} · {socialCredit.lastActive}
              </p>
            </div>
          </div>
        </div>
      </div>

      {(hasListings || hasRequests) && (
        <section className="px-4 pt-4">
          {showContentTabs ? (
            <div
              className="flex gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1.5 mb-3"
              role="tablist"
              aria-label={`محتوای ${person.name}`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "listings"}
                aria-pressed={activeTab === "listings"}
                onClick={() => setContentTab("listings")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors nums ${
                  activeTab === "listings"
                    ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                    : "text-zinc-500 dark:text-zinc-300"
                }`}
              >
                آگهی‌ها ({toPersianDigits(theirListings.length)})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "requests"}
                aria-pressed={activeTab === "requests"}
                onClick={() => setContentTab("requests")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors nums ${
                  activeTab === "requests"
                    ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                    : "text-zinc-500 dark:text-zinc-300"
                }`}
              >
                درخواست‌ها ({toPersianDigits(theirRequests.length)})
              </button>
            </div>
          ) : (
            <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mb-2">
              {hasListings
                ? `آگهی‌های ${person.name}`
                : `درخواست‌های ${person.name}`}
            </h2>
          )}

          <div className="space-y-3" role="tabpanel">
            {activeTab === "listings" &&
              theirListings.map((l) => (
                <ListingCard key={l.id} listing={l} hideTrust />
              ))}
            {activeTab === "requests" &&
              theirRequests.map((r) => (
                <RequestCard key={r.id} request={r} hideTrust />
              ))}
          </div>
        </section>
      )}

      {unendorsedListings.length > 0 && (
        <section className="px-4 pt-4">
          <EndorsePrompt
            personName={person.name}
            listings={unendorsedListings}
            onEndorse={(listingId, type) => {
              toggleEndorsement(listingId, type);
              show("تأیید شما ثبت شد ✓");
            }}
          />
        </section>
      )}

      <div className="px-4 pt-4">
        <SocialCreditCard
          stats={socialCredit}
          subtitle={`شاخص اعتماد ${person.name} در شبکه`}
          circleLabel="فعالیت در شبکه"
          hideVerified
          collapsible
          defaultCollapsed={person.inMyCircle}
        />
      </div>

      {(endorsementsReceived.length > 0 || endorsementsGiven.length > 0) && (
        <section className="px-4 pt-5">
          <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mb-2">
            تأییدهای اجتماعی
          </h2>
          <div className="space-y-3">
            {endorsementsReceived.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2">
                  تأیید دریافتی ({toPersianDigits(endorsementsReceived.length)})
                </p>
                <div className="space-y-2">
                  {endorsementsReceived.map(({ listing, endorsement }, i) => {
                    const endorser = getPerson(endorsement.personId);
                    return (
                      <EndorsementRow
                        key={`r-${i}`}
                        listing={listing}
                        endorsement={endorsement}
                        headline={
                          <>
                            {endorser && endorser.id !== "me" ? (
                              <Link
                                href={`/person/${endorser.id}`}
                                className="font-semibold text-zinc-800 dark:text-zinc-100 hover:text-brand-600"
                              >
                                {endorser.name}
                              </Link>
                            ) : (
                              <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                                {endorser?.name ?? "—"}
                              </span>
                            )}
                            <span className="text-zinc-400 font-normal">
                              {" "}
                              — {badgeLabels[endorsement.type]}
                            </span>
                          </>
                        }
                      />
                    );
                  })}
                </div>
              </div>
            )}
            {endorsementsGiven.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2">
                  تأیید داده‌شده ({toPersianDigits(endorsementsGiven.length)})
                </p>
                <div className="space-y-2">
                  {endorsementsGiven.map(({ listing, endorsement }, i) => (
                    <EndorsementRow
                      key={`g-${i}`}
                      listing={listing}
                      endorsement={endorsement}
                      headline={
                        <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                          {badgeLabels[endorsement.type]}
                        </span>
                      }
                    />
                  ))}
                </div>
              </div>
            )}
            {endorserIds.length > 0 && (
              <p className="text-[11px] text-zinc-400 px-1">
                {toPersianDigits(endorserIds.length)} نفر از شبکه‌ی شما آگهی‌های{" "}
                {person.name} را تأیید کرده‌اند.
              </p>
            )}
          </div>
        </section>
      )}

      {!hasListings && !hasRequests && (
        <section className="px-4 pt-4">
          <EmptyState
            icon="📭"
            title={`${person.name} آگهی یا درخواست فعالی ندارد`}
            description={
              canMessage
                ? "می‌توانید مستقیم پیام بدهید و بپرسید آیا چیزی برای فروش یا نیاز دارد."
                : "با افزودن به حلقه یا درخواست معرفی، ارتباط نزدیک‌تر برقرار کنید."
            }
            actionLabel={
              canMessage
                ? `پیام به ${person.name}`
                : person.inMyCircle
                  ? "درخواست معرفی"
                  : "افزودن به حلقه"
            }
            onAction={() => {
              if (canMessage) {
                router.push(`/messages/${id}`);
                return;
              }
              if (person.inMyCircle) {
                setShowIntro(true);
                return;
              }
              setShowAddToCircle(true);
            }}
            secondaryActionLabel={
              canMessage && !person.inMyCircle ? "افزودن به حلقه" : undefined
            }
            onSecondaryAction={
              canMessage && !person.inMyCircle
                ? () => setShowAddToCircle(true)
                : undefined
            }
          />
        </section>
      )}

      <CircleSection
        person={person}
        personId={id}
        showTrustPath={showTrustPath}
        trustPath={trustPath}
        onAddToCircle={() => setShowAddToCircle(true)}
        onRemoveFromCircle={handleRemoveFromCircle}
        onSetLevel={(lvl) => {
          setLevel(id, lvl);
          show(`سطح ${person.name} به ${levelShort[lvl]} تغییر کرد`);
        }}
      />

      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="app-shell !min-h-0 !shadow-none bg-transparent">
          <div className="pointer-events-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-zinc-100 dark:border-zinc-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {canMessage ? (
              <Link
                href={`/messages/${id}`}
                className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-2"
              >
                <ChatIcon className="w-5 h-5" />
                پیام به {person.name}
              </Link>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddToCircle(true)}
                  className="btn-primary flex-1 !py-3.5 text-base flex items-center justify-center gap-2"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  افزودن به حلقه
                </button>
                <button
                  type="button"
                  onClick={() => setShowIntro(true)}
                  className="btn-ghost flex-1 !py-3.5 text-sm"
                >
                  درخواست معرفی
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showIntro && (
        <IntroRequestSheet
          itemTitle={person.name}
          itemKind="person"
          onClose={() => setShowIntro(false)}
        />
      )}

      {showAddToCircle && (
        <AddToCircleSheet
          person={person}
          onClose={() => setShowAddToCircle(false)}
          onAdd={(input) => {
            addToCircle(id, input);
            setShowAddToCircle(false);
            show(`${person.name} به حلقه‌ی شما اضافه شد ✓`);
          }}
        />
      )}
    </main>
  );
}

function CircleSection({
  person,
  personId,
  showTrustPath,
  trustPath,
  onAddToCircle,
  onRemoveFromCircle,
  onSetLevel,
}: {
  person: Person;
  personId: string;
  showTrustPath: boolean;
  trustPath: TrustHop[];
  onAddToCircle: () => void;
  onRemoveFromCircle: () => void;
  onSetLevel: (lvl: TrustLevel) => void;
}) {
  return (
    <section className="px-4 pt-5 pb-2">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base" aria-hidden>
            👥
          </span>
          <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
            {person.inMyCircle ? "حلقه‌ی شما" : `ارتباط با ${person.name}`}
          </h2>
        </div>

        {person.inMyCircle ? (
          <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 rounded-lg px-3 py-2 mb-3">
            عضو مستقیم حلقه — پیام مستقیم ✓
          </p>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 mb-3">
            از مسیر اعتماد وصل است؛ هنوز در حلقه‌ی مستقیم نیست.
          </p>
        )}

        {person.inMyCircle && (
          <>
            <p className="text-xs text-zinc-400 mb-2">سطح اعتماد</p>
            <div className="flex gap-2 mb-3">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onSetLevel(lvl)}
                  aria-pressed={person.level === lvl}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold border transition-colors ${
                    person.level === lvl
                      ? `${levelChip[lvl]} border-current`
                      : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  {levelShort[lvl]}
                </button>
              ))}
            </div>
          </>
        )}

        {showTrustPath && (
          <TrustPath
            posterId={personId}
            trustPath={trustPath}
            variant="full"
            posterRole={relationLabels[person.relation]}
            viewerRole="شما"
          />
        )}

        {person.inMyCircle && !showTrustPath && (
          <Link
            href="/graph"
            className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium"
          >
            نقشه‌ی کامل حلقه را ببین ‹
          </Link>
        )}

        {!person.inMyCircle && (
          <button
            type="button"
            onClick={onAddToCircle}
            className="btn-primary mt-3 w-full !py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            افزودن به حلقه
          </button>
        )}

        {person.inMyCircle && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-left">
            <button
              type="button"
              onClick={onRemoveFromCircle}
              className="text-xs text-red-500 dark:text-red-400 font-medium active:opacity-70"
            >
              حذف از حلقه
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function EndorsePrompt({
  personName,
  listings,
  onEndorse,
}: {
  personName: string;
  listings: Listing[];
  onEndorse: (listingId: string, type: BadgeType) => void;
}) {
  const visible = listings.slice(0, 3);

  return (
    <div className="card p-4 border-brand-100 dark:border-brand-500/20 bg-brand-50/30 dark:bg-brand-500/5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheckIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
          تأیید آگهی‌های {personName}
        </h2>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
        اگر این آگهی‌ها را می‌شناسید یا کیفیتشان را تأیید می‌کنید، نشان خود را
        اضافه کنید.
      </p>
      <div className="space-y-3">
        {visible.map((listing) => (
          <div
            key={listing.id}
            className="rounded-xl bg-white/90 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 p-3"
          >
            <Link
              href={`/listing/${listing.id}`}
              className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 line-clamp-2 active:opacity-80"
            >
              {listing.title}
            </Link>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ENDORSE_BADGES.map((b) => {
                const active = listing.endorsements.some(
                  (e) => e.personId === "me" && e.type === b,
                );
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onEndorse(listing.id, b)}
                    className={`chip !px-2.5 !py-1 border text-[11px] transition-colors ${
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
        ))}
      </div>
      {listings.length > 3 && (
        <p className="text-[11px] text-zinc-400 mt-2 text-center">
          {toPersianDigits(listings.length - 3)} آگهی دیگر در تب آگهی‌ها
        </p>
      )}
    </div>
  );
}

function EndorsementRow({
  listing,
  endorsement,
  headline,
}: {
  listing: Listing;
  endorsement: Endorsement;
  headline: React.ReactNode;
}) {
  return (
    <div className="card p-3 active:scale-[0.99] transition-transform">
      <div className="flex items-start gap-2.5">
        <span className="text-lg shrink-0" aria-hidden>
          {badgeEmoji[endorsement.type]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">{headline}</p>
          <Link
            href={`/listing/${listing.id}`}
            className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-1 block truncate"
          >
            آگهی: {listing.title} ‹
          </Link>
        </div>
      </div>
    </div>
  );
}
