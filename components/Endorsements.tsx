"use client";

import { useState } from "react";
import type { BadgeType, Endorsement } from "@/lib/types";
import { useStore } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import Avatar from "./Avatar";
import { badgeResultLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";

type PersonWord = {
  personId: string;
  types: BadgeType[];
  note?: string;
  hidden?: boolean;
};

export function visibleEndorsements(endorsements: Endorsement[]): Endorsement[] {
  return endorsements.filter((e) => !e.hidden || e.personId === "me");
}

export function groupByPerson(endorsements: Endorsement[]): PersonWord[] {
  const order: string[] = [];
  const map = new Map<string, PersonWord>();
  for (const e of endorsements) {
    const existing = map.get(e.personId);
    if (!existing) {
      order.push(e.personId);
      map.set(e.personId, {
        personId: e.personId,
        types: e.type === "word" ? [] : [e.type],
        note: e.note?.trim() || undefined,
        hidden: e.hidden,
      });
      continue;
    }
    if (e.type !== "word" && !existing.types.includes(e.type)) {
      existing.types.push(e.type);
    }
    if (!existing.note && e.note?.trim()) existing.note = e.note.trim();
    if (e.hidden) existing.hidden = true;
  }
  return order.map((id) => map.get(id)!);
}

/** Compact member note — no official shield; uses endorser avatar. */
export function EndorsementSummary({
  endorsements,
}: {
  endorsements: Endorsement[];
}) {
  const getPerson = useStore((s) => s.getPerson);
  const groups = groupByPerson(endorsements).filter(
    (g) => !g.hidden || g.personId === "me",
  );
  if (groups.length === 0) return null;

  if (groups.length === 1) {
    const group = groups[0]!;
    const person = getPerson(group.personId);
    const name =
      group.personId === "me" ? "تو" : (person?.name ?? "یک آشنا");
    const firstType = group.types[0];
    return (
      <div className="flex items-start gap-2 text-[12px] text-ink-muted dark:text-zinc-400 leading-snug">
        {person ? (
          <Avatar name={person.name} src={person.avatar} showLevel={false} size="sm" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-800 shrink-0" />
        )}
        <p className="pt-1.5">
          <span className="font-semibold text-ink dark:text-zinc-200">{name}</span>
          {firstType ? (
            <>
              {" گفته "}
              {badgeResultLabels[firstType]}
            </>
          ) : group.note ? (
            <>
              {": "}
              «{group.note}»
            </>
          ) : (
            " حرفی گذاشته است."
          )}
        </p>
      </div>
    );
  }

  return (
    <p className="text-[12px] text-ink-muted leading-snug">
      {toPersianDigits(groups.length)} نفر گفته‌اند این آگهی را
      دیده‌اند یا فروشنده را می‌شناسند.
    </p>
  );
}

/** Detailed list of who endorsed — member claims, not platform certification. */
export function EndorsementList({
  endorsements,
  sellerName = "فروشنده",
  listingId,
  canHide = false,
}: {
  endorsements: Endorsement[];
  sellerName?: string;
  listingId?: string;
  canHide?: boolean;
}) {
  const setListingEndorsementHidden = useStore(
    (s) => s.setListingEndorsementHidden,
  );
  const { show } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const groups = groupByPerson(endorsements);
  if (groups.length === 0) {
    return (
      <p className="text-[13px] text-ink-faint leading-relaxed">
        هنوز کسی چیزی نگفته است.
      </p>
    );
  }

  async function toggle(personId: string, hidden: boolean) {
    if (!listingId || !canHide || busyId) return;
    setBusyId(personId);
    try {
      await setListingEndorsementHidden(listingId, personId, hidden);
      show(hidden ? "از آگهی پنهان شد" : "روی آگهی آمد");
    } catch (err) {
      show(err instanceof ApiError ? err.message : "تغییر نمایش نشد");
    } finally {
      setBusyId(null);
    }
  }

  const liveGroups = groups.filter((g) => !g.hidden || g.personId === "me");
  const hiddenGroups = canHide
    ? groups.filter((g) => g.hidden && g.personId !== "me")
    : [];
  const preview = 3;
  const shownLive =
    showAll || liveGroups.length <= preview
      ? liveGroups
      : liveGroups.slice(0, preview);
  const moreCount = liveGroups.length - shownLive.length;

  return (
    <ul className="space-y-3">
      {shownLive.map((group) => (
        <VisibleWordRow
          key={group.personId}
          group={group}
          sellerName={sellerName}
          busy={busyId === group.personId}
          onHide={
            canHide && listingId && group.personId !== "me"
              ? () => toggle(group.personId, true)
              : undefined
          }
        />
      ))}
      {moreCount > 0 ? (
        <li>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-[12px] font-bold text-brand-600 dark:text-brand-400"
          >
            {toPersianDigits(moreCount)} حرف دیگر ‹
          </button>
        </li>
      ) : null}
      {hiddenGroups.map((group) => (
        <HiddenWordRow
          key={group.personId}
          group={group}
          busy={busyId === group.personId}
          onShow={
            listingId ? () => toggle(group.personId, false) : undefined
          }
        />
      ))}
    </ul>
  );
}

function VisibleWordRow({
  group,
  sellerName,
  busy,
  onHide,
}: {
  group: PersonWord;
  sellerName: string;
  busy: boolean;
  onHide?: () => void;
}) {
  const getPerson = useStore((s) => s.getPerson);
  const p = getPerson(group.personId);
  const name = group.personId === "me" ? "تو" : (p?.name ?? "یک آشنا");
  const claims = group.types.map((t) => claimPhrase(t, sellerName));
  return (
    <li className="flex items-start gap-2.5">
      {p ? (
        <Avatar name={p.name} src={p.avatar} showLevel={false} size="sm" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-800 shrink-0" />
      )}
      <div className="text-[13px] leading-snug min-w-0 pt-0.5 flex-1">
        {claims.length > 0 ? (
          <p className="text-ink dark:text-zinc-100">
            <span className="font-semibold">{name}</span>
            {" گفته "}
            {claims.length === 1
              ? claims[0]
              : `${claims.slice(0, -1).join("، ")} و ${claims[claims.length - 1]}`}
          </p>
        ) : (
          <p className="text-ink dark:text-zinc-100">
            <span className="font-semibold">{name}</span>
            {" حرفی گذاشته."}
          </p>
        )}
        {group.note ? (
          <p className="text-[12.5px] text-ink dark:text-zinc-200 mt-1 leading-relaxed">
            «{group.note}»
          </p>
        ) : null}
        <p className="text-[11px] text-ink-faint mt-0.5">
          حرف یک آشنا — نه مهر سیرکل
        </p>
        {onHide ? (
          <button
            type="button"
            disabled={busy}
            onClick={onHide}
            className="mt-1.5 text-[12px] font-bold text-brand-600 dark:text-brand-400 disabled:opacity-50"
          >
            {busy ? "…" : "پنهان از آگهی"}
          </button>
        ) : null}
      </div>
    </li>
  );
}

function HiddenWordRow({
  group,
  busy,
  onShow,
}: {
  group: PersonWord;
  busy: boolean;
  onShow?: () => void;
}) {
  const getPerson = useStore((s) => s.getPerson);
  const p = getPerson(group.personId);
  const name = p?.name ?? "یک آشنا";
  return (
    <li className="flex items-center gap-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/55 px-2.5 py-2 ring-1 ring-stone-200/70 dark:ring-zinc-700/80">
      <span className="opacity-45 shrink-0">
        {p ? (
          <Avatar name={p.name} src={p.avatar} showLevel={false} size="sm" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-stone-200 dark:bg-zinc-700" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink-muted dark:text-zinc-400 truncate">
          {name}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-stone-200/90 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-bold text-ink-muted dark:text-zinc-400">
        پنهان از آگهی
      </span>
      {onShow ? (
        <button
          type="button"
          disabled={busy}
          onClick={onShow}
          className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-bold text-brand-600 dark:text-brand-400 disabled:opacity-50"
        >
          {busy ? "…" : "نمایش"}
        </button>
      ) : null}
    </li>
  );
}

function claimPhrase(type: BadgeType, sellerName: string): string {
  switch (type) {
    case "verify_item":
      return "این کالا را از نزدیک دیده است";
    case "know_seller":
      return `${sellerName} را می‌شناسد`;
    case "verify_quality":
      return "وضعیتش را چک کرده است";
    case "dealt_before":
      return `قبلاً با ${sellerName} معامله کرده است`;
    default:
      return badgeResultLabels[type];
  }
}
