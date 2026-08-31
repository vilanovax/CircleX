"use client";

import { useMemo } from "react";
import Link from "next/link";
import SheetShell from "@/components/SheetShell";
import Avatar from "@/components/Avatar";
import { CircleUsersIcon } from "@/components/Icons";
import { activeCircleCount, CIRCLE_RELATION_ORDER } from "@/lib/circle-member";
import {
  effectiveInviteStatus,
  inviteRosterPending,
  rosterWaveComplete,
} from "@/lib/invite";
import { listingVisibleCircleMembers } from "@/lib/listing-privacy";
import { privacyLabels, relationLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import { useStore } from "@/lib/store";
import type { Person, Privacy, RelationType } from "@/lib/types";

function groupVisibleMembers(members: Person[]) {
  const buckets: Record<RelationType, Person[]> = {
    family: [],
    friend: [],
    colleague: [],
    neighbor: [],
    acquaintance: [],
  };
  for (const person of members) buckets[person.relation].push(person);
  return CIRCLE_RELATION_ORDER.filter(
    (relation) => buckets[relation].length > 0,
  ).map((relation) => ({ relation, members: buckets[relation] }));
}

export default function ListingAudienceSheet({
  privacy,
  excludePersonIds,
  excludeRelationTypes,
  onClose,
  /** Compose / edit: privacy controls sit behind this sheet. */
  canChangePrivacy = false,
  onChangePrivacy,
}: {
  privacy: Privacy;
  excludePersonIds?: string[];
  excludeRelationTypes?: RelationType[];
  onClose: () => void;
  canChangePrivacy?: boolean;
  onChangePrivacy?: () => void;
}) {
  const people = useStore((s) => s.people);
  const invites = useStore((s) => s.invites);
  const circleSize = activeCircleCount(people);
  const members = useMemo(
    () =>
      listingVisibleCircleMembers({
        people,
        privacy,
        excludePersonIds,
        excludeRelationTypes,
      }),
    [people, privacy, excludePersonIds, excludeRelationTypes],
  );
  const groups = useMemo(() => groupVisibleMembers(members), [members]);
  const count = toPersianDigits(members.length);

  const waitingCount = useMemo(
    () =>
      invites
        .filter(
          (inv) =>
            effectiveInviteStatus(inv) === "pending" &&
            !rosterWaveComplete(inv),
        )
        .reduce((sum, inv) => sum + inviteRosterPending(inv), 0),
    [invites],
  );

  const emptyCircle = circleSize === 0;
  const emptyAudience = members.length === 0;
  const hasExclusions =
    (excludePersonIds?.length ?? 0) > 0 ||
    (excludeRelationTypes?.length ?? 0) > 0;

  const emptyHeadline = emptyCircle
    ? "حلقه‌ات هنوز خالی است"
    : hasExclusions
      ? "با محدودیت‌های فعلی کسی نمی‌بیند"
      : `با «${privacyLabels[privacy]}» کسی در محدوده نیست`;

  const emptyBody = emptyCircle
    ? waitingCount > 0
      ? `${toPersianDigits(waitingCount)} دعوت در انتظار است. تا بپیوندند، این آگهی را کسی نمی‌بیند.`
      : "تا اولین نفر نپیوندد، این آگهی را کسی نمی‌بیند — تنظیم محدوده به‌تنهایی کافی نیست."
    : hasExclusions
      ? "محدوده یا کنارگذاشتن افراد باعث شده کسی از حلقه‌ات در این فهرست نباشد."
      : `الان کسی با سطح اعتماد «${privacyLabels[privacy]}» در حلقه‌ات نیست. محدوده را گسترده‌تر کن یا کسی با این سطح اضافه کن.`;

  const emptyFooter =
    emptyCircle || (!canChangePrivacy && emptyAudience) ? (
      <div className="flex flex-col gap-2">
        <Link
          href="/?invite=1"
          onClick={onClose}
          className="btn-primary w-full min-h-11 inline-flex items-center justify-center shadow-md shadow-brand-600/15 active:scale-[0.98] transition-transform duration-150"
        >
          دعوت به حلقه
        </Link>
        {canChangePrivacy && onChangePrivacy ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onChangePrivacy();
            }}
            className="min-h-10 text-[13px] font-semibold text-brand-700 dark:text-brand-400"
          >
            عوض کردن محدوده نمایش
          </button>
        ) : waitingCount > 0 ? (
          <Link
            href="/circle"
            onClick={onClose}
            className="min-h-10 inline-flex items-center justify-center text-[13px] font-semibold text-brand-700 dark:text-brand-400"
          >
            دیدن دعوت‌های در انتظار
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 text-[13px] font-semibold text-ink-muted dark:text-zinc-400"
          >
            بستن
          </button>
        )}
      </div>
    ) : canChangePrivacy && onChangePrivacy ? (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            onClose();
            onChangePrivacy();
          }}
          className="btn-primary w-full min-h-11 shadow-md shadow-brand-600/15 active:scale-[0.98] transition-transform duration-150"
        >
          عوض کردن محدوده نمایش
        </button>
        <Link
          href="/?invite=1"
          onClick={onClose}
          className="min-h-10 inline-flex items-center justify-center text-[13px] font-semibold text-brand-700 dark:text-brand-400"
        >
          دعوت نفر جدید
        </Link>
      </div>
    ) : (
      <button
        type="button"
        onClick={onClose}
        className="btn-ghost w-full !py-3.5"
      >
        بستن
      </button>
    );

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="listing-audience-title"
      zClass="z-[75]"
      hugContent={emptyAudience}
      footer={emptyAudience ? emptyFooter : undefined}
      header={
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="listing-audience-title"
              className="min-w-0 font-extrabold text-[20px] text-ink dark:text-zinc-50 tracking-tight leading-tight"
            >
              چه کسانی این آگهی را می‌بینند؟
            </h2>
            {members.length > 0 ? (
              <span className="nums inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-stone-100 px-1.5 text-[11px] font-bold text-ink dark:bg-zinc-800 dark:text-zinc-100">
                {count}
              </span>
            ) : null}
          </div>
          {!emptyAudience ? (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-muted dark:text-zinc-400">
              از حلقه‌ات، بدون کسانی که کنار گذاشته‌ای.
            </p>
          ) : null}
          {!emptyAudience && privacy === "referral" ? (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-muted dark:text-zinc-400">
              آشنایانِ حلقه که مستقیم در حلقه‌ات نیستند در این فهرست نیستند،
              ولی اگر مسیر ارتباط داشته باشند ممکن است آگهی را ببینند.
            </p>
          ) : null}
        </div>
      }
    >
      {emptyAudience ? (
        <div className="rounded-2xl border border-stone-200/80 bg-stone-50/90 px-3.5 py-4 text-center dark:border-zinc-800 dark:bg-zinc-800/40">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15">
            <CircleUsersIcon className="h-5 w-5" />
          </span>
          <p className="mt-2.5 text-[14px] font-bold text-ink dark:text-zinc-100 leading-snug">
            {emptyHeadline}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted dark:text-zinc-400">
            {emptyBody}
          </p>
          {!emptyCircle ? (
            <p className="mt-2 text-[11px] leading-snug text-ink-faint dark:text-zinc-500">
              محدوده فعلی: {privacyLabels[privacy]}
              {circleSize > 0
                ? ` · ${toPersianDigits(circleSize)} نفر در حلقه`
                : null}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, groupIndex) => (
            <section key={group.relation}>
              <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-ink dark:text-zinc-200">
                {relationLabels[group.relation]}
                <span className="nums text-[11px] font-semibold text-ink-faint dark:text-zinc-500">
                  {toPersianDigits(group.members.length)}
                </span>
              </h3>
              <ul className="grid grid-cols-4 gap-x-2 gap-y-3">
                {group.members.map((person, index) => (
                  <li
                    key={person.id}
                    className="flex min-w-0 flex-col items-center gap-1.5"
                  >
                    <Avatar
                      name={person.name}
                      src={person.avatar}
                      size="sm"
                      showLevel={false}
                      eager={groupIndex === 0 && index < 8}
                    />
                    <p className="w-full truncate text-center text-[12px] font-medium leading-snug text-ink dark:text-zinc-100">
                      {person.name}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </SheetShell>
  );
}
