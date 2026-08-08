"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardBody, Chip, Input } from "@heroui/react";
import { useStore } from "@/lib/store";
import HListingCard from "@/components/heroui/HListingCard";
import HBottomNav from "@/components/heroui/HBottomNav";
import HAvatar from "@/components/heroui/HAvatar";
import Onboarding from "@/components/Onboarding";
import { CircleUsersIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import { formatPrice, listingTypeLabels } from "@/lib/labels";
import type { CircleEvent, ListingType, Request } from "@/lib/types";
import { formatEventDateDisplay, normalizeFa, toPersianDigits } from "@/lib/persian";
import { canView, filterByAccess } from "@/lib/trust";

const PREVIEW_LIMIT = 8;

const FILTERS: { key: ListingType | "all"; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "sale", label: listingTypeLabels.sale },
  { key: "service", label: listingTypeLabels.service },
  { key: "donation", label: listingTypeLabels.donation },
  { key: "exchange", label: listingTypeLabels.exchange },
  { key: "loan", label: listingTypeLabels.loan },
];

export default function HeroFeed() {
  const { listings, requests, events, people, getPerson, hydrated, onboarded } = useStore();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const [query, setQuery] = useState("");

  const circleCount = people.filter((p) => p.inMyCircle).length;

  const { allowed, hidden } = useMemo(() => {
    const { visible, hidden } = filterByAccess(listings, getPerson);
    return { allowed: visible, hidden };
  }, [listings, getPerson]);

  const visibleRequests = useMemo(
    () => requests.filter((r) => canView(r, getPerson)).slice(0, PREVIEW_LIMIT),
    [requests, getPerson],
  );
  const visibleEvents = useMemo(
    () => events.filter((e) => canView(e, getPerson)).slice(0, PREVIEW_LIMIT),
    [events, getPerson],
  );

  const visible = useMemo(() => {
    const q = normalizeFa(query);
    return allowed.filter((l) => {
      if (filter !== "all" && l.type !== filter) return false;
      if (q && !normalizeFa(`${l.title} ${l.description} ${l.category}`).includes(q)) return false;
      return true;
    });
  }, [allowed, filter, query]);

  const hasFilter = filter !== "all" || query.trim().length > 0;

  return (
    <main className="pb-24 min-h-[100dvh]">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-divider">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold leading-none text-primary text-lg">سیرکل</h1>
              <p className="text-[11px] text-default-500 mt-0.5">خرید و فروش بین آدم‌های مورد اعتماد</p>
            </div>
          </div>

          <Input
            value={query}
            onValueChange={setQuery}
            placeholder="جستجو در آگهی‌های حلقه‌ی شما…"
            radius="lg"
            variant="flat"
            startContent={<SearchIcon className="w-5 h-5 text-default-400" />}
            className="mt-3"
          />
        </div>

        <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              as="button"
              onClick={() => setFilter(f.key)}
              color={filter === f.key ? "primary" : "default"}
              variant={filter === f.key ? "solid" : "flat"}
              radius="full"
              className="shrink-0 cursor-pointer"
            >
              {f.label}
            </Chip>
          ))}
        </div>
      </header>

      {/* Trust banner */}
      {!onboarded && (
        <div className="px-4 pt-3">
          <div className="rounded-large p-4 text-white bg-gradient-to-l from-primary-600 to-primary-400">
            <p className="font-bold text-sm">اینجا کسی غریبه نیست</p>
            <p className="text-xs mt-1 opacity-90 leading-relaxed">
              هر آگهی از مسیر اعتمادی به شما می‌رسد: «این فروشنده، دوستِ همکارِ خواهرِ شماست.»
            </p>
          </div>
        </div>
      )}

      {/* Quick access */}
      {circleCount <= 2 && (
        <div className="grid grid-cols-2 gap-2.5 px-4 pt-3">
          <Shortcut href="/requests" emoji="🔎" label="درخواست‌ها" />
          <Shortcut href="/events" emoji="🎉" label="رویدادها" />
        </div>
      )}

      {/* New-user first step */}
      {hydrated && circleCount === 0 && (
        <div className="px-4 pt-4">
          <Card radius="lg" shadow="sm">
            <CardBody className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto mb-2">
                <CircleUsersIcon className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm">اول حلقه‌ات را بساز</p>
              <p className="text-xs text-default-500 mt-1 leading-relaxed">
                با افزودن خانواده و دوستان مورد اعتماد، آگهی‌ها و رویدادهای آن‌ها اینجا ظاهر می‌شود.
              </p>
              <Link href="/circle" className="inline-block mt-3 text-sm font-semibold text-primary">
                افزودن به حلقه ←
              </Link>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Listings feed */}
      <div className="px-4 pt-5">
        <h2 className="text-sm font-bold text-default-600 mb-2.5">آگهی‌ها</h2>
        {!hydrated ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} radius="lg" shadow="sm" className="h-28" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <FeedEmptyState hasFilter={hasFilter} onClear={() => { setFilter("all"); setQuery(""); }} />
        ) : (
          <div className="space-y-3">
            {visible.map((l) => (
              <HListingCard key={l.id} listing={l} compactTrust />
            ))}
          </div>
        )}

        {hidden > 0 && (
          <div className="flex items-center justify-center gap-2 text-[11px] text-default-400 py-2">
            <CircleUsersIcon className="w-4 h-4" />
            <span>{toPersianDigits(hidden)} آگهی به‌دلیل تنظیمات حریم خصوصی برای شما قابل نمایش نیست</span>
          </div>
        )}
      </div>

      {/* Events strip */}
      {visibleEvents.length > 0 && (
        <StripSection title="رویدادهای پیش‌رو" href="/events">
          {visibleEvents.map((ev) => <EventStripCard key={ev.id} event={ev} />)}
        </StripSection>
      )}

      {/* Requests strip */}
      {visibleRequests.length > 0 && (
        <StripSection title="درخواست‌های حلقه" href="/requests">
          {visibleRequests.map((r) => <RequestStripCard key={r.id} request={r} />)}
        </StripSection>
      )}

      <Onboarding />
      <HBottomNav />
    </main>
  );
}

