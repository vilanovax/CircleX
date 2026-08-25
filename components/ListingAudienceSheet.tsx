"use client";

import { useMemo } from "react";
import SheetShell from "@/components/SheetShell";
import Avatar from "@/components/Avatar";
import { CIRCLE_RELATION_ORDER } from "@/lib/circle-member";
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
}: {
  privacy: Privacy;
  excludePersonIds?: string[];
  excludeRelationTypes?: RelationType[];
  onClose: () => void;
}) {
  const people = useStore((s) => s.people);
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

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="listing-audience-title"
      header={
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2
              id="listing-audience-title"
              className="min-w-0 font-extrabold text-[20px] text-ink dark:text-zinc-50 tracking-tight leading-tight"
            >
              چه کسانی این آگهی را می‌بینند؟
            </h2>
            {members.length > 0 ? (
              <span className="nums mt-0.5 shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[12px] font-bold text-ink dark:bg-zinc-800 dark:text-zinc-100">
                {count}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted dark:text-zinc-400">
            {members.length === 0
              ? `با تنظیم «${privacyLabels[privacy]}» الان کسی از حلقه‌ات این آگهی را نمی‌بیند.`
              : "گروه اعتماد تو، بدون کسانی که کنار گذاشته‌ای."}
          </p>
          {privacy === "referral" ? (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-muted dark:text-zinc-400">
              آشنایانِ حلقه که مستقیم در حلقه‌ات نیستند در این فهرست نیستند،
              ولی اگر مسیر ارتباط داشته باشند ممکن است آگهی را ببینند.
            </p>
          ) : null}
        </div>
      }
    >
      {members.length === 0 ? (
        <p className="rounded-2xl bg-stone-50 px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted dark:bg-zinc-800/55">
          وقتی کسی را به حلقه اضافه کنی یا محدوده را عوض کنی، اسمش اینجا می‌آید.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group, groupIndex) => (
            <section key={group.relation}>
              <div className="mb-2.5 flex items-baseline justify-between gap-2 border-b border-stone-200/70 pb-1.5 dark:border-zinc-800">
                <h3 className="text-[13px] font-bold text-ink dark:text-zinc-200">
                  {relationLabels[group.relation]}
                </h3>
                <span className="nums text-[11px] font-semibold text-ink-faint dark:text-zinc-500">
                  {toPersianDigits(group.members.length)}
                </span>
              </div>
              <ul className="grid grid-cols-5 gap-x-1 gap-y-3">
                {group.members.map((person, index) => (
                  <li
                    key={person.id}
                    className="flex min-w-0 flex-col items-center gap-1"
                  >
                    <Avatar
                      name={person.name}
                      src={person.avatar}
                      size="sm"
                      showLevel={false}
                      eager={groupIndex === 0 && index < 8}
                    />
                    <p className="w-full truncate text-center text-[12px] font-semibold leading-snug text-ink dark:text-zinc-100">
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
