"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { lazyUi } from "@/lib/lazy-ui";
import { isActiveCircleMember } from "@/lib/circle-member";
import { canDirectMessage } from "@/lib/messaging";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import SheetShell from "@/components/SheetShell";
import TrustPath from "@/components/TrustPath";
import ListingCard from "@/components/ListingCard";
import RequestCard from "@/components/RequestCard";
import EmptyState from "@/components/EmptyState";
import { ProfileSkeleton } from "@/components/Skeleton";
import { ChatIcon, MoreIcon, UserPlusIcon } from "@/components/Icons";
import {
  formatEndorsementReport,
  isPersonAboutBadge,
  levelLabels,
  levelShort,
  relationLabels,
} from "@/lib/labels";
import {
  buildSocialCredit,
  evidenceSummaryLine,
} from "@/lib/social-credit";
import { canView, listingSellerSubtitle, viewerRelationPhrase } from "@/lib/trust";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import type {
  Listing,
  Person,
  RelationType,
  TrustHop,
  TrustLevel,
} from "@/lib/types";

const IntroRequestSheet = lazyUi(() => import("@/components/IntroRequestSheet"));
const AddToCircleSheet = lazyUi(() => import("@/components/AddToCircleSheet"));

const LEVELS: TrustLevel[] = ["A", "B", "C"];
type ContentTab = "listings" | "requests";

type EndorsementItem = {
  listing: Listing;
  endorsement: Listing["endorsements"][number];
};

