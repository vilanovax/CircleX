"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useStore } from "@/lib/store";
import { lazyUi } from "@/lib/lazy-ui";
import { canDirectMessage } from "@/lib/messaging";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import SheetShell from "@/components/SheetShell";
import TrustPath from "@/components/TrustPath";
import ListingCard from "@/components/ListingCard";
import RequestCard from "@/components/RequestCard";
import EmptyState from "@/components/EmptyState";
import { ProfileSkeleton } from "@/components/Skeleton";
import { ChatIcon, UserPlusIcon } from "@/components/Icons";
import {
  formatEndorsementReport,
  isPersonAboutBadge,
  levelChip,
  levelShort,
  relationLabels,
} from "@/lib/labels";
import {
  buildSocialCredit,
  evidenceSummaryLine,
} from "@/lib/social-credit";
import { canView, viewerRelationPhrase } from "@/lib/trust";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import type {
  Listing,
  Person,
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
  const {
    getPerson,
    listings,
    requests,
    removePerson,
    setLevel,
    addToCircle,
    getThread,
    hydrated,
  } = useStore();
  const { show } = useToast();
  const [showIntro, setShowIntro] = useState(false);
  const [showAddToCircle, setShowAddToCircle] = useState(false);
  const [showTrustDetails, setShowTrustDetails] = useState(false);
  const [showEditRelation, setShowEditRelation] = useState(false);
  const [contentTab, setContentTab] = useState<ContentTab>("listings");

  const person = getPerson(id);

  if (!hydrated) {
    return (
      <main className="pb-24 min-h-[100dvh]">
        <Header title="پروفایل" back />
        <ProfileSkeleton />
      </main>
    );
  }

  if (!person || id === "me") {
    return (
      <main className="min-h-[100dvh]">
        <Header title="پروفایل" back />
        <p className="text-center text-ink-faint py-20 text-sm">کاربر پیدا نشد.</p>
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

  const endorsementsReceived: EndorsementItem[] = theirListings.flatMap((l) =>
    l.endorsements.map((e) => ({ listing: l, endorsement: e })),
  );
  const endorsementsGiven: EndorsementItem[] = listings.flatMap((l) =>
    l.endorsements
      .filter((e) => e.personId === id)
      .map((e) => ({ listing: l, endorsement: e })),
  );

  const uniqueEndorsers = Array.from(
    new Set(endorsementsReceived.map((x) => x.endorsement.personId)),
  );

  const relationPhrase = viewerRelationPhrase(person);
  const evidenceLine = evidenceSummaryLine(socialCredit, {
    uniqueEndorsers: uniqueEndorsers.length || undefined,
  });
  const aboutPersonEndorsements = endorsementsReceived.filter((x) =>
    isPersonAboutBadge(x.endorsement.type),
  );
  const aboutListingEndorsements = endorsementsReceived.filter(
    (x) => !isPersonAboutBadge(x.endorsement.type),
  );
  const showTrustPath = !person.inMyCircle || trustPath.length > 0;
  const personName = person.name;
  const hasListings = theirListings.length > 0;
  const hasRequests = theirRequests.length > 0;
  const showContentTabs = hasListings && hasRequests;
  const activeTab: ContentTab =
    showContentTabs ? contentTab : hasListings ? "listings" : "requests";

  function handleRemoveFromCircle() {
    if (
      !window.confirm(
        `${personName} از حلقه‌های شما حذف می‌شود و ممکن است دیگر آگهی‌های محدود به حلقه را نبینید. به او اطلاع داده نمی‌شود.`,
      )
    ) {
      return;
    }
    removePerson(id);
    show(`${personName} از شبکه شما حذف شد`);
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
      <Header title={`پروفایل ${person.name}`} back />

      {/* 1. Compact intro */}
      <div className="px-4 pt-3">
        <div className="card p-3.5">
          <div className="flex items-center gap-3">
            <Avatar
              name={person.name}
              src={person.avatar}
              level={person.level}
              size="md"
              showLevel={false}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-extrabold text-ink dark:text-zinc-100 leading-tight">
                {person.name}
              </h2>
              <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug">
                {relationPhrase}
                {person.inMyCircle ? " · عضو مستقیم شبکه" : ""}
              </p>
              {metaLine && (
                <p className="text-[11px] text-ink-faint mt-1 leading-snug">
                  {metaLine}
                </p>
              )}
              {evidenceLine && (
                <p className="text-[12px] font-semibold text-ink dark:text-zinc-200 mt-1.5 nums leading-snug">
                  {evidenceLine}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Activity */}
      {(hasListings || hasRequests) && (
        <section className="px-4 pt-3.5">
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
                label="نیازمندی‌ها"
                count={theirRequests.length}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2 px-0.5">
              <h2 className="text-[13px] font-bold text-ink dark:text-zinc-200">
                {hasListings
                  ? `آگهی‌های ${person.name}`
                  : `نیازمندی‌های ${person.name}`}
              </h2>
              <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted nums">
                {toPersianDigits(
                  hasListings ? theirListings.length : theirRequests.length,
                )}
              </span>
            </div>
          )}

          <div className="space-y-2.5" role="tabpanel">
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
            title={`${person.name} آگهی یا نیازمندی فعالی ندارد`}
            description={
              canMessage
                ? "می‌توانید مستقیم پیام بدهید و بپرسید آیا چیزی برای فروش یا نیاز دارد."
                : "با افزودن به شبکه یا درخواست معرفی، ارتباط نزدیک‌تر برقرار کنید."
            }
            actionLabel={
              canMessage
                ? `پیام به ${person.name}`
                : person.inMyCircle
                  ? "درخواست معرفی"
                  : "افزودن به شبکه"
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
              canMessage && !person.inMyCircle ? "افزودن به شبکه" : undefined
            }
            onSecondaryAction={
              canMessage && !person.inMyCircle
                ? () => setShowAddToCircle(true)
                : undefined
            }
          />
        </section>
      )}

      {/* 3. Single trust + relation summary */}
      <section className="px-4 pt-3.5 pb-2">
        <div className="card p-3.5">
          <button
            type="button"
            onClick={() => setShowTrustDetails(true)}
            className="w-full text-right active:opacity-80"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-100">
                اعتماد و رابطه
              </h2>
              <span className="text-ink-faint text-sm leading-none mt-0.5" aria-hidden>
                ‹
              </span>
            </div>
            <p className="text-[12px] text-ink-muted dark:text-zinc-400 leading-snug">
              {relationPhrase}
              {person.inMyCircle
                ? ` · حلقه ${relationLabels[person.relation]}`
                : " · هنوز عضو مستقیم شبکه نیست"}
            </p>
            {uniqueEndorsers.length > 0 && (
              <p className="text-[11px] text-ink-faint mt-1.5 nums leading-snug">
                {toPersianDigits(endorsementsReceived.length)} تأیید از{" "}
                {toPersianDigits(uniqueEndorsers.length)} عضو شبکه
              </p>
            )}
          </button>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setShowTrustDetails(true)}
              className="flex-1 rounded-xl border border-stone-200 dark:border-zinc-700 py-2 text-[12px] font-bold text-ink dark:text-zinc-100 active:bg-stone-50 dark:active:bg-zinc-800"
            >
              جزئیات اعتماد
            </button>
            {person.inMyCircle ? (
              <button
                type="button"
                onClick={() => setShowEditRelation(true)}
                className="flex-1 rounded-xl border border-stone-200 dark:border-zinc-700 py-2 text-[12px] font-bold text-ink dark:text-zinc-100 active:bg-stone-50 dark:active:bg-zinc-800"
              >
                ویرایش رابطه
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddToCircle(true)}
                className="flex-1 rounded-xl bg-brand-600 text-white py-2 text-[12px] font-bold active:opacity-90"
              >
                افزودن به شبکه
              </button>
            )}
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
                  افزودن به شبکه
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
          uniqueEndorserCount={uniqueEndorsers.length}
          aboutPerson={aboutPersonEndorsements}
          aboutListings={aboutListingEndorsements}
          given={endorsementsGiven}
          getPerson={getPerson}
          onClose={() => setShowTrustDetails(false)}
        />
      )}

      {showEditRelation && person.inMyCircle && (
        <EditRelationSheet
          person={person}
          personId={id}
          relationPhrase={relationPhrase}
          showTrustPath={showTrustPath}
          trustPath={trustPath}
          onClose={() => setShowEditRelation(false)}
          onSetLevel={(lvl) => {
            setLevel(id, lvl);
            show(`جایگاه ${person.name}: ${levelShort[lvl]}`);
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
            show(`${person.name} به شبکه شما اضافه شد ✓`);
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
        جزئیات اعتماد
      </h2>
      <p className="text-[12px] text-ink-muted mb-4">
        شواهد مربوط به {person.name} — نه احراز هویت رسمی سیرکل
      </p>

      <section className="mb-4">
        <h3 className="text-[12px] font-bold text-ink-faint mb-2">سابقه</h3>
        <div className="rounded-xl bg-stone-50 dark:bg-zinc-800/60 px-3 py-2.5 text-[13px] leading-relaxed">
          <p className="font-semibold text-ink dark:text-zinc-100 nums">
            {evidenceLine || "هنوز سابقهٔ قابل‌نمایش نیست"}
          </p>
          <p className="text-[12px] text-ink-muted mt-1">
            عضو سیرکل از {socialCredit.memberSince}
            {uniqueEndorserCount > 0 && (
              <>
                {" "}
                · {toPersianDigits(uniqueEndorserCount)} عضو مستقل تأیید
                کرده‌اند
              </>
            )}
          </p>
          <p className="text-[12px] text-ink-faint mt-1">
            نرخ پاسخ‌گویی {toPersianDigits(socialCredit.responseRate)}٪
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
              endorserName: endorser?.name ?? "یکی از اعضای شبکه",
              sellerName: person.name,
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
              endorserName: endorser?.name ?? "یکی از اعضای شبکه",
              sellerName: person.name,
              listingTitle: item.listing.title,
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
            {toPersianDigits(given.length)} تأیید ثبت‌شده برای دیگران — در اعتبار{" "}
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
            هنوز تأیید شبکه‌ای برای نمایش نیست.
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

function EditRelationSheet({
  person,
  personId,
  relationPhrase,
  showTrustPath,
  trustPath,
  onClose,
  onSetLevel,
  onRemove,
}: {
  person: Person;
  personId: string;
  relationPhrase: string;
  showTrustPath: boolean;
  trustPath: TrustHop[];
  onClose: () => void;
  onSetLevel: (lvl: TrustLevel) => void;
  onRemove: () => void;
}) {
  const titleId = useId();

  return (
    <SheetShell onClose={onClose} labelledBy={titleId} maxHeight="85dvh">
      <h2
        id={titleId}
        className="text-[16px] font-extrabold text-ink dark:text-zinc-100 mb-1"
      >
        ویرایش رابطه
      </h2>
      <p className="text-[12px] text-ink-muted mb-4 leading-relaxed">
        {relationPhrase} · حلقه {relationLabels[person.relation]}
      </p>

      <p className="text-[11px] text-ink-faint mb-2">جایگاه در حلقه شخصی شما</p>
      <div className="flex gap-2 mb-4">
        {LEVELS.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onSetLevel(lvl)}
            aria-pressed={person.level === lvl}
            className={`flex-1 rounded-xl py-2.5 text-[12px] font-bold border transition-colors ${
              person.level === lvl
                ? `${levelChip[lvl]} border-current`
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
          نقشه‌ی کامل شبکه را ببین ‹
        </Link>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="w-full text-[13px] text-red-500 dark:text-red-400 font-semibold py-3 border-t border-stone-100 dark:border-zinc-800"
      >
        حذف از شبکه من
      </button>
    </SheetShell>
  );
}
