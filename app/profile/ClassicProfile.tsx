"use client";

import Link from "next/link";
import {
  memo,
  startTransition,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { activeCircle } from "@/lib/circle-member";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import ListingImage from "@/components/ListingImage";
import OwnerListingManager from "@/components/OwnerListingManager";
import SocialCreditCard from "@/components/SocialCreditCard";
import SheetShell from "@/components/SheetShell";
import {
  CalendarIcon,
  ClockIcon,
  GearIcon,
  HeartIcon,
  EyeIcon,
  EyeOffIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "@/components/Icons";
import { badgeLabels, eventKindEmoji, formatPrice } from "@/lib/labels";
import { buildSocialCredit } from "@/lib/social-credit";
import { formatEventDateDisplay, toPersianDigits } from "@/lib/persian";
import { CONCEPT_TIP_KEY } from "@/lib/home-tip";
import { ThemeSegmented } from "@/components/ThemeToggle";
import { useToast } from "@/components/Toast";
import { ProfileSkeleton } from "@/components/Skeleton";
import { lazyUi } from "@/lib/lazy-ui";
import { listingConversationCountMap } from "@/lib/thread-listing";
import type { CircleEvent, Listing } from "@/lib/types";

const EditProfileSheet = lazyUi(() => import("@/components/EditProfileSheet"));
const WatchSheet = lazyUi(() => import("@/app/messages/WatchSheet"));
const SavedListingCard = lazyUi(() => import("@/components/ListingCard"), {
  loading: () => (
    <div className="card h-[4.75rem] animate-pulse bg-stone-100 dark:bg-zinc-800" />
  ),
});

type ActivityTab = "listings" | "events" | "saved" | "hidden" | "endorsements";

export default function ClassicProfile() {
  const hydrated = useStore((s) => s.hydrated);
  const watchesOn = useCatalog().flags.watches;
  const [showAccount, setShowAccount] = useState(false);
  const [showWatches, setShowWatches] = useState(false);

  if (!hydrated) {
    return (
      <main className="pb-24 min-h-[100dvh]">
        <Header title="پروفایل" />
        <ProfileSkeleton />
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header
        title="پروفایل"
        action={
          <div className="flex items-center gap-0.5">
            {watchesOn ? (
              <button
                type="button"
                onClick={() => setShowWatches(true)}
                aria-label="گوش‌به‌زنگ‌ها"
                title="گوش‌به‌زنگ‌ها"
                className="inline-grid size-9 shrink-0 place-items-center appearance-none rounded-xl p-0 leading-none text-ink-muted dark:text-zinc-300 active:bg-stone-100 dark:active:bg-zinc-800"
              >
                <EyeIcon className="w-5 h-5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowAccount(true)}
              aria-label="حساب"
              title="حساب"
              className="inline-grid size-9 shrink-0 place-items-center appearance-none rounded-xl p-0 leading-none text-ink-muted dark:text-zinc-300 active:bg-stone-100 dark:active:bg-zinc-800"
            >
              <GearIcon className="w-5 h-5" />
            </button>
          </div>
        }
      />
      <div className="px-4 pt-3 space-y-3.5 listing-detail-rise">
        <ProfileHero />
        <ProfileActivity />
      </div>
      {showWatches && watchesOn ? (
        <WatchSheet onClose={() => setShowWatches(false)} />
      ) : null}
      {showAccount ? (
        <AccountSheet onClose={() => setShowAccount(false)} />
      ) : null}
      <BottomNav />
    </main>
  );
}

function ProfileHero() {
  const me = useStore((s) => s.me);
  const myCircleCount = useStore((s) => activeCircle(s.people).length);
  const listings = useStore((s) => s.listings);
  const updateProfile = useStore((s) => s.updateProfile);
  const { show } = useToast();
  const [showEdit, setShowEdit] = useState(false);

  const socialCredit = useMemo(
    () => buildSocialCredit(me, listings, myCircleCount),
    [me, listings, myCircleCount],
  );

  const metaLine = [
    me.city,
    socialCredit.lastActive ? `فعال ${socialCredit.lastActive}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-3.5">
      <section className="card p-3.5">
        <div className="flex items-start gap-3">
          <Avatar
            name={me.name}
            src={me.avatar}
            size="lg"
            showLevel={false}
            eager
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[20px] font-extrabold text-ink dark:text-zinc-50 tracking-tight truncate leading-tight">
                {me.name}
              </h2>
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                onPointerEnter={() => {
                  void import("@/components/EditProfileSheet");
                }}
                aria-label="ویرایش پروفایل"
                className="shrink-0 flex items-center gap-1.5 text-[12px] font-bold text-brand-700 dark:text-brand-300 bg-[color:var(--circle-surface)] dark:bg-zinc-900/80 ring-1 ring-brand-200/80 dark:ring-brand-500/30 rounded-xl px-3 py-2 shadow-sm active:scale-95 transition-transform"
              >
                <PencilIcon className="w-3.5 h-3.5" />
                ویرایش
              </button>
            </div>
            {metaLine ? (
              <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-snug">
                {metaLine}
              </p>
            ) : null}
            <Link
              href="/circle"
              className="inline-block text-[12px] font-bold text-brand-700 dark:text-brand-300 mt-1.5"
            >
              {toPersianDigits(myCircleCount)} نفر در حلقه ‹
            </Link>
          </div>
        </div>
      </section>

      <SocialCreditCard
        stats={socialCredit}
        title="سابقه در حلقه"
        hideVerified
        forSelf
      />

      {showEdit ? (
        <EditProfileSheet
          name={me.name}
          city={me.city ?? ""}
          avatar={me.avatar}
          onClose={() => setShowEdit(false)}
          onSave={async (input) => {
            await updateProfile(input);
            setShowEdit(false);
            show("پروفایل به‌روزرسانی شد ✓");
          }}
        />
      ) : null}
    </div>
  );
}

function ProfileActivity() {
  const listings = useStore((s) => s.listings);
  const events = useStore((s) => s.events);
  const saved = useStore((s) => s.saved);
  const hiddenListings = useStore((s) => s.hiddenListings);
  const hiddenPeople = useStore((s) => s.hiddenPeople);
  const listingNotes = useStore((s) => s.listingNotes);
  const toggleHiddenListing = useStore((s) => s.toggleHiddenListing);
  const toggleHiddenPerson = useStore((s) => s.toggleHiddenPerson);
  const getPerson = useStore((s) => s.getPerson);
  const { show } = useToast();
  const [tab, setTab] = useState<ActivityTab>("listings");
  const [hashSaved, setHashSaved] = useState(false);
  const [hashHidden, setHashHidden] = useState(false);

  const myListings = useMemo(
    () => listings.filter((l) => l.sellerId === "me"),
    [listings],
  );
  const liveListings = useMemo(
    () => myListings.filter((l) => l.dealStatus !== "inactive"),
    [myListings],
  );
  const inactiveListings = useMemo(
    () => myListings.filter((l) => l.dealStatus === "inactive"),
    [myListings],
  );
  const listingsSplit =
    liveListings.length > 0 && inactiveListings.length > 0;

  const listingById = useMemo(() => {
    const map = new Map<string, Listing>();
    for (const listing of listings) map.set(listing.id, listing);
    return map;
  }, [listings]);

  const savedListings = useMemo(() => {
    const out: Listing[] = [];
    for (const id of saved) {
      const listing = listingById.get(id);
      if (listing) out.push(listing);
    }
    return out;
  }, [saved, listingById]);

  const hiddenListingRows = useMemo(() => {
    const out: Listing[] = [];
    for (const id of hiddenListings) {
      const listing = listingById.get(id);
      if (listing) out.push(listing);
    }
    return out;
  }, [hiddenListings, listingById]);

  const { hostedEvents, attendingEvents, allMyEvents } = useMemo(() => {
    const hosted: CircleEvent[] = [];
    const attending: CircleEvent[] = [];
    for (const event of events) {
      if (event.hostId === "me") hosted.push(event);
      else if (event.attendees.includes("me")) attending.push(event);
    }
    return {
      hostedEvents: hosted,
      attendingEvents: attending,
      allMyEvents: hosted.length + attending.length,
    };
  }, [events]);

  const myGivenBadges = useMemo(() => givenEndorsements(listings), [listings]);

  const activityTabs = useMemo(
    () => [
      { id: "listings" as const, label: "آگهی‌ها", count: myListings.length },
      { id: "events" as const, label: "رویدادها", count: allMyEvents },
      { id: "saved" as const, label: "نشان‌ها", count: savedListings.length },
      {
        id: "hidden" as const,
        label: "پنهان‌ها",
        count: hiddenListingRows.length + hiddenPeople.length,
      },
      {
        id: "endorsements" as const,
        label: "تأییدهای من",
        count: myGivenBadges.length,
      },
    ],
    [
      myListings.length,
      allMyEvents,
      savedListings.length,
      hiddenListingRows.length,
      hiddenPeople.length,
      myGivenBadges.length,
    ],
  );

  const visibleTabs = useMemo(
    () =>
      activityTabs.filter(
        (t) =>
          t.count > 0 ||
          (hashSaved && t.id === "saved") ||
          (hashHidden && t.id === "hidden"),
      ),
    [activityTabs, hashSaved, hashHidden],
  );
  const showTabBar = visibleTabs.length >= 2;
  const activeTab = visibleTabs.some((t) => t.id === tab)
    ? tab
    : (visibleTabs[0]?.id ?? "listings");

  useEffect(() => {
    if (window.location.hash === "#saved") {
      setHashSaved(true);
      setTab("saved");
      const el = document.getElementById("activity");
      if (!el) return;
      const t = window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(t);
    }

    if (window.location.hash === "#hidden") {
      setHashHidden(true);
      setTab("hidden");
      const el = document.getElementById("activity");
      if (!el) return;
      const t = window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(t);
    }

    if (myListings.length > 0) return;
    if (allMyEvents > 0) setTab("events");
    else if (savedListings.length > 0) setTab("saved");
    else if (hiddenListingRows.length > 0 || hiddenPeople.length > 0) setTab("hidden");
    else if (myGivenBadges.length > 0) setTab("endorsements");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after hydrate
  }, []);

  return (
    <section id="activity" className="scroll-mt-24">
      {showTabBar ? (
        <div
          className="flex gap-1 p-1 rounded-2xl bg-stone-100/90 dark:bg-zinc-800/80 overflow-x-auto no-scrollbar mb-2.5"
          role="tablist"
          aria-label="نوع فعالیت"
        >
          {visibleTabs.map((t) => {
            const active = activeTab === t.id;
            const count = t.count;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`${t.label}، ${toPersianDigits(count)}`}
                onClick={() => startTransition(() => setTab(t.id))}
                className={`shrink-0 flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[12px] font-bold transition-all duration-200 ${
                  active
                    ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                    : "text-ink-muted dark:text-zinc-400 active:bg-white/60 dark:active:bg-zinc-700/50"
                }`}
              >
                <span className="truncate">{t.label}</span>
                <span
                  dir="ltr"
                  className={`nums shrink-0 inline-flex min-w-[1.2rem] h-[1.2rem] px-1 items-center justify-center rounded-full text-[11px] font-extrabold leading-none ${
                    active
                      ? "bg-white/22 text-white"
                      : "bg-stone-200/90 text-ink-muted dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {toPersianDigits(count)}
                </span>
              </button>
            );
          })}
        </div>
      ) : visibleTabs.length === 1 &&
        activeTab === "listings" &&
        listingsSplit ? (
        <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-200 mb-2.5 px-0.5">
          آگهی‌ها
        </h2>
      ) : visibleTabs.length === 1 ? (
        <div className="flex items-center gap-2 mb-2.5 px-0.5">
          <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-200">
            {visibleTabs[0].label}
          </h2>
          <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted nums">
            {toPersianDigits(visibleTabs[0].count)}
          </span>
        </div>
      ) : visibleTabs.length === 0 ? (
        <h2 className="text-[13px] font-extrabold text-ink dark:text-zinc-200 mb-2.5 px-0.5">
          فعالیت من
        </h2>
      ) : null}

      <div
        className="mt-0"
        id={
          activeTab === "saved"
            ? "saved"
            : activeTab === "hidden"
              ? "hidden"
              : undefined
        }
        role="tabpanel"
      >
        {activeTab === "listings" ? (
          myListings.length === 0 ? (
            <EmptyCard
              title="هنوز آگهی‌ای نداری"
              text="چیزی برای فروش، امانت یا هدیه ثبت کن تا حلقه ببیند."
              href="/new"
              cta="آگهی جدید"
              icon="plus"
            />
          ) : (
            <ProfileListingsPanel
              listingsSplit={listingsSplit}
              liveListings={liveListings}
              inactiveListings={inactiveListings}
            />
          )
        ) : null}

        {activeTab === "events" ? (
          allMyEvents === 0 ? (
            <EmptyCard
              title="رویدادی در تقویمت نیست"
              text="به یک رویداد بپیوند یا خودت یکی بساز."
              href="/events"
              cta="دیدن رویدادها"
              icon="calendar"
            />
          ) : (
            <div className="space-y-2.5">
              {hostedEvents.length > 0 && (
                <EventGroup label="میزبانی من" events={hostedEvents} />
              )}
              {attendingEvents.length > 0 && (
                <EventGroup label="شرکت می‌کنم" events={attendingEvents} />
              )}
            </div>
          )
        ) : null}

        {activeTab === "saved" ? (
          savedListings.length === 0 ? (
            <EmptyCard
              title="هنوز چیزی نشان نکرده‌ای"
              text="روی ❤ هر آگهی بزن تا اینجا جمع شود."
              href="/"
              cta="دیدن آگهی‌ها"
              icon="heart"
            />
          ) : (
            <div className="space-y-2.5">
              {savedListings.map((l) => {
                const note = listingNotes[l.id]?.trim();
                return (
                  <div key={l.id} className="cv-card">
                    <SavedListingCard listing={l} compactTrust />
                    {note ? (
                      <p className="px-1 pt-1.5 text-[11px] text-ink-muted leading-snug line-clamp-2">
                        {note}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )
        ) : null}

        {activeTab === "hidden" ? (
          hiddenListingRows.length === 0 && hiddenPeople.length === 0 ? (
            <EmptyCard
              title="چیزی پنهان نکرده‌ای"
              text="از آگهی یا پروفایل بزن تا آگهی یا آگهی‌های یک نفر از فیدت کنار برود."
              href="/"
              cta="دیدن آگهی‌ها"
              icon="eye"
            />
          ) : (
            <div className="space-y-4">
              {hiddenPeople.length > 0 ? (
                <div className="space-y-2">
                  <p className="px-0.5 text-[12px] font-bold text-ink-muted dark:text-zinc-400">
                    آگهی‌های این افراد در فید نمی‌آید
                  </p>
                  {hiddenPeople.map((personId) => {
                    const person = getPerson(personId);
                    const label = person?.name?.trim() || "فرد پنهان";
                    return (
                      <div
                        key={personId}
                        className="card flex items-center gap-3 px-3.5 py-3"
                      >
                        <Link
                          href={`/person/${personId}`}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <Avatar
                            name={label}
                            src={person?.avatar}
                            showLevel={false}
                            size="sm"
                          />
                          <span className="min-w-0 truncate font-bold text-[13px] text-ink dark:text-zinc-100">
                            {label}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            void toggleHiddenPerson(personId).then(() =>
                              show("آگهی‌هایش دوباره در فید می‌آید"),
                            );
                          }}
                          className="shrink-0 text-[12px] font-bold text-brand-600 dark:text-brand-400"
                        >
                          برگردان
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {hiddenListingRows.length > 0 ? (
                <div className="space-y-2.5">
                  {hiddenPeople.length > 0 ? (
                    <p className="px-0.5 text-[12px] font-bold text-ink-muted dark:text-zinc-400">
                      آگهی‌های جدا
                    </p>
                  ) : null}
                  {hiddenListingRows.map((l) => (
                    <div key={l.id} className="cv-card">
                      <SavedListingCard listing={l} compactTrust />
                      <button
                        type="button"
                        onClick={() => {
                          void toggleHiddenListing(l.id).then(() =>
                            show("دوباره در فید می‌آید"),
                          );
                        }}
                        className="mt-1.5 px-1 text-[12px] font-bold text-brand-600 dark:text-brand-400"
                      >
                        برگردان به فید
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )
        ) : null}

        {activeTab === "endorsements" ? (
          myGivenBadges.length === 0 ? (
            <EmptyCard
              title="هنوز تأییدی نداده‌ای"
              text="از صفحهٔ آگهی بگو که دیده‌ای یا می‌شناسی‌اش."
              href="/"
              cta="رفتن به آگهی‌ها"
              icon="shield"
            />
          ) : (
            <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
              {myGivenBadges.map(({ l, e, note }, i) => (
                <Link
                  key={`${l.id}-${e.type}-${i}`}
                  href={`/listing/${l.id}`}
                  className="cv-row flex items-center gap-3 px-3.5 py-3 text-[13px] active:bg-stone-50/80"
                >
                  <span className="text-[11px] font-semibold text-levelA shrink-0 rounded-md bg-levelA/10 px-1.5 py-0.5">
                    {e.type === "word" ? "حرف" : badgeLabels[e.type]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-ink dark:text-zinc-100 truncate block">
                      {l.title}
                    </span>
                    {note ? (
                      <span className="text-[11px] text-ink-muted truncate block mt-0.5">
                        «{note}»
                      </span>
                    ) : null}
                  </span>
                  <span className="text-ink-faint" aria-hidden>
                    ‹
                  </span>
                </Link>
              ))}
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}

function ProfileListingsPanel({
  listingsSplit,
  liveListings,
  inactiveListings,
}: {
  listingsSplit: boolean;
  liveListings: Listing[];
  inactiveListings: Listing[];
}) {
  const messages = useStore((s) => s.messages);
  const conversationCounts = useMemo(
    () => listingConversationCountMap(messages),
    [messages],
  );

  if (listingsSplit) {
    return (
      <div className="space-y-3">
        <ListingGroup
          label="فعال"
          hint="در فید حلقه دیده می‌شود"
          listings={liveListings}
          conversationCounts={conversationCounts}
        />
        <ListingGroup
          label="غیرفعال"
          hint="از فید برداشته شده؛ در پروفایل می‌ماند"
          listings={inactiveListings}
          conversationCounts={conversationCounts}
          inactive
        />
      </div>
    );
  }

  if (inactiveListings.length > 0) {
    return (
      <ListingGroup
        label="غیرفعال"
        hint="از فید برداشته شده؛ در پروفایل می‌ماند"
        listings={inactiveListings}
        conversationCounts={conversationCounts}
        inactive
      />
    );
  }

  return (
    <ListingGroup
      listings={liveListings}
      conversationCounts={conversationCounts}
    />
  );
}

function AccountSheet({ onClose }: { onClose: () => void }) {
  const sessionPhone = useStore((s) => s.sessionPhone);
  const signOut = useStore((s) => s.signOut);
  const router = useRouter();
  const { show } = useToast();

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="account-sheet-title"
      zClass="z-[60]"
      hugContent
      footer={
        sessionPhone ? (
          <button
            type="button"
            onClick={() => {
              void signOut().then(() => {
                show("خارج شدید — دوباره وارد شوید");
                router.replace("/");
              });
            }}
            className="w-full text-[13px] font-bold text-red-600 dark:text-red-400 py-2.5 active:opacity-70"
          >
            خروج از حساب
          </button>
        ) : undefined
      }
    >
      <h2
        id="account-sheet-title"
        className="font-extrabold text-[20px] text-ink dark:text-zinc-50 leading-tight"
      >
        حساب
      </h2>

      <p className="mt-4 text-[11px] font-semibold text-ink-muted dark:text-zinc-400 mb-1.5">
        ظاهر
      </p>
      <ThemeSegmented compact />

      <div className="mt-4 rounded-2xl border border-stone-200/80 dark:border-zinc-700 overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
        <div className="px-3 py-2.5">
          <OwnListingsFeedSwitch />
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(CONCEPT_TIP_KEY);
            } catch {
              /* ignore */
            }
            onClose();
            router.push("/");
          }}
          className="w-full flex items-center justify-between gap-3 px-3 py-3 text-right active:bg-stone-50 dark:active:bg-zinc-800/80"
        >
          <span className="text-[13px] font-bold text-ink dark:text-zinc-100">
            سیرکل چطور کار می‌کند؟
          </span>
          <span className="text-ink-faint" aria-hidden>
            ‹
          </span>
        </button>
        {sessionPhone ? (
          <div className="flex items-center justify-between gap-3 px-3 py-3">
            <span className="text-[13px] font-medium text-ink-muted">موبایل</span>
            <span
              className="text-[13px] font-bold nums text-ink dark:text-zinc-100 tracking-wide"
              dir="ltr"
            >
              {formatPhoneDisplay(sessionPhone)}
            </span>
          </div>
        ) : null}
      </div>
    </SheetShell>
  );
}

function OwnListingsFeedSwitch() {
  const show = useStore((s) => s.showOwnListingsInFeed);
  const setShow = useStore((s) => s.setShowOwnListingsInFeed);
  const switchId = useId();

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p
          id={switchId}
          className="text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug"
        >
          آگهی‌های من در خانه
        </p>
        <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug">
          خاموش باشد فقط در پروفایل دیده می‌شوند.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={show}
        aria-labelledby={switchId}
        onClick={() => setShow(!show)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 active:scale-95 ${
          show ? "bg-brand-600" : "bg-stone-300 dark:bg-zinc-600"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-150 ease-out ${
            show ? "start-[calc(100%-25px)]" : "start-[3px]"
          }`}
        />
      </button>
    </div>
  );
}

function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) {
    return toPersianDigits(`${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`);
  }
  return toPersianDigits(phone);
}

function givenEndorsements(listings: Listing[]) {
  return listings.flatMap((l) => {
    const mine = l.endorsements.filter((e) => e.personId === "me");
    if (mine.length === 0) return [];
    const note = mine.find((e) => e.note?.trim())?.note;
    const types = mine.filter((e) => e.type !== "word");
    const shown = types.length > 0 ? types : mine;
    return shown.map((e) => ({ l, e, note }));
  });
}

function EventGroup({
  label,
  events,
}: {
  label: string;
  events: CircleEvent[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-ink-muted mb-1.5 px-0.5">
        {label}
        <span className="ms-1 nums text-ink-faint">
          {toPersianDigits(events.length)}
        </span>
      </p>
      <div className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
        {events.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}

function ListingGroup({
  label,
  hint,
  listings,
  conversationCounts,
  inactive = false,
}: {
  label?: string;
  hint?: string;
  listings: Listing[];
  conversationCounts: Map<string, number>;
  inactive?: boolean;
}) {
  return (
    <div>
      {label ? (
        <div className="mb-1.5 px-0.5">
          <p className="text-[11px] font-semibold text-ink-muted dark:text-zinc-400">
            {label}
            <span className="ms-1 nums text-ink-faint">
              {toPersianDigits(listings.length)}
            </span>
          </p>
          {hint ? (
            <p className="text-[11px] text-ink-faint mt-0.5 leading-snug">
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}
      <div
        className={`card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden ${
          inactive ? "bg-stone-50/90 dark:bg-zinc-900/55" : ""
        }`}
      >
        {listings.map((l) => (
          <ProfileListingRow
            key={l.id}
            listing={l}
            inactive={inactive}
            conversationCount={conversationCounts.get(l.id) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}

const ProfileListingRow = memo(function ProfileListingRow({
  listing,
  inactive,
  conversationCount,
}: {
  listing: Listing;
  inactive?: boolean;
  conversationCount: number;
}) {
  const price =
    listing.price != null ? (
      <span className="nums">{formatPrice(listing.price)}</span>
    ) : (
      "رایگان / توافقی"
    );

  return (
    <div className="cv-row flex items-stretch">
      <Link
        href={`/listing/${listing.id}`}
        aria-label={inactive ? `${listing.title}، غیرفعال` : listing.title}
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 active:bg-stone-50/80 dark:active:bg-zinc-800/60"
      >
        <ListingImage
          image={listing.image}
          alt={listing.title}
          size="sm"
          category={listing.category}
          type={listing.type}
          className={inactive ? "grayscale" : ""}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p
              className={`font-semibold text-[13px] truncate ${
                inactive
                  ? "text-ink-muted dark:text-zinc-400"
                  : "text-ink dark:text-zinc-100"
              }`}
            >
              {listing.title}
            </p>
            {inactive ? (
              <span className="shrink-0 chip !text-[11px] !py-0.5 !px-1.5 bg-stone-200/80 text-ink-muted dark:bg-zinc-800 dark:text-zinc-400">
                غیرفعال
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">
            {price} · {listing.postedAt}
            {conversationCount > 0 ? (
              <span className="nums">
                {" "}
                · {toPersianDigits(conversationCount)} گفتگو
              </span>
            ) : null}
          </p>
        </div>
      </Link>
      <div className="flex items-center pe-1.5">
        <OwnerListingManager listing={listing} />
      </div>
    </div>
  );
});

function EventRow({ event }: { event: CircleEvent }) {
  return (
    <Link
      href={`/event/${event.id}`}
      className="cv-row flex items-center gap-3 px-3 py-2.5 active:bg-stone-50/80 dark:active:bg-zinc-800/60"
    >
      <div className="w-11 h-11 rounded-xl bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-xl shrink-0 ring-1 ring-stone-200/50 dark:ring-zinc-700">
        {event.image}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] text-ink dark:text-zinc-100 truncate">
          {eventKindEmoji[event.kind]} {event.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="w-3 h-3 text-ink-faint" />
            {formatEventDateDisplay(event.date)}
          </span>
          {event.time && (
            <span className="inline-flex items-center gap-1 nums">
              <ClockIcon className="w-3 h-3 text-ink-faint" />
              {toPersianDigits(event.time)}
            </span>
          )}
          <span className="inline-flex items-center gap-1 truncate">
            <MapPinIcon className="w-3 h-3 text-ink-faint shrink-0" />
            <span className="truncate">{event.location}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyCard({
  title,
  text,
  href,
  cta,
  icon = "plus",
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  icon?: "heart" | "plus" | "calendar" | "shield" | "eye";
}) {
  return (
    <div className="card px-5 py-7 text-center relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(74,58,143,0.08), transparent)",
        }}
        aria-hidden
      />
      <div className="relative">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-1 ${
            icon === "heart"
              ? "bg-pink-50 dark:bg-pink-500/15 text-pink-600 ring-pink-100 dark:ring-pink-500/20"
              : icon === "calendar"
                ? "bg-levelB/10 text-levelB ring-levelB/20"
                : icon === "shield"
                  ? "bg-levelA/10 text-levelA ring-levelA/20"
                  : icon === "eye"
                    ? "bg-stone-100 dark:bg-zinc-800 text-ink-muted ring-stone-200/80 dark:ring-zinc-700"
                    : "bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 ring-brand-100 dark:ring-brand-500/25"
          }`}
        >
          {icon === "heart" ? (
            <HeartIcon className="w-5 h-5" />
          ) : icon === "calendar" ? (
            <CalendarIcon className="w-5 h-5" />
          ) : icon === "shield" ? (
            <ShieldCheckIcon className="w-5 h-5" />
          ) : icon === "eye" ? (
            <EyeOffIcon className="w-5 h-5" />
          ) : (
            <PlusIcon className="w-5 h-5" />
          )}
        </div>
        <p className="text-[14px] font-extrabold text-ink dark:text-zinc-100">
          {title}
        </p>
        <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed max-w-[16rem] mx-auto">
          {text}
        </p>
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-1.5 mt-4 btn-primary !py-2.5 !px-5 !text-[13px] shadow-md shadow-brand-600/20"
        >
          {cta}
          <span aria-hidden>‹</span>
        </Link>
      </div>
    </div>
  );
}
