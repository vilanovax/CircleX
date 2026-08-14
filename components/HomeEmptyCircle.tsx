"use client";

import { useState } from "react";
import Link from "next/link";
import InviteSheet, { InviteSharePanel } from "@/components/InviteSheet";
import ListingCard from "@/components/ListingCard";
import { CircleUsersIcon } from "@/components/Icons";
import { effectiveInviteStatus } from "@/lib/invite";
import { maskPhone } from "@/lib/phone";
import { toPersianDigits } from "@/lib/persian";
import { useStore } from "@/lib/store";
import type { Invite, Listing } from "@/lib/types";

const PREVIEW_LIMIT = 2;

/**
 * Home when the live circle is empty — not a stripped marketplace.
 * One job: invite the first person. Own listings sit apart from the feed.
 */
export default function HomeEmptyCircle() {
  const { listings, invites, me } = useStore();
  const [showInvite, setShowInvite] = useState(false);
  const [reshare, setReshare] = useState<Invite | null>(null);

  const pending = invites.filter(
    (inv) => effectiveInviteStatus(inv) === "pending",
  );
  const mine = listings.filter((l) => l.sellerId === "me");
  const preview = mine.slice(0, PREVIEW_LIMIT);
  const rest = mine.length - preview.length;
  const hasPending = pending.length > 0;
  const hasMine = mine.length > 0;
  const pluralAds = mine.length > 1;
  const adWord = pluralAds ? "آگهی‌هات" : "آگهی‌ات";

  const title = hasPending
    ? "دعوتت ارسال شد"
    : hasMine
      ? `${adWord} آماده‌ست`
      : "حلقه‌ات هنوز خالی است";

  const body = hasPending
    ? hasMine
      ? `هنوز کسی نپیوسته. تا بپیوندد ${adWord} را هم نمی‌بیند.`
      : "هنوز کسی از لینک دعوت وارد حلقه نشده."
    : hasMine
      ? `یکی از نزدیکانت را دعوت کن تا ${adWord} را ببیند.`
      : "اینجا آگهی‌ها و درخواست‌های آدم‌های آشنا را می‌بینی. برای شروع یکی از نزدیکانت را دعوت کن.";

  const cta = hasPending ? "دعوت یک نفر دیگر" : "دعوت اولین نفر";

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="card px-4 pt-4 pb-3.5 text-center">
        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-2.5">
          <CircleUsersIcon className="w-5 h-5" />
        </div>
        <h2 className="font-extrabold text-[15px] text-ink dark:text-zinc-50 leading-snug">
          {title}
        </h2>
        <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
          {body}
        </p>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="btn-primary w-full mt-3.5 min-h-11"
        >
          {cta}
        </button>
        <p className="text-[11px] text-ink-muted dark:text-zinc-500 mt-2 leading-snug">
          دعوت با لینک، واتساپ یا پیامک
        </p>
      </div>

      {hasPending && (
        <section>
          <SectionHeading label="دعوت‌های در انتظار" count={pending.length} />
          <ul className="card divide-y divide-stone-100 dark:divide-zinc-800 overflow-hidden">
            {pending.map((inv) => (
              <PendingInviteRow
                key={inv.id}
                invite={inv}
                onReshare={() => setReshare(inv)}
              />
            ))}
          </ul>
        </section>
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
      {reshare && (
        <InviteSharePanel
          invite={reshare}
          inviterName={me.name}
          onClose={() => setReshare(null)}
        />
      )}
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

function PendingInviteRow({
  invite,
  onReshare,
}: {
  invite: Invite;
  onReshare: () => void;
}) {
  const label = invite.invitedPhone
    ? `دعوت برای ${maskPhone(invite.invitedPhone)}`
    : "لینک دعوت";

  return (
    <li className="flex items-center gap-3 px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[13px] text-ink dark:text-zinc-100 truncate">
          {label}
        </p>
        <p className="text-[11px] text-ink-muted mt-0.5">هنوز نپیوسته</p>
      </div>
      <button
        type="button"
        onClick={onReshare}
        className="shrink-0 text-[12px] font-semibold text-brand-700 dark:text-brand-400 px-2.5 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-500/15"
      >
        اشتراک دوباره
      </button>
    </li>
  );
}
