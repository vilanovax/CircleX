"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { ShieldCheckIcon } from "@/components/Icons";
import {
  badgeEmoji,
  badgeLabels,
  formatPrice,
  listingTypeEmoji,
} from "@/lib/labels";

export default function ProfilePage() {
  const { me, people, listings } = useStore();
  const myCircle = people.filter((p) => p.inMyCircle);
  const myListings = listings.filter((l) => l.sellerId === "me");

  // Badges I have given to others' listings.
  const myGivenBadges = listings.flatMap((l) =>
    l.endorsements.filter((e) => e.personId === "me").map((e) => ({ l, e })),
  );

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header title="پروفایل اعتماد" />

      {/* Identity card */}
      <div className="px-4 pt-4">
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <Avatar emoji={me.avatar} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-zinc-900">{me.name}</h2>
                <span className="chip bg-green-50 text-levelA">
                  <ShieldCheckIcon className="w-3.5 h-3.5" /> تأییدشده
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-0.5">📍 {me.city}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            <Stat value={me.deals} label="معامله‌ی موفق" />
            <Stat value={myCircle.length} label="در حلقه‌ی من" />
            <Stat value={myGivenBadges.length} label="تأیید داده‌ام" />
          </div>
        </div>
      </div>

      {/* Trust score explainer */}
      <div className="px-4 pt-3">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-zinc-800">اعتبار اجتماعی</span>
            <span className="text-sm font-bold text-levelA">عالی</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full w-[86%] bg-gradient-to-l from-levelA to-green-400" />
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
            اعتبار شما بر اساس معامله‌های موفق، تأییدهای دریافتی، و افرادی که شما
            را در حلقه‌شان دارند محاسبه می‌شود.
          </p>
        </div>
      </div>

      {/* My listings */}
      <Section title={`آگهی‌های من (${myListings.length})`}>
        {myListings.length === 0 ? (
          <EmptyHint
            text="هنوز آگهی‌ای ثبت نکرده‌اید."
            href="/new"
            cta="ثبت اولین آگهی"
          />
        ) : (
          <div className="space-y-2">
            {myListings.map((l) => (
              <Link
                key={l.id}
                href={`/listing/${l.id}`}
                className="card p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center text-2xl shrink-0">
                  {l.image}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-zinc-900 truncate">
                    {listingTypeEmoji[l.type]} {l.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {l.price != null ? (
                      <span className="nums">{formatPrice(l.price)}</span>
                    ) : (
                      "رایگان / توافقی"
                    )}{" "}
                    · {l.postedAt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Badges I have given */}
      <Section title="تأییدهایی که داده‌ام">
        {myGivenBadges.length === 0 ? (
          <p className="text-xs text-zinc-400 pr-1">
            هنوز آگهی‌ای را تأیید نکرده‌اید. در صفحه‌ی هر آگهی می‌توانید نشان
            اعتماد خود را اضافه کنید.
          </p>
        ) : (
          <div className="space-y-2">
            {myGivenBadges.map(({ l, e }, i) => (
              <Link
                key={i}
                href={`/listing/${l.id}`}
                className="card p-3 flex items-center gap-2.5 text-sm"
              >
                <span className="text-lg">{badgeEmoji[e.type]}</span>
                <span className="flex-1 min-w-0">
                  <span className="text-zinc-500">{badgeLabels[e.type]} — </span>
                  <span className="font-medium text-zinc-800 truncate">{l.title}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <BottomNav />
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-xl font-extrabold text-brand-700 nums">{value}</p>
      <p className="text-[11px] text-zinc-400 mt-0.5">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-5">
      <h2 className="text-sm font-bold text-zinc-700 mb-2">{title}</h2>
      {children}
    </section>
  );
}

function EmptyHint({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="card p-5 text-center">
      <p className="text-sm text-zinc-400 mb-3">{text}</p>
      <Link href={href} className="btn-primary inline-block">
        {cta}
      </Link>
    </div>
  );
}
