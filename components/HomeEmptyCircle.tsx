"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { lazyUi } from "@/lib/lazy-ui";
import ActivationPath from "@/components/ActivationPath";
import AddedYouBanner from "@/components/AddedYouBanner";
import ListingCard from "@/components/ListingCard";
import { CircleUsersIcon, LockIcon, ShieldCheckIcon } from "@/components/Icons";
import { withBasePath } from "@/lib/avatar";
import {
  effectiveInviteStatus,
  inviteRosterJoined,
  inviteRosterPending,
  inviteRosterTotal,
  rosterWaveComplete,
} from "@/lib/invite";
import { toPersianDigits } from "@/lib/persian";
import { useStore } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { relationLabels } from "@/lib/labels";

const PREVIEW_LIMIT = 2;

const InviteSheet = lazyUi(() => import("@/components/InviteSheet"));

/**
 * Home when the live circle is empty — not a stripped marketplace.
 * Activation path + invite (cold) or place-inviter (invitee).
 */
export default function HomeEmptyCircle({
  justPostedId,
}: {
  justPostedId?: string | null;
}) {
  const me = useStore((s) => s.me);
  const listings = useStore((s) => s.listings);
  const invites = useStore((s) => s.invites);
  const joinRequests = useStore((s) => s.joinRequests);
  const addedYou = useStore((s) => s.addedYou);
  const [showInvite, setShowInvite] = useState(false);

  const pending = invites.filter(
    (inv) =>
      effectiveInviteStatus(inv) === "pending" && !rosterWaveComplete(inv),
  );
  const hasPending = pending.length > 0;
  const isInvitee = addedYou.length > 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasPending || isInvitee) return;
    if (new URLSearchParams(window.location.search).get("invite") === "1") {
      setShowInvite(true);
    }
  }, [hasPending, isInvitee]);
  const wave = pending.find((inv) => inv.kind === "wave");
  const waitingCount = pending.reduce(
    (sum, inv) => sum + inviteRosterPending(inv),
    0,
  );
  const mine = listings.filter((l) => l.sellerId === "me");
  const posted = justPostedId
    ? mine.find((l) => l.id === justPostedId)
    : undefined;
  const restMine = posted ? mine.filter((l) => l.id !== posted.id) : mine;
  const preview = restMine.slice(0, PREVIEW_LIMIT);
  const rest = restMine.length - preview.length;
  const hasMine = mine.length > 0;
  const pluralAds = mine.length > 1;
  const adWord = pluralAds ? "آگهی‌هات" : "آگهی‌ات";

  const hasJoinRequests = joinRequests.length > 0;
  const coldEmpty =
    !isInvitee &&
    !hasJoinRequests &&
    !hasPending &&
    !hasMine &&
    !posted;

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
        : "تا اولین نفر نپیوندد فید خالی می‌ماند — این عادی است. لینک را برای نزدیکت بفرست.";

  const cta = hasJoinRequests
    ? "بررسی درخواست‌ها"
    : hasPending
      ? "دعوت یک نفر دیگر"
      : "دعوت اولین نفر";

  const pendingCount = waitingCount || pending.length;
  const pendingLine =
    pendingCount === 1
      ? "۱ دعوت در انتظار"
      : `${toPersianDigits(pendingCount)} دعوت در انتظار`;

  const avatarSrc = me.avatar?.trim()
    ? withBasePath(me.avatar)
    : withBasePath("/avatars/01.webp");

  return (
    <div
      className={`px-4 pt-4 pb-8 ${hasPending ? "space-y-3" : "space-y-4"}`}
    >
      {posted ? (
        <section id="home-just-posted">
          <p className="text-[12px] font-bold text-brand-700 dark:text-brand-300 px-0.5 mb-1.5">
            آگهی تو همین حالا ثبت شد
          </p>
          <ListingCard
            listing={posted}
            compactTrust
            hideTrust
            showOpenHint
            highlight
            audienceHint={
              hasPending || hasJoinRequests
                ? undefined
                : "فعلاً فقط خودت می‌بینی"
            }
          />
        </section>
      ) : null}

      <ActivationPath
        showActions={false}
        compact={hasPending}
        onInvite={() => setShowInvite(true)}
      />

      {isInvitee ? (
        <AddedYouBanner />
      ) : (
        <div
          className={`card overflow-hidden ${
            coldEmpty ? "listing-detail-rise" : ""
          }`}
        >
          {coldEmpty ? <EmptyCircleStage avatarSrc={avatarSrc} /> : null}
          <div
            className={`px-4 pb-4 text-center ${coldEmpty ? "pt-3" : "pt-5"}`}
          >
            {!coldEmpty ? (
              <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-2.5">
                <CircleUsersIcon className="w-5 h-5" />
              </div>
            ) : null}
            <h2 className="font-extrabold text-[15px] text-ink dark:text-zinc-50 leading-snug tracking-tight">
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
            {hasPending ? (
              <div className="mt-3">
                <Link
                  href="/circle"
                  className="inline-flex min-h-9 items-center justify-center text-[12px] font-semibold text-brand-700 dark:text-brand-400 active:opacity-70"
                >
                  {pendingLine} · دیدن
                </Link>
                {wave ? (
                  <p className="mt-1 text-[11px] text-ink-muted dark:text-zinc-500 nums leading-snug">
                    لینک {relationLabels[wave.relationType]} ·{" "}
                    {toPersianDigits(inviteRosterJoined(wave))} از{" "}
                    {toPersianDigits(inviteRosterTotal(wave))} پیوسته‌اند
                  </p>
                ) : null}
              </div>
            ) : null}
            {coldEmpty ? (
              <Link
                href="/new"
                className="mt-2.5 inline-flex min-h-10 items-center justify-center text-[13px] font-semibold text-brand-700 dark:text-brand-300 active:opacity-70"
              >
                یا اول آگهی بگذار — فعلاً فقط خودت می‌بینی
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {coldEmpty ? <AfterJoinPanel /> : null}

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

      {hasMine && (!posted || restMine.length > 0) && (
        <section>
          <SectionHeading
            label="آگهی‌های من"
            count={posted ? restMine.length : mine.length}
          />
          {hasPending || hasJoinRequests ? (
            <p className="mb-2 px-0.5 text-[12px] text-ink-muted dark:text-zinc-400 leading-snug">
              آماده‌ست — بعد از پیوستن دیده می‌شود
            </p>
          ) : null}
          <div className="space-y-2.5">
            {preview.map((listing) => (
              <OwnListingPreview
                key={listing.id}
                listing={listing}
                showAudienceHint={!hasPending && !hasJoinRequests}
              />
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

      {showInvite && (
        <InviteSheet firstRun onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}

function EmptyCircleStage({ avatarSrc }: { avatarSrc: string }) {
  return (
    <div
      className="relative mx-auto mt-4 mb-1 h-[9.75rem] w-[min(100%,16.5rem)]"
      aria-hidden
    >
      <span className="absolute inset-[12%] rounded-full border border-stone-200/90 dark:border-zinc-700" />
      <span className="absolute inset-[30%] rounded-full border border-brand-600/25" />

      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-[48%] flex-col items-center gap-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt=""
          width={52}
          height={52}
          className="h-[3.25rem] w-[3.25rem] rounded-full object-cover bg-brand-50 ring-[2.5px] ring-brand-600"
          draggable={false}
        />
        <span className="text-[11px] font-bold text-brand-700 dark:text-brand-300">
          تو
        </span>
      </div>

      <EmptySeat className="left-1/2 top-[6%] -translate-x-1/2" label="مینا؟" />
      <EmptySeat className="bottom-[8%] left-[10%]" label="رضا؟" />
      <EmptySeat className="bottom-[8%] right-[10%]" label="سارا؟" />
    </div>
  );
}

function EmptySeat({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className={`absolute flex flex-col items-center gap-0.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed border-brand-600/70 bg-brand-50/80 text-[15px] font-bold leading-none text-brand-600 dark:bg-brand-500/10">
        +
      </span>
      <span className="text-[11px] font-semibold text-ink-faint">{label}</span>
    </div>
  );
}

function AfterJoinPanel() {
  return (
    <section className="rounded-2xl border border-stone-200/80 bg-[color:var(--circle-surface)] px-3.5 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/70">
      <p className="text-[12px] font-bold text-ink dark:text-zinc-100">
        وقتی اولین نفر بپیوندد
      </p>
      <ul className="mt-2.5 space-y-2.5">
        <AfterJoinRow
          Icon={CircleUsersIcon}
          title="فید از آشنایان پر می‌شود"
          detail="آگهی و درخواست کسانی که می‌شناسی"
        />
        <AfterJoinRow
          Icon={ShieldCheckIcon}
          title="مسیر اعتماد دیده می‌شود"
          detail="می‌فهمی از چه کسی به فروشنده می‌رسی"
        />
        <AfterJoinRow
          Icon={LockIcon}
          title="غریبه اینجا نیست"
          detail="بدون مسیر اعتماد، چیزی دیده نمی‌شود"
        />
      </ul>
    </section>
  );
}

function AfterJoinRow({
  Icon,
  title,
  detail,
}: {
  Icon: (props: { className?: string }) => ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-2.5 text-start">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug">
          {title}
        </span>
        <span className="mt-0.5 block text-[12px] text-ink-muted dark:text-zinc-400 leading-relaxed">
          {detail}
        </span>
      </span>
    </li>
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

function OwnListingPreview({
  listing,
  showAudienceHint = true,
}: {
  listing: Listing;
  showAudienceHint?: boolean;
}) {
  return (
    <ListingCard
      listing={listing}
      compactTrust
      hideTrust
      showOpenHint
      audienceHint={
        showAudienceHint ? "فعلاً فقط خودت می‌بینی" : undefined
      }
    />
  );
}