function Shortcut({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <Card as={Link} href={href} radius="lg" shadow="sm" isPressable>
      <CardBody className="p-3 flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-primary-50 text-primary">
          {emoji}
        </div>
        <p className="text-xs font-bold">{label}</p>
      </CardBody>
    </Card>
  );
}

function StripSection({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="pt-5">
      <div className="flex items-center justify-between mb-2.5 px-4">
        <h2 className="text-sm font-bold text-default-600">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-primary font-medium">
            همه
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">{children}</div>
    </section>
  );
}

function FeedEmptyState({ hasFilter, onClear }: { hasFilter: boolean; onClear: () => void }) {
  return (
    <Card radius="lg" shadow="sm">
      <CardBody className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center text-xl mx-auto mb-3">🔍</div>
        <p className="font-bold text-sm">{hasFilter ? "نتیجه‌ای پیدا نشد" : "هنوز آگهی‌ای نیست"}</p>
        <p className="text-xs text-default-500 mt-1.5 leading-relaxed">
          {hasFilter ? "فیلتر یا جستجو را عوض کن، یا اولین آگهی را ثبت کن." : "با ثبت آگهی یا گسترش حلقه، فیدت پر می‌شود."}
        </p>
        <div className="flex flex-col gap-2 mt-4 items-center">
          {hasFilter && (
            <button type="button" onClick={onClear} className="text-sm text-primary">
              پاک کردن فیلتر و جستجو
            </button>
          )}
          <Link href="/new" className="text-sm font-semibold text-primary">
            ثبت آگهی
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

function EventStripCard({ event }: { event: CircleEvent }) {
  const { getPerson } = useStore();
  const host = getPerson(event.hostId);
  const count = event.attendees.length;

  return (
    <Card as={Link} href={`/event/${event.id}`} radius="lg" shadow="sm" isPressable className="w-48 shrink-0">
      <CardBody className="p-3">
        {host && (
          <div className="flex items-center gap-2 mb-2">
            <HAvatar name={host.name} level={host.level} size="sm" />
            <span className="text-[11px] text-default-500 truncate">{host.name}</span>
          </div>
        )}
        <div className="w-full h-14 rounded-medium bg-gradient-to-br from-primary-50 to-default-100 flex items-center justify-center text-2xl mb-2">
          {event.image}
        </div>
        <p className="text-[13px] font-semibold line-clamp-2 leading-snug">{event.title}</p>
        <p className="text-[11px] text-primary font-medium mt-1">📅 {formatEventDateDisplay(event.date)}</p>
        <p className="text-[11px] text-default-400 mt-0.5 line-clamp-1">📍 {event.location}</p>
        <p className="text-[10px] text-default-400 mt-1">
          {toPersianDigits(count)} نفر{event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
        </p>
      </CardBody>
    </Card>
  );
}

function RequestStripCard({ request }: { request: Request }) {
  const { getPerson, getOffers } = useStore();
  const requester = getPerson(request.requesterId);
  const offers = getOffers(request.id);

  return (
    <Card as={Link} href={`/request/${request.id}`} radius="lg" shadow="sm" isPressable className="w-48 shrink-0">
      <CardBody className="p-3">
        {requester && (
          <div className="flex items-center gap-2 mb-2">
            <HAvatar name={requester.name} level={requester.level} size="sm" />
            <span className="text-[11px] text-default-500 truncate">{requester.name}</span>
          </div>
        )}
        <div className="w-full h-14 rounded-medium bg-gradient-to-br from-warning-50 to-default-100 flex items-center justify-center text-2xl mb-2">
          {request.image}
        </div>
        <p className="text-[13px] font-semibold line-clamp-2 leading-snug">{request.title}</p>
        <p className="text-[11px] text-default-500 mt-1 line-clamp-1">{request.category}</p>
        {request.budget != null && (
          <p className="text-[11px] text-primary font-bold mt-0.5">تا {formatPrice(request.budget)}</p>
        )}
        {offers.length > 0 && (
          <p className="text-[10px] text-primary font-medium mt-1">{toPersianDigits(offers.length)} پیشنهاد</p>
        )}
      </CardBody>
    </Card>
  );
}