export default function PersonClassic(_props: { params: { id: string } }) {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const person = useStore((s) =>
    id === "me" || (s.meServerId && id === s.meServerId)
      ? s.me
      : s.people.find((p) => p.id === id),
  );
  const getPerson = useStore((s) => s.getPerson);
  const listings = useStore((s) => s.listings);
  const requests = useStore((s) => s.requests);
  const removePerson = useStore((s) => s.removePerson);
  const setLevel = useStore((s) => s.setLevel);
  const setRelation = useStore((s) => s.setRelation);
  const addToCircle = useStore((s) => s.addToCircle);
  const threadLen = useStore(
    (s) => s.messages.filter((m) => m.peerId === id).length,
  );
  const hydrated = useStore((s) => s.hydrated);
  const { show } = useToast();
  const [showIntro, setShowIntro] = useState(false);
  const [showAddToCircle, setShowAddToCircle] = useState(false);
  const [showTrustDetails, setShowTrustDetails] = useState(false);
  const [showEditRelation, setShowEditRelation] = useState(false);
  const [contentTab, setContentTab] = useState<ContentTab>("listings");

  const theirListings = useMemo(
    () =>
      listings.filter((l) => l.sellerId === id && canView(l, getPerson)),
    [listings, id, getPerson],
  );
  const theirRequests = useMemo(
    () =>
      requests.filter(
        (r) => r.requesterId === id && canView(r, getPerson),
      ),
    [requests, id, getPerson],
  );

  const trustPath = useMemo(() => {
    const pathSource =
      theirListings.find((l) => l.trustPath.length > 0) ??
      theirRequests.find((r) => r.trustPath.length > 0);
    return pathSource?.trustPath ?? [];
  }, [theirListings, theirRequests]);

  const socialCredit = useMemo(() => {
    if (!person) return null;
    return buildSocialCredit(
      person,
      listings,
      theirListings.length + theirRequests.length,
    );
  }, [person, listings, theirListings.length, theirRequests.length]);

  const endorsementsReceived = useMemo(
    () =>
      theirListings.flatMap((l) =>
        l.endorsements
          .filter((e) => !e.hidden)
          .map((e) => ({ listing: l, endorsement: e })),
      ),
    [theirListings],
  );
  const endorsementsGiven = useMemo(
    () =>
      listings.flatMap((l) =>
        l.endorsements
          .filter((e) => e.personId === id)
          .map((e) => ({ listing: l, endorsement: e })),
      ),
    [listings, id],
  );

  const uniqueEndorserCount = useMemo(
    () =>
      new Set(endorsementsReceived.map((x) => x.endorsement.personId)).size,
    [endorsementsReceived],
  );

  const aboutPersonEndorsements = useMemo(
    () =>
      endorsementsReceived.filter((x) =>
        isPersonAboutBadge(x.endorsement.type),
      ),
    [endorsementsReceived],
  );
  const aboutListingEndorsements = useMemo(
    () =>
      endorsementsReceived.filter(
        (x) => !isPersonAboutBadge(x.endorsement.type),
      ),
    [endorsementsReceived],
  );

  if (!hydrated) {
    return (
      <main className="pb-24 min-h-[100dvh]">
        <Header title="پروفایل" back />
        <ProfileSkeleton />
      </main>
    );
  }

  if (!person || id === "me" || !socialCredit) {
    return (
      <main className="min-h-[100dvh]">
        <Header title="پروفایل" back />
        <p className="text-center text-ink-faint py-20 text-sm">کاربر پیدا نشد.</p>
      </main>
    );
  }

  const canMessage = canDirectMessage(person, threadLen > 0);
  const relationPhrase = viewerRelationPhrase(person);
  const evidenceLine = evidenceSummaryLine(socialCredit, {
    uniqueEndorsers: uniqueEndorserCount || undefined,
  });
  const showTrustPath = !isActiveCircleMember(person) || trustPath.length > 0;
  const personName = person.name;
  const hasListings = theirListings.length > 0;
  const hasRequests = theirRequests.length > 0;
  const showContentTabs = hasListings && hasRequests;
  const activeTab: ContentTab =
    showContentTabs ? contentTab : hasListings ? "listings" : "requests";

  function handleRemoveFromCircle() {
    if (
      !window.confirm(
        `${personName} از حلقه‌ات حذف می‌شود و ممکن است دیگر آگهی‌های محدود به حلقه را نبیند. به او اطلاع داده نمی‌شود.`,
      )
    ) {
      return;
    }
    removePerson(id);
    show(`${personName} از حلقه‌ات حذف شد`);
    router.push("/circle");
  }

  const metaLine = [
    person.city,
    socialCredit.lastActive ? `آخرین فعالیت ${socialCredit.lastActive}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header
        title="پروفایل"
        back
        action={
          isActiveCircleMember(person) ? (
            <button
              type="button"
              onClick={() => setShowEditRelation(true)}
              aria-label="تغییر رابطه"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-muted hover:bg-stone-200/50 dark:hover:bg-zinc-800"
            >
              <MoreIcon className="w-5 h-5" />
            </button>
          ) : undefined
        }
      />

      <div className="px-4 pt-3">
        <div className="card p-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar
              name={person.name}
              src={person.avatar}
              level={person.level}
              size="profile"
              showLevel={false}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-extrabold text-ink dark:text-zinc-100 leading-tight">
                {person.name}
              </h2>
              <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug">
                {isActiveCircleMember(person)
                  ? `${relationPhrase} · ${levelLabels[person.level]}`
                  : trustPath.length > 0
                    ? listingSellerSubtitle(person, trustPath, getPerson)
                    : `${relationPhrase} · هنوز توی حلقه‌ات نیست`}
              </p>
              {metaLine && (
                <p className="text-[11px] text-ink-faint mt-1 leading-snug">
                  {metaLine}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Activity */}
      {(hasListings || hasRequests) && (
        <section className="px-4 pt-3">
          {showContentTabs ? (
            <div
              className="flex gap-1 bg-stone-100/80 dark:bg-zinc-800 rounded-xl p-1 mb-2.5"
              role="tablist"
              aria-label={`محتوای ${person.name}`}
            >
              <TabButton
                selected={activeTab === "listings"}
                onClick={() => setContentTab("listings")}
                label="آگهی‌ها"
                count={theirListings.length}
              />
              <TabButton
                selected={activeTab === "requests"}
                onClick={() => setContentTab("requests")}
                label="درخواست‌ها"
                count={theirRequests.length}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2 px-0.5">
              <h2 className="text-[13px] font-bold text-ink dark:text-zinc-200">
                {hasListings
                  ? `آگهی‌های ${person.name}`
                  : `درخواست‌های ${person.name}`}
              </h2>
              <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted nums">
                {toPersianDigits(
                  hasListings ? theirListings.length : theirRequests.length,
                )}
              </span>
            </div>
          )}

          <div className="space-y-2" role="tabpanel">
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

      {!hasListings && !hasRequests && (
        <section className="px-4 pt-3">
          <EmptyState
            icon="📭"
            title={`${person.name} آگهی یا درخواست فعالی ندارد`}
            description={
              canMessage
                ? "مستقیم پیام بده و بپرس آیا چیزی برای فروش یا نیاز دارد."
                : "با اضافه کردن به حلقه‌ات یا درخواست معرفی، ارتباط نزدیک‌تر برقرار کن."
            }
            actionLabel={
              canMessage
                ? `پیام به ${person.name}`
                : isActiveCircleMember(person)
                  ? "درخواست معرفی"
                  : "به حلقه‌ات اضافه کن"
            }
            onAction={() => {
              if (canMessage) {
                router.push(`/messages/${id}`);
                return;
              }
              if (isActiveCircleMember(person)) {
                setShowIntro(true);
                return;
              }
              setShowAddToCircle(true);
            }}
            secondaryActionLabel={
              canMessage && !isActiveCircleMember(person) ? "به حلقه‌ات اضافه کن" : undefined
            }
            onSecondaryAction={
              canMessage && !isActiveCircleMember(person)
                ? () => setShowAddToCircle(true)
                : undefined
            }
          />
        </section>
      )}

      <section className="px-4 pt-3 pb-2">
        <div className="card px-3.5 py-3">
          <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-100">
            سابقه
          </h2>
          {evidenceLine ? (
            <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 nums leading-snug">
              {evidenceLine}
            </p>
          ) : (
            <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-snug">
              هنوز معامله یا تأییدی ثبت نشده.
            </p>
          )}
          <div className="flex items-center gap-3 mt-2.5">
            <button
              type="button"
              onClick={() => setShowTrustDetails(true)}
              className="text-[12px] font-bold text-brand-600 dark:text-brand-400"
            >
              سابقه و تأییدها ‹
            </button>
            {!isActiveCircleMember(person) ? (
              <button
                type="button"
                onClick={() => setShowAddToCircle(true)}
                className="text-[12px] font-bold text-brand-600 dark:text-brand-400"
              >
                به حلقه‌ات اضافه کن ‹
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="app-shell !min-h-0 !shadow-none bg-transparent">
          <div className="pointer-events-auto px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[color:var(--circle-bg)] via-[color:var(--circle-bg)]/95 to-transparent">
            {canMessage ? (
              <Link
                href={`/messages/${id}`}
                className="btn-primary w-full !py-2.5 !text-[14px] font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-600/15"
              >
                <ChatIcon className="w-[18px] h-[18px]" />
                پیام به {person.name}
              </Link>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddToCircle(true)}
                  className="btn-primary flex-1 !py-2.5 text-[15px] flex items-center justify-center gap-2"
                >
                  <UserPlusIcon className="w-[18px] h-[18px]" />
                  به حلقه‌ات اضافه کن
                </button>
                <button
                  type="button"
                  onClick={() => setShowIntro(true)}
                  className="btn-ghost flex-1 !py-2.5 text-sm"
                >
                  درخواست معرفی
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTrustDetails && (
        <TrustDetailsSheet
          person={person}
          socialCredit={socialCredit}
          evidenceLine={evidenceLine}
          uniqueEndorserCount={uniqueEndorserCount}
          aboutPerson={aboutPersonEndorsements}
          aboutListings={aboutListingEndorsements}
          given={endorsementsGiven}
          getPerson={getPerson}
          onClose={() => setShowTrustDetails(false)}
        />
      )}

      {showEditRelation && isActiveCircleMember(person) && (
        <EditRelationSheet
          person={person}
          personId={id}
          showTrustPath={showTrustPath}
          trustPath={trustPath}
          onClose={() => setShowEditRelation(false)}
          onSetLevel={(lvl) => {
            setLevel(id, lvl);
            show(`جایگاه ${person.name} شد ${levelShort[lvl]}`);
          }}
          onSetRelation={(rel) => {
            setRelation(id, rel);
            show(`${person.name} الان ${relationLabels[rel]} است`);
          }}
          onRemove={() => {
            setShowEditRelation(false);
            handleRemoveFromCircle();
          }}
        />
      )}

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
            show(`${person.name} به حلقه‌ات اضافه شد ✓`);
          }}
        />
      )}
    </main>
  );
}

function TabButton({
  selected,
  onClick,
  label,
  count,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5 ${
        selected
          ? "bg-[color:var(--circle-surface)] text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
          : "text-ink-muted dark:text-zinc-400"
      }`}
    >
      {label}
      <span
        className={`inline-flex min-w-[1.2rem] h-[1.15rem] px-1 items-center justify-center rounded-full text-[10px] font-extrabold nums ${
          selected
            ? "bg-stone-100 text-ink-muted dark:bg-zinc-800"
            : "bg-stone-200/70 text-ink-faint dark:bg-zinc-700"
        }`}
      >
        {toPersianDigits(count)}
      </span>
    </button>
  );
}

