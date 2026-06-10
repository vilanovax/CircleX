"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import TrustPath from "@/components/TrustPath";
import ListingCard from "@/components/ListingCard";
import RequestCard from "@/components/RequestCard";
import { ChatIcon, ShieldCheckIcon } from "@/components/Icons";
import {
  levelChip,
  levelShort,
  relationEmoji,
  relationLabels,
} from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import { canView } from "@/lib/trust";

export default function PersonProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { getPerson, listings, requests } = useStore();

  const person = getPerson(id);
  if (!person || id === "me") {
    return (
      <main className="min-h-[100dvh]">
        <Header title="پروفایل" back />
        <p className="text-center text-zinc-400 py-20 text-sm">کاربر پیدا نشد.</p>
      </main>
    );
  }

  const theirListings = listings.filter(
    (l) => l.sellerId === id && canView(l, getPerson),
  );
  const theirRequests = requests.filter(
    (r) => r.requesterId === id && canView(r, getPerson),
  );

  // Derive a representative trust path from any of their posts.
  const pathSource =
    theirListings.find((l) => l.trustPath.length > 0) ??
    theirRequests.find((r) => r.trustPath.length > 0);
  const trustPath = pathSource?.trustPath ?? [];

  const endorsementsReceived = theirListings.reduce(
    (sum, l) => sum + l.endorsements.length,
    0,
  );

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header title="پروفایل اعتماد" back />

      {/* Identity */}
      <div className="px-4 pt-4">
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <Avatar emoji={person.avatar} level={person.level} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-lg font-bold text-zinc-900">{person.name}</h2>
                <span className={`chip ${levelChip[person.level]}`}>
                  {levelShort[person.level]}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                <span className="chip bg-zinc-100 text-zinc-500">
                  {relationEmoji[person.relation]} {relationLabels[person.relation]}
                </span>
              </p>
              {person.note && (
                <p className="text-xs text-zinc-400 mt-1.5">{person.note}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            <Stat value={person.deals} label="معامله‌ی موفق" />
            <Stat value={theirListings.length} label="آگهی فعال" />
            <Stat value={endorsementsReceived} label="تأیید دریافتی" />
          </div>
        </div>
      </div>

      {/* Trust connection */}
      <section className="px-4 pt-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheckIcon className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-sm text-zinc-800">
              ارتباط شما با {person.name}
            </h2>
          </div>
          <TrustPath
            posterId={id}
            trustPath={trustPath}
            variant="full"
            posterRole={relationLabels[person.relation]}
            viewerRole="شما"
          />
        </div>
      </section>

      {/* Their listings */}
      {theirListings.length > 0 && (
        <Section title={`آگهی‌های ${person.name}`}>
          <div className="space-y-3">
            {theirListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </Section>
      )}

      {/* Their requests */}
      {theirRequests.length > 0 && (
        <Section title={`درخواست‌های ${person.name}`}>
          <div className="space-y-3">
            {theirRequests.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        </Section>
      )}

      {theirListings.length === 0 && theirRequests.length === 0 && (
        <p className="text-center text-zinc-400 text-sm py-10">
          آگهی یا درخواست فعالی ندارد.
        </p>
      )}

      {/* Sticky message action */}
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="app-shell !min-h-0 !shadow-none bg-transparent">
          <div className="pointer-events-auto bg-white/95 backdrop-blur border-t border-zinc-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Link
              href={`/messages/${id}`}
              className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-2"
            >
              <ChatIcon className="w-5 h-5" />
              پیام به {person.name}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-xl font-extrabold text-brand-700 nums">
        {toPersianDigits(value)}
      </p>
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
