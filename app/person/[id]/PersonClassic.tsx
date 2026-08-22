"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { startTransition, useId, useMemo, useState } from "react";
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
  endorsementClaimAfterName,
  levelLabels,
  levelShort,
  listingDisplayTitle,
  relationLabels,
} from "@/lib/labels";
import {
  buildSocialCredit,
  evidenceSummaryLine,
} from "@/lib/social-credit";
import { canView, listingSellerSubtitle, viewerRelationPhrase } from "@/lib/trust";
import { toPersianDigits } from "@/lib/persian";
import { hasPeerThread } from "@/lib/thread-listing";
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

const EMPTY_ENDORSEMENTS: EndorsementItem[] = [];

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
  const hasThread = useStore((s) => hasPeerThread(s.messages, id));
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
      theirListings,
      theirListings.length + theirRequests.length,
    );
  }, [person, theirListings, theirRequests.length]);

  const uniqueEndorserCount = useMemo(() => {
    const ids = new Set<string>();
    for (const listing of theirListings) {
      for (const e of listing.endorsements) {
        if (!e.hidden) ids.add(e.personId);
      }
    }
    return ids.size;
  }, [theirListings]);

  const endorsementsReceived = useMemo(() => {
    if (!showTrustDetails) return EMPTY_ENDORSEMENTS;
    const out: EndorsementItem[] = [];
    for (const listing of theirListings) {
      for (const e of listing.endorsements) {
        if (e.hidden) continue;
        out.push({ listing, endorsement: e });
      }
    }
    return out;
  }, [showTrustDetails, theirListings]);

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

  const canMessage = canDirectMessage(person, hasThread);
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
              eager
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
                onClick={() => startTransition(() => setContentTab("listings"))}
                label="آگهی‌ها"
                count={theirListings.length}
              />
              <TabButton
                selected={activeTab === "requests"}
                onClick={() => startTransition(() => setContentTab("requests"))}
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
                <div key={l.id} className="cv-card">
                  <ListingCard listing={l} hideTrust />
                </div>
              ))}
            {activeTab === "requests" &&
              theirRequests.map((r) => (
                <div key={r.id} className="cv-card">
                  <RequestCard request={r} hideTrust />
                </div>
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
        <button
          type="button"
          onClick={() => setShowTrustDetails(true)}
          className="card w-full px-3.5 py-3 text-right active:bg-stone-50/80 dark:active:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-extrabold text-ink dark:text-zinc-100">
                چه گفته‌اند
              </p>
              <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug">
                {evidenceLine || "هنوز کسی چیزی نگفته"}
              </p>
            </div>
            <span className="text-ink-faint text-sm shrink-0" aria-hidden>
              ‹
            </span>
          </div>
        </button>
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
          words={endorsementsReceived}
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

function groupWords(items: EndorsementItem[]): EndorsementItem[] {
  const seen = new Set<string>();
  const out: EndorsementItem[] = [];
  for (const item of items) {
    const key = `${item.listing.id}:${item.endorsement.personId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const note =
      items.find(
        (x) =>
          x.listing.id === item.listing.id &&
          x.endorsement.personId === item.endorsement.personId &&
          x.endorsement.note?.trim(),
      )?.endorsement.note ?? item.endorsement.note;
    out.push({
      listing: item.listing,
      endorsement: { ...item.endorsement, note },
    });
  }
  return out;
}

function TrustDetailsSheet({
  person,
  words,
  getPerson,
  onClose,
}: {
  person: Person;
  words: EndorsementItem[];
  getPerson: (id: string) => Person | undefined;
  onClose: () => void;
}) {
  const titleId = useId();
  const hintId = useId();
  const rows = groupWords(words);
  const uniqueCount = new Set(rows.map((r) => r.endorsement.personId)).size;

  return (
    <SheetShell
      onClose={onClose}
      labelledBy={titleId}
      maxHeight="88dvh"
      hugContent={rows.length <= 2}
    >
      <h2
        id={titleId}
        className="text-[16px] font-extrabold text-ink dark:text-zinc-100 mb-1"
      >
        چه گفته‌اند
        {uniqueCount > 0 ? (
          <span className="ms-1.5 text-[12px] font-bold text-ink-muted nums">
            {toPersianDigits(uniqueCount)} آشنا
          </span>
        ) : null}
      </h2>
      <p
        id={hintId}
        className="text-[12px] text-ink-muted dark:text-zinc-400 mb-4 leading-relaxed"
      >
        آشنایان این حرف‌ها را گفته‌اند. سیرکل هویت کسی را تأیید نمی‌کند.
      </p>

      {rows.length === 0 ? (
        <p className="text-[13px] text-ink-faint py-6 text-center leading-relaxed">
          هنوز کسی روی آگهی‌های {person.name} حرفی نگذاشته.
        </p>
      ) : (
        <ul
          className="divide-y divide-stone-100 dark:divide-zinc-800"
          aria-describedby={hintId}
        >
          {rows.map((item, i) => {
            const endorser = getPerson(item.endorsement.personId);
            const isMe = item.endorsement.personId === "me";
            const name = isMe ? "تو" : (endorser?.name ?? "یک آشنا");
            const note = item.endorsement.note?.trim();
            const claim = endorsementClaimAfterName(item.endorsement.type, {
              sellerName: person.name,
            });
            const profileHref = isMe
              ? "/profile"
              : endorser
                ? `/person/${endorser.id}`
                : undefined;
            const listingTitle = listingDisplayTitle(
              item.listing.title,
              item.listing.type,
            );

            return (
              <li
                key={`${item.listing.id}-${item.endorsement.personId}-${i}`}
                className="flex items-start gap-2.5 py-3.5 first:pt-1"
              >
                {endorser ? (
                  <Avatar
                    name={endorser.name}
                    src={endorser.avatar}
                    showLevel={false}
                    size="sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink dark:text-zinc-100 leading-snug">
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        onClick={onClose}
                        className="font-extrabold text-ink dark:text-zinc-50"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="font-extrabold">{name}</span>
                    )}{" "}
                    {claim}.
                  </p>
                  {note ? (
                    <p className="mt-1.5 text-[13px] text-ink-muted dark:text-zinc-300 leading-relaxed">
                      «{note}»
                    </p>
                  ) : null}
                  <Link
                    href={`/listing/${item.listing.id}`}
                    className="mt-2 inline-flex min-h-10 max-w-full items-center text-[12px] font-bold text-brand-600 dark:text-brand-400"
                    onClick={onClose}
                  >
                    <span className="truncate">{listingTitle}</span>
                    <span className="shrink-0" aria-hidden>
                      {" "}
                      ‹
                    </span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SheetShell>
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
