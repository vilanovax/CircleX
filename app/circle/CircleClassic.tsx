"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import SheetShell from "@/components/SheetShell";
import { CardListSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import InviteSheet, { InviteSharePanel } from "@/components/InviteSheet";
import { GraphIcon, UserPlusIcon } from "@/components/Icons";
import { levelHint } from "@/lib/labels";
import { viewerRelationPhrase } from "@/lib/trust";
import { activeCircle } from "@/lib/circle-member";
import {
  copyText,
  effectiveInviteStatus,
  inviteUrl,
} from "@/lib/invite";
import { maskPhone } from "@/lib/phone";
import type { Invite, Person, TrustLevel } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";

const LEVELS: TrustLevel[] = ["A", "B", "C"];

/** Section title — slightly longer than the row chip for group B. */
const SECTION_LABEL: Record<TrustLevel, string> = {
  A: "نزدیکان",
  B: "افراد مورد اعتماد",
  C: "آشنایان",
};

const RELATION_ROOTS = [
  "خواهر",
  "برادر",
  "همسر",
  "همکار",
  "همسایه",
  "دوست",
  "آشنا",
] as const;

/** One short human line: merge relation + note without repeating the same idea. */
function circleRelationLine(person: Person): string {
  const phrase = viewerRelationPhrase(person);
  const note = person.note?.trim();
  if (!note) return phrase;

  const root = RELATION_ROOTS.find((r) => phrase.includes(r) && note.includes(r));
  if (!root) return phrase;

  const rest = note
    .replace(new RegExp(`^${root}[ه‌یيِ]?\\s*`), "")
    .replace(/^م$/, "")
    .trim();
  if (!rest) return phrase;

  const core = phrase.replace(/\s*شما\s*$/, "").trim();
  if (/^(در|از)\s/.test(rest)) return `${core} شما ${rest}`;

  const parts = rest.split(/\s+/);
  const afterFirst = parts.slice(1).join(" ");
  if (parts.length >= 2 && /^(از|در)\s/.test(afterFirst)) {
    return `${core} ${parts[0]} شما ${afterFirst}`;
  }
  if (parts.length === 1) return `${core} شما در ${rest}`;
  return `${core} ${rest}`.replace(/\s+/g, " ");
}

export default function CircleClassic() {
  const { people, invites, me, setLevel, revokeInvite, hydrated } = useStore();
  const { show } = useToast();
  const mine = activeCircle(people);
  const pendingInvites = invites.filter(
    (inv) => effectiveInviteStatus(inv) === "pending",
  );
  const [showAdd, setShowAdd] = useState(false);
  const [reshare, setReshare] = useState<Invite | null>(null);
  const [editing, setEditing] = useState<Person | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("invite") === "1") setShowAdd(true);
  }, []);

  const grouped = useMemo(() => {
    return LEVELS.map((lvl) => ({
      level: lvl,
      members: mine.filter((p) => p.level === lvl),
    })).filter((g) => g.members.length > 0);
  }, [mine]);

  const emptyCircle = mine.length === 0 && pendingInvites.length === 0;

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header
        title="حلقه‌ی من"
        subtitle={
          mine.length === 0
            ? pendingInvites.length > 0
              ? `${toPersianDigits(pendingInvites.length)} دعوت در انتظار`
              : "هنوز کسی اضافه نشده"
            : `${toPersianDigits(mine.length)} نفر که مستقیماً می‌شناسید`
        }
        action={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 h-8 rounded-xl bg-brand-600 text-white px-2.5 text-[11px] font-bold active:scale-95 transition-transform duration-150"
          >
            <UserPlusIcon className="w-4 h-4" />
            افزودن
          </button>
        }
      />

      {emptyCircle ? (
        <div className="px-4 pt-10 listing-detail-rise">
          <div className="card p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <UserPlusIcon className="w-7 h-7" />
            </div>
            <p className="font-bold text-ink dark:text-zinc-100">
              حلقهٔ شما هنوز خالی است
            </p>
            <p className="text-sm text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
              خانواده و دوستان را دعوت کن تا آگهی‌ها و رویدادهایشان اینجا دیده
              شود.
            </p>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="btn-primary inline-block mt-4"
            >
              دعوت به حلقه
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-3 listing-detail-rise">
          {!hydrated ? (
            <CardListSkeleton count={5} />
          ) : (
            <>
              <div className="card overflow-hidden">
                <h2 className="px-3.5 pt-3 pb-1 text-[13px] font-bold text-ink dark:text-zinc-100 nums">
                  اعضای حلقه
                  <span className="text-ink-muted font-semibold">
                    {" · "}
                    {toPersianDigits(mine.length)}
                  </span>
                </h2>
                {mine.length === 0 ? (
                  <p className="px-3.5 pb-3 text-[12px] text-ink-muted leading-relaxed">
                    هنوز کسی نپیوسته. دعوت‌های در انتظار پایین همین صفحه است.
                  </p>
                ) : (
                  grouped.map(({ level, members }, i) => (
                    <section
                      key={level}
                      className={i > 0 ? "border-t border-stone-100 dark:border-zinc-800" : ""}
                    >
                      <h3 className="px-3.5 pt-2.5 pb-1 text-[13px] font-bold text-ink dark:text-zinc-100 nums">
                        {SECTION_LABEL[level]}
                        <span className="text-ink-muted font-semibold">
                          {" · "}
                          {toPersianDigits(members.length)}
                        </span>
                      </h3>
                      <ul className="divide-y divide-stone-100 dark:divide-zinc-800">
                        {members.map((p) => (
                          <CircleMemberRow
                            key={p.id}
                            person={p}
                            onEditGroup={() => setEditing(p)}
                          />
                        ))}
                      </ul>
                    </section>
                  ))
                )}
              </div>

              {pendingInvites.length > 0 && (
                <div className="card overflow-hidden">
                  <h2 className="px-3.5 pt-3 pb-1 text-[13px] font-bold text-ink dark:text-zinc-100 nums">
                    دعوت‌های در انتظار
                    <span className="text-ink-muted font-semibold">
                      {" · "}
                      {toPersianDigits(pendingInvites.length)}
                    </span>
                  </h2>
                  <ul className="divide-y divide-stone-100 dark:divide-zinc-800">
                    {pendingInvites.map((inv) => (
                      <PendingInviteRow
                        key={inv.id}
                        invite={inv}
                        onReshare={() => setReshare(inv)}
                        onRevoke={() => {
                          void revokeInvite(inv.id).then(
                            () => show("دعوت لغو شد"),
                            () => show("لغو دعوت ممکن نشد"),
                          );
                        }}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <Link
            href="/graph"
            className="flex items-center gap-3 rounded-xl bg-brand-50/70 dark:bg-brand-500/10 px-3 py-2.5 active:opacity-80 transition-opacity"
          >
            <span className="w-8 h-8 rounded-lg bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-brand-600 flex items-center justify-center shrink-0 ring-1 ring-brand-100 dark:ring-brand-500/20">
              <GraphIcon className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-bold text-ink dark:text-zinc-100">
                دیدن نقشه ارتباط‌ها
              </span>
              <span className="block text-[11px] text-ink-muted mt-0.5 truncate">
                ببینید هر فرد چگونه به شما وصل است
              </span>
            </span>
            <span className="text-[12px] font-bold text-brand-600 dark:text-brand-400 shrink-0">
              ‹
            </span>
          </Link>
        </div>
      )}

      {showAdd && <InviteSheet onClose={() => setShowAdd(false)} />}

      {reshare && (
        <InviteSharePanel
          invite={reshare}
          inviterName={me.name}
          onClose={() => setReshare(null)}
        />
      )}

      {editing && (
        <GroupSheet
          person={editing}
          onClose={() => setEditing(null)}
          onPick={(lvl) => {
            const prev = editing.level;
            const name = editing.name;
            setEditing(null);
            if (lvl === prev) return;
            setLevel(editing.id, lvl);
            show(`${name} به «${SECTION_LABEL[lvl]}» منتقل شد.`, {
              action: {
                label: "بازگرداندن",
                onClick: () => setLevel(editing.id, prev),
              },
            });
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

function CircleMemberRow({
  person,
  onEditGroup,
}: {
  person: Person;
  onEditGroup: () => void;
}) {
  return (
    <li className="flex items-center gap-2.5 px-3.5 py-2">
      <Link
        href={`/person/${person.id}`}
        className="flex items-center gap-2.5 min-w-0 flex-1 active:opacity-90 transition-opacity"
      >
        <Avatar name={person.name} src={person.avatar} size="sm" showLevel={false} />
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[13px] text-ink dark:text-zinc-100 truncate leading-snug">
            {person.name}
          </span>
          <span className="block text-[11px] text-ink-muted mt-px truncate leading-snug">
            {circleRelationLine(person)}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={onEditGroup}
        aria-label={`تغییر گروه ${person.name}`}
        className="shrink-0 text-[11px] font-semibold text-ink-muted dark:text-zinc-400 px-2 py-1.5 rounded-lg active:bg-stone-100 dark:active:bg-zinc-800"
      >
        گروه ▾
      </button>
    </li>
  );
}

function GroupSheet({
  person,
  onClose,
  onPick,
}: {
  person: Person;
  onClose: () => void;
  onPick: (level: TrustLevel) => void;
}) {
  return (
    <SheetShell onClose={onClose} labelledBy="group-sheet-title" zClass="z-50">
      <div className="pb-3">
        <h2
          id="group-sheet-title"
          className="font-extrabold text-[1.1rem] text-ink dark:text-zinc-50"
        >
          {person.name} در کدام گروه باشد؟
        </h2>
        <p className="text-[12px] text-ink-muted mt-1 mb-3">
          این انتخاب فقط برای خود شما نمایش داده می‌شود.
        </p>
        <div className="space-y-2">
          {LEVELS.map((lvl) => {
            const active = person.level === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onPick(lvl)}
                className={`w-full text-right rounded-xl border px-3.5 py-3 transition-colors ${
                  active
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-stone-200/80 dark:border-zinc-700 bg-[color:var(--circle-surface)] dark:bg-zinc-900"
                }`}
              >
                <span
                  className={`block text-[14px] font-bold ${
                    active ? "text-white" : "text-ink dark:text-zinc-100"
                  }`}
                >
                  {SECTION_LABEL[lvl]}
                </span>
                <span
                  className={`block text-[12px] mt-0.5 leading-relaxed ${
                    active ? "text-white/80" : "text-ink-muted"
                  }`}
                >
                  {levelHint[lvl]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </SheetShell>
  );
}

function PendingInviteRow({
  invite,
  onReshare,
  onRevoke,
}: {
  invite: Invite;
  onReshare: () => void;
  onRevoke: () => void;
}) {
  const { show } = useToast();
  const label = invite.invitedPhone
    ? `دعوت برای ${maskPhone(invite.invitedPhone)}`
    : "لینک دعوت";

  return (
    <li className="px-3.5 py-2.5">
      <p className="font-bold text-[13px] text-ink dark:text-zinc-100">{label}</p>
      <p className="text-[11px] text-ink-muted mt-0.5">هنوز نپیوسته</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <button
          type="button"
          onClick={onReshare}
          className="text-[11px] font-semibold text-brand-700 dark:text-brand-400 px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/15"
        >
          اشتراک دوباره
        </button>
        <button
          type="button"
          onClick={async () => {
            const ok = await copyText(inviteUrl(invite.code));
            show(ok ? "لینک کپی شد" : "کپی ممکن نشد");
          }}
          className="text-[11px] font-semibold text-ink-muted px-2 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800"
        >
          کپی لینک
        </button>
        <button
          type="button"
          onClick={onRevoke}
          className="text-[11px] font-semibold text-red-600 px-2 py-1 rounded-lg"
        >
          لغو دعوت
        </button>
      </div>
    </li>
  );
}