function TrustDetailsSheet({
  person,
  socialCredit,
  evidenceLine,
  uniqueEndorserCount,
  aboutPerson,
  aboutListings,
  given,
  getPerson,
  onClose,
}: {
  person: Person;
  socialCredit: ReturnType<typeof buildSocialCredit>;
  evidenceLine: string;
  uniqueEndorserCount: number;
  aboutPerson: EndorsementItem[];
  aboutListings: EndorsementItem[];
  given: EndorsementItem[];
  getPerson: (id: string) => Person | undefined;
  onClose: () => void;
}) {
  const titleId = useId();

  return (
    <SheetShell onClose={onClose} labelledBy={titleId} maxHeight="88dvh">
      <h2
        id={titleId}
        className="text-[16px] font-extrabold text-ink dark:text-zinc-100 mb-1"
      >
        سابقه و تأییدها
      </h2>
      <p className="text-[12px] text-ink-muted mb-4">
        سابقه و تأییدهای مربوط به {person.name} — نه احراز هویت رسمی سیرکل
      </p>

      <section className="mb-4">
        <h3 className="text-[12px] font-bold text-ink-faint mb-2">سابقه</h3>
        <div className="rounded-xl bg-stone-50 dark:bg-zinc-800/60 px-3 py-2.5 text-[13px] leading-relaxed">
          <p className="font-semibold text-ink dark:text-zinc-100 nums">
            {evidenceLine || "هنوز سابقه‌ای ثبت نشده"}
          </p>
          <p className="text-[12px] text-ink-muted mt-1">
            عضو سیرکل از {socialCredit.memberSince}
            {uniqueEndorserCount > 0 && (
              <>
                {" "}
            · {toPersianDigits(uniqueEndorserCount)} عضو حلقه تأیید
                ثبت کرده‌اند
              </>
            )}
          </p>
          <p className="text-[12px] text-ink-faint mt-1">
            پاسخ‌گویی به پیام‌ها {toPersianDigits(socialCredit.responseRate)}٪
          </p>
        </div>
      </section>

      {aboutPerson.length > 0 && (
        <EndorsementBlock
          title={`درباره ${person.name}`}
          count={aboutPerson.length}
          items={aboutPerson}
          render={(item) => {
            const endorser = getPerson(item.endorsement.personId);
            return formatEndorsementReport(item.endorsement.type, {
              endorserName: endorser?.name ?? "یکی از اعضای حلقه",
              sellerName: person.name,
              note: item.endorsement.note,
            });
          }}
          hideListingLink
        />
      )}

      {aboutListings.length > 0 && (
        <EndorsementBlock
          title={`درباره آگهی‌های ${person.name}`}
          count={aboutListings.length}
          items={aboutListings}
          render={(item) => {
            const endorser = getPerson(item.endorsement.personId);
            return formatEndorsementReport(item.endorsement.type, {
              endorserName: endorser?.name ?? "یکی از اعضای حلقه",
              sellerName: person.name,
              listingTitle: item.listing.title,
              note: item.endorsement.note,
            });
          }}
        />
      )}

      {given.length > 0 && (
        <section className="mb-2">
          <h3 className="text-[12px] font-bold text-ink-faint mb-1">
            مشارکت {person.name}
          </h3>
          <p className="text-[11px] text-ink-faint mb-2 leading-relaxed">
            {toPersianDigits(given.length)} تأیید ثبت‌شده برای دیگران — در سابقهٔ{" "}
            {person.name} حساب نمی‌شود.
          </p>
          <div className="rounded-xl border border-stone-100 dark:border-zinc-800 divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
            {given.map((item, i) => (
              <div key={`g-${i}`} className="px-3 py-2.5">
                <p className="text-[13px] text-ink-muted leading-snug">
                  {formatEndorsementReport(item.endorsement.type, {
                    endorserName: person.name,
                    sellerName:
                      getPerson(item.listing.sellerId)?.name ?? "فروشنده",
                    listingTitle: item.listing.title,
                    note: item.endorsement.note,
                  })}
                </p>
                <Link
                  href={`/listing/${item.listing.id}`}
                  className="text-[12px] text-brand-600 font-medium mt-1 block truncate"
                  onClick={onClose}
                >
                  آگهی: {item.listing.title} ‹
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {aboutPerson.length === 0 &&
        aboutListings.length === 0 &&
        given.length === 0 && (
          <p className="text-[13px] text-ink-faint py-4 text-center">
            هنوز تأییدی برای نمایش نیست.
          </p>
        )}
    </SheetShell>
  );
}

function EndorsementBlock({
  title,
  count,
  items,
  render,
  hideListingLink = false,
}: {
  title: string;
  count: number;
  items: EndorsementItem[];
  render: (item: EndorsementItem) => string;
  hideListingLink?: boolean;
}) {
  return (
    <section className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-[12px] font-bold text-ink-faint">{title}</h3>
        <span className="inline-flex min-w-[1.2rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[10px] font-extrabold text-ink-muted nums">
          {toPersianDigits(count)}
        </span>
      </div>
      <div className="rounded-xl border border-stone-100 dark:border-zinc-800 divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
        {items.map((item, i) => (
          <div key={`${title}-${i}`} className="px-3 py-2.5">
            <p className="text-[13px] text-ink dark:text-zinc-100 leading-snug">
              {render(item)}
            </p>
            {!hideListingLink && (
              <Link
                href={`/listing/${item.listing.id}`}
                className="text-[12px] text-brand-600 font-medium mt-1 block truncate"
              >
                آگهی: {item.listing.title} ‹
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const RELATIONS: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

function EditRelationSheet({
  person,
  personId,
  showTrustPath,
  trustPath,
  onClose,
  onSetLevel,
  onSetRelation,
  onRemove,
}: {
  person: Person;
  personId: string;
  showTrustPath: boolean;
  trustPath: TrustHop[];
  onClose: () => void;
  onSetLevel: (lvl: TrustLevel) => void;
  onSetRelation: (relation: RelationType) => void;
  onRemove: () => void;
}) {
  const titleId = useId();

  return (
    <SheetShell onClose={onClose} labelledBy={titleId} maxHeight="85dvh">
      <h2
        id={titleId}
        className="text-[16px] font-extrabold text-ink dark:text-zinc-100 mb-1"
      >
        تغییر رابطه
      </h2>
      <p className="text-[13px] text-ink-muted dark:text-zinc-400 mb-4 leading-relaxed">
        الان {relationLabels[person.relation]} است، در گروه {levelShort[person.level]}.
      </p>

      <p className="text-[13px] font-semibold text-ink dark:text-zinc-200 mb-2">
        {person.name} را چطور می‌شناسی؟
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {RELATIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onSetRelation(r)}
            aria-pressed={person.relation === r}
            className={`chip !px-3 !py-1.5 border ${
              person.relation === r
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200 dark:border-zinc-700"
            }`}
          >
            {relationLabels[r]}
          </button>
        ))}
      </div>

      <p className="text-[13px] font-semibold text-ink dark:text-zinc-200 mb-2">
        در کدام گروه باشد؟
      </p>
      <div className="flex gap-2 mb-4">
        {LEVELS.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onSetLevel(lvl)}
            aria-pressed={person.level === lvl}
            className={`flex-1 rounded-xl py-2.5 text-[12px] font-bold border transition-colors ${
              person.level === lvl
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-[color:var(--circle-surface)] text-ink-faint border-stone-200 dark:border-zinc-700"
            }`}
          >
            {levelShort[lvl]}
          </button>
        ))}
      </div>

      {showTrustPath && (
        <div className="mb-4">
          <TrustPath posterId={personId} trustPath={trustPath} variant="full" />
        </div>
      )}

      {!showTrustPath && (
        <Link
          href="/graph"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-[12px] text-brand-600 font-medium mb-4"
        >
          نقشه‌ی ارتباط‌ها را ببین ‹
        </Link>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="w-full text-[13px] text-red-500 dark:text-red-400 font-semibold py-3 border-t border-stone-100 dark:border-zinc-800"
      >
        حذف از حلقهٔ من
      </button>
    </SheetShell>
  );
}
