"use client";

import { useState } from "react";
import Link from "next/link";
import { lazyUi } from "@/lib/lazy-ui";
import ListingCard from "@/components/ListingCard";
import { CircleUsersIcon } from "@/components/Icons";
import {
  effectiveInviteStatus,
  inviteRosterJoined,
  inviteRosterPending,
  inviteRosterTotal,
} from "@/lib/invite";
import { toPersianDigits } from "@/lib/persian";
import { useStore } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { relationLabels } from "@/lib/labels";

const PREVIEW_LIMIT = 2;

const InviteSheet = lazyUi(() => import("@/components/InviteSheet"));

/**
 * Home when the live circle is empty — not a stripped marketplace.
 * One job: invite the first person. Own listings sit apart from the feed.
 */
export default function HomeEmptyCircle() {
  const listings = useStore((s) => s.listings);
  const invites = useStore((s) => s.invites);
  const joinRequests = useStore((s) => s.joinRequests);
  const [showInvite, setShowInvite] = useState(false);

  const pending = invites.filter(
    (inv) => effectiveInviteStatus(inv) === "pending",
  );
  const wave = pending.find((inv) => inv.kind === "wave");
  const waitingCount = pending.reduce(
    (sum, inv) => sum + inviteRosterPending(inv),
    0,
  );
  const mine = listings.filter((l) => l.sellerId === "me");
  const preview = mine.slice(0, PREVIEW_LIMIT);
  const rest = mine.length - preview.length;
  const hasPending = pending.length > 0;
  const hasMine = mine.length > 0;
  const pluralAds = mine.length > 1;
  const adWord = pluralAds ? "آگهی‌هات" : "آگهی‌ات";

  const hasJoinRequests = joinRequests.length > 0;
  const title = hasJoinRequests
    ? "کسی با لینک آمده"
    : hasPending
      ? "دعوتت ارسال شد"
      : hasMine
        ? `${adWord} آماده‌ست`
        : "حلقه‌ات هنوز خالی است";

  const body = hasJoinRequests
    ? `${toPersianDigits(joinRequests.length)} نفر با لینک دعوت آمده‌اند. اول بگو آیا می‌شناسی‌شان.`
    : hasPending
      ? hasMine
        ? `هنوز کسی نپیوسته. تا بپیوندد ${adWord} را هم نمی‌بیند.`
        : "هنوز کسی از لینک دعوت وارد حلقه نشده."
      : hasMine
        ? `یکی از نزدیکانت را دعوت کن تا ${adWord} را ببیند.`
        : "اینجا آگهی‌ها و درخواست‌های آدم‌های آشنا را می‌بینی. برای شروع یکی از نزدیکانت را دعوت کن.";

  const cta = hasJoinRequests
    ? "بررسی درخواست‌ها"
    : hasPending
      ? "دعوت یک نفر دیگر"
      : "دعوت اولین نفر";

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="card px-4 pt-4 pb-3.5 text-center">
        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-2.5">
          <CircleUsersIcon className="w-5 h-5" />
        </div>
        <h2 className="font-extrabold text-[15px] text-ink dark:text-zinc-50 leading-snug">
          {title}
        </h2>
        <p className="text-[13px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
          {body}
        </p>
        {hasJoinRequests ? (
          <Link
            href="/circle"
            className="btn-primary w-full mt-3.5 min-h-11 shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150 inline-flex items-center justify-center"
          >
            {cta}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="btn-primary w-full mt-3.5 min-h-11 shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
          >
            {cta}
          </button>
        )}
        <p className="text-[11px] text-ink-muted dark:text-zinc-500 mt-2 leading-snug">
          دعوت با لینک، واتساپ یا پیامک
        </p>
      </div>

      {hasJoinRequests && (
        <Link
          href="/circle"
          className="card block px-3.5 py-3 active:scale-[0.99] transition-transform duration-150"
        >
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
              درخواست عضویت
            </p>
            <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20 text-[11px] font-bold text-amber-800 dark:text-amber-200 nums">
              {toPersianDigits(joinRequests.length)}
            </span>
          </div>
          <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
            اول بگو آیا می‌شناسی‌شان — تا آن وقت عضو حلقه نیستند.
          </p>
          <p className="mt-2 text-[13px] font-semibold text-brand-700 dark:text-brand-400">
            بررسی
          </p>
        </Link>
      )}

      {hasPending && (
        <Link
          href="/circle"
          className="card block px-3.5 py-3 active:scale-[0.99] transition-transform duration-150"
        >
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
              دعوت‌های در انتظار
            </p>
            <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted nums">
              {toPersianDigits(waitingCount || pending.length)}
            </span>
          </div>
          <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
            {waitingCount > 0
              ? `${toPersianDigits(waitingCount)} نفر هنوز نپیوسته‌اند.`
              : "هنوز کسی نپیوسته."}
          </p>
          {wave && (
            <p className="text-[12px] text-ink-muted mt-1 nums">
              لینک {relationLabels[wave.relationType]} ·{" "}
              {toPersianDigits(inviteRosterJoined(wave))} از{" "}
              {toPersianDigits(inviteRosterTotal(wave))} پیوسته‌اند
            </p>
          )}
          <p className="mt-2 text-[13px] font-semibold text-brand-700 dark:text-brand-400">
            دیدن دعوت‌ها
          </p>
        </Link>
      )}

      {hasMine && (
        <section>
          <SectionHeading label="آگهی‌های من" count={mine.length} />
          <div className="space-y-2.5">
            {preview.map((listing) => (
              <OwnListingPreview key={listing.id} listing={listing} />
            ))}
          </div>
          {rest > 0 && (
            <Link
              href="/profile"
              className="mt-2.5 inline-block text-[12px] font-semibold text-brand-700 dark:text-brand-400"
            >
              و {toPersianDigits(rest)} آگهی دیگر
            </Link>
          )}
        </section>
      )}

      {showInvite && <InviteSheet onClose={() => setShowInvite(false)} />}
    </div>
  );
}

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-1.5 px-0.5">
      <h3 className="text-[13px] font-bold text-ink dark:text-zinc-200">
        {label}
      </h3>
      <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted nums">
        {toPersianDigits(count)}
      </span>
    </div>
  );
}

function OwnListingPreview({ listing }: { listing: Listing }) {
  return (
    <ListingCard
      listing={listing}
      compactTrust
      hideTrust
      showOpenHint
      audienceHint="فعلاً فقط خودت می‌بینی"
    />
  );
}
