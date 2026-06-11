"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import SocialCreditCard from "@/components/SocialCreditCard";
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
import { buildSocialCredit } from "@/lib/social-credit";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";
import type { TrustLevel } from "@/lib/types";

const LEVELS: TrustLevel[] = ["A", "B", "C"];

export default function PersonProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { getPerson, listings, requests, removePerson, setLevel } = useStore();
  const { show } = useToast();

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

  const socialCredit = buildSocialCredit(person, listings, theirListings.length);

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
              <p className="text-xs text-zinc-400 mt-1">
                عضو از {socialCredit.memberSince} · آخرین فعالیت{" "}
                {socialCredit.lastActive}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <SocialCreditCard
          stats={socialCredit}
          subtitle={`شاخص اعتماد ${person.name} در شبکه`}
          circleLabel="آگهی فعال"
        />
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

      {/* Circle management (only for people in my circle) */}
      {person.inMyCircle && (
        <section className="px-4 pt-3">
          <div className="card p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                <span>👥</span> در حلقه‌ی شماست
              </span>
              <button
                onClick={() => {
                  removePerson(id);
                  show(`${person.name} از حلقه حذف شد`);
                  router.push("/circle");
                }}
                className="shrink-0 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-full px-3 py-1.5 active:scale-95 transition"
              >
                حذف از حلقه
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-2">سطح اعتماد</p>
            <div className="flex gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setLevel(id, lvl);
                    show(`سطح ${person.name} به ${levelShort[lvl]} تغییر کرد`);
                  }}
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
          </div>
        </section>
      )}

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-5">
      <h2 className="text-sm font-bold text-zinc-700 mb-2">{title}</h2>
      {children}
    </section>
  );
}
