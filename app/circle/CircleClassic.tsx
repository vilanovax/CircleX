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
import JoinRequestSheet from "@/components/JoinRequestSheet";
import { GraphIcon, UserPlusIcon } from "@/components/Icons";
import { levelHint } from "@/lib/labels";
import { viewerRelationPhrase } from "@/lib/trust";
import { activeCircle } from "@/lib/circle-member";
import {
  copyText,
  effectiveInviteStatus,
  inviteRosterJoined,
  inviteRosterTotal,
  inviteShareText,
  inviteUrl,
  smsShareHref,
  whatsappShareHref,
} from "@/lib/invite";
import { formatPhoneDisplay } from "@/lib/phone";
import type {
  CircleJoinRequest,
  Invite,
  Person,
  RelationType,
  TrustLevel,
} from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import { relationLabels } from "@/lib/labels";

const LEVELS: TrustLevel[] = ["A", "B", "C"];
const RELATION_ORDER: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];
const SECTION_PREVIEW = 6;
const INVITE_PREVIEW = 3;

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

  const core = phrase.replace(/\s*(شما|تو)\s*$/, "").trim();
  if (/^(در|از)\s/.test(rest)) return `${core} تو ${rest}`;

  const parts = rest.split(/\s+/);
  const afterFirst = parts.slice(1).join(" ");
  if (parts.length >= 2 && /^(از|در)\s/.test(afterFirst)) {
    return `${core} ${parts[0]} تو ${afterFirst}`;
  }
  if (parts.length === 1) return `${core} تو در ${rest}`;
  return `${core} ${rest}`.replace(/\s+/g, " ");
}

export default function CircleClassic() {
  const {
    people,
    invites,
    joinRequests,
    me,
    setLevel,
    revokeInvite,
    createWaveFromPending,
    acceptJoinRequest,
    rejectJoinRequest,
    hydrated,
  } = useStore();
  const { show } = useToast();
  const mine = activeCircle(people);
  const pendingInvites = useMemo(() => {
    const live = invites.filter(
      (inv) => effectiveInviteStatus(inv) === "pending",
    );
    return [...live].sort((a, b) => {
      if (a.kind === "wave" && b.kind !== "wave") return -1;
      if (a.kind !== "wave" && b.kind === "wave") return 1;
      return 0;
    });
  }, [invites]);
  const personalPending = useMemo(
    () => pendingInvites.filter((inv) => inv.kind === "personal"),
    [pendingInvites],
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [placing, setPlacing] = useState(false);
  const [moreInvite, setMoreInvite] = useState<Invite | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [shareInvite, setShareInvite] = useState<Invite | null>(null);
  const [consolidating, setConsolidating] = useState(false);
  const [reviewing, setReviewing] = useState<CircleJoinRequest | null>(null);
  const [relationFilter, setRelationFilter] = useState<RelationType | "all">(
    "all",
  );
  const [openRelations, setOpenRelations] = useState<Set<RelationType>>(
    () => new Set(),
  );
  const [fullRelations, setFullRelations] = useState<Set<RelationType>>(
    () => new Set(),
  );
  const [invitesOpen, setInvitesOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("invite") === "1") setShowAdd(true);
  }, []);

  const relationGroups = useMemo(() => {
    return RELATION_ORDER.map((relation) => ({
      relation,
      members: mine
        .filter((p) => p.relation === relation)
        .sort((a, b) => a.name.localeCompare(b.name, "fa")),
    })).filter((g) => g.members.length > 0);
  }, [mine]);

  const visibleGroups = useMemo(() => {
    if (relationFilter === "all") return relationGroups;
    return relationGroups.filter((g) => g.relation === relationFilter);
  }, [relationGroups, relationFilter]);

  useEffect(() => {
    if (openRelations.size > 0) return;
    const first = relationGroups[0]?.relation;
    if (first) setOpenRelations(new Set([first]));
  }, [relationGroups, openRelations.size]);

  const unplaced = useMemo(
    () =>
      mine.filter((p) => {
        if (p.trustTouched) return false;
        if (!p.joinedAt) return false;
        const age = Date.now() - new Date(p.joinedAt).getTime();
        return age >= 0 && age < 14 * 24 * 60 * 60 * 1000;
      }),
    [mine],
  );

  const emptyCircle =
    mine.length === 0 &&
    pendingInvites.length === 0 &&
    joinRequests.length === 0;

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header
        title="حلقه‌ی من"
        subtitle={
          mine.length === 0
            ? joinRequests.length > 0
              ? `${toPersianDigits(joinRequests.length)} درخواست عضویت`
              : pendingInvites.length > 0
              ? `${toPersianDigits(pendingInvites.length)} دعوت در انتظار`
              : "هنوز کسی اضافه نشده"
            : `${toPersianDigits(mine.length)} نفر که خودت می‌شناسی`
        }
        action={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 h-8 rounded-xl bg-brand-600 text-white px-2.5 text-[11px] font-bold active:scale-95 transition-transform duration-150"
          >
            <UserPlusIcon className="w-4 h-4" />
            دعوت
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
              حلقه‌ات هنوز خالی است
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
              دعوت
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-3 listing-detail-rise">
          {!hydrated ? (
            <CardListSkeleton count={5} />
          ) : (
            <>
              {joinRequests.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="flex items-center gap-2 px-3.5 pt-3 pb-1">
                    <h2 className="text-[13px] font-bold text-ink dark:text-zinc-100">
                      درخواست عضویت
                    </h2>
                    <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20 text-[11px] font-bold text-amber-800 dark:text-amber-200 nums">
                      {toPersianDigits(joinRequests.length)}
                    </span>
                  </div>
                  <p className="px-3.5 pb-1 text-[12px] text-ink-muted leading-relaxed">
                    با لینک آمده‌اند، اما در لیست دعوت تو نبودند.
                  </p>
                  <ul className="divide-y divide-stone-100 dark:divide-zinc-800">
                    {joinRequests.map((req) => (
                      <li
                        key={req.id}
                        className="flex items-center gap-2.5 px-3.5 py-2.5"
                      >
                        <Avatar
                          name={req.guest.name}
                          src={req.guest.avatar}
                          size="sm"
                          showLevel={false}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-[13px] text-ink dark:text-zinc-100 truncate">
                            {req.guest.name}
                          </span>
                          <span className="block text-[11px] text-ink-muted mt-px">
                            آیا این فرد را می‌شناسی؟
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setReviewing(req)}
                          className="shrink-0 text-[12px] font-bold text-brand-700 dark:text-brand-400 px-2 py-1.5"
                        >
                          بررسی
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {unplaced.length > 0 && (
                <div className="card px-3.5 py-3">
                  <p className="text-[13px] font-bold text-ink dark:text-zinc-100 nums">
                    {toPersianDigits(unplaced.length)} نفر تازه پیوسته‌اند
                  </p>
                  <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
                    الان آگهی‌ات را می‌بینند. اگر خواستی جایگاهشان را عوض کن —
                    اجباری نیست.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPlacing(true)}
                    className="mt-2.5 text-[13px] font-semibold text-brand-700 dark:text-brand-400"
                  >
                    جایگاه‌ها را مشخص کن
                  </button>
                </div>
              )}
              {mine.length > 0 && relationGroups.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  <RelationChip
                    active={relationFilter === "all"}
                    label="همه"
                    count={mine.length}
                    onClick={() => setRelationFilter("all")}
                  />
                  {relationGroups.map((g) => (
                    <RelationChip
                      key={g.relation}
                      active={relationFilter === g.relation}
                      label={relationLabels[g.relation]}
                      count={g.members.length}
                      onClick={() => {
                        setRelationFilter(g.relation);
                        setOpenRelations((prev) => new Set(prev).add(g.relation));
                      }}
                    />
                  ))}
                </div>
              )}

              {mine.length > 0 && (
              <div className="card overflow-hidden">
                <h2 className="px-3.5 pt-3 pb-1 text-[13px] font-bold text-ink dark:text-zinc-100 nums">
                  اعضای حلقه
                  <span className="text-ink-muted font-semibold">
                    {" · "}
                    {toPersianDigits(mine.length)}
                  </span>
                </h2>
                {visibleGroups.map(({ relation, members }, i) => {
                  const forcedOpen = relationFilter !== "all";
                  const open = forcedOpen || openRelations.has(relation);
                  const showAll = forcedOpen || fullRelations.has(relation);
                  const shown = open
                    ? showAll
                      ? members
                      : members.slice(0, SECTION_PREVIEW)
                    : [];
                  const hiddenCount = members.length - shown.length;
                  return (
                    <section
                      key={relation}
                      className={i > 0 ? "border-t border-stone-100 dark:border-zinc-800" : ""}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenRelations((prev) => {
                            const next = new Set(prev);
                            if (next.has(relation) && relationFilter === "all") {
                              next.delete(relation);
                            } else {
                              next.add(relation);
                            }
                            return next;
                          });
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3.5 pt-2.5 pb-1.5 text-right"
                        aria-expanded={open}
                      >
                        <h3 className="text-[13px] font-bold text-ink dark:text-zinc-100 nums">
                          {relationLabels[relation]}
                          <span className="text-ink-muted font-semibold">
                            {" · "}
                            {toPersianDigits(members.length)}
                          </span>
                        </h3>
                        <span
                          className={`text-ink-faint text-[12px] transition-transform ${
                            open ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        >
                          ▾
                        </span>
                      </button>
                      {open ? (
                        <>
                          <ul className="divide-y divide-stone-100 dark:divide-zinc-800">
                            {shown.map((p) => (
                              <CircleMemberRow
                                key={p.id}
                                person={p}
                                onEditGroup={() => setEditing(p)}
                              />
                            ))}
                          </ul>
                          {hiddenCount > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setFullRelations((prev) =>
                                  new Set(prev).add(relation),
                                )
                              }
                              className="w-full py-2.5 text-[12px] font-bold text-brand-700 dark:text-brand-300"
                            >
                              {toPersianDigits(hiddenCount)} نفر دیگر در{" "}
                              {relationLabels[relation]}
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </section>
                  );
                })}
              </div>
              )}

              {mine.length > 0 && (
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
                    ببین هر کس چطور به تو وصل است
                  </span>
                </span>
                <span className="text-[12px] font-bold text-brand-600 dark:text-brand-400 shrink-0">
                  ‹
                </span>
              </Link>
              )}

              {pendingInvites.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="flex items-center gap-2 px-3.5 pt-3 pb-1">
                    <h2 className="text-[13px] font-bold text-ink dark:text-zinc-100">
                      دعوت‌های در انتظار
                    </h2>
                    <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted nums">
                      {toPersianDigits(pendingInvites.length)}
                    </span>
                    {personalPending.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelecting((v) => !v);
                          setSelectedIds(new Set());
                          setInvitesOpen(true);
                        }}
                        className="mr-auto text-[12px] font-semibold text-brand-700 dark:text-brand-400"
                      >
                        {selecting ? "انصراف" : "انتخاب"}
                      </button>
                    )}
                  </div>
                  <ul className="divide-y divide-stone-100 dark:divide-zinc-800">
                    {(invitesOpen || selecting
                      ? pendingInvites
                      : pendingInvites.slice(0, INVITE_PREVIEW)
                    ).map((inv) => (
                      <PendingInviteRow
                        key={inv.id}
                        invite={inv}
                        selecting={selecting && inv.kind === "personal"}
                        selected={selectedIds.has(inv.id)}
                        onToggle={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(inv.id)) next.delete(inv.id);
                            else next.add(inv.id);
                            return next;
                          });
                        }}
                        onMore={() => setMoreInvite(inv)}
                      />
                    ))}
                  </ul>
                  {!invitesOpen &&
                    !selecting &&
                    pendingInvites.length > INVITE_PREVIEW && (
                      <button
                        type="button"
                        onClick={() => setInvitesOpen(true)}
                        className="w-full py-2.5 text-[12px] font-bold text-brand-700 dark:text-brand-300"
                      >
                        {toPersianDigits(pendingInvites.length - INVITE_PREVIEW)}{" "}
                        دعوت دیگر
                      </button>
                    )}
                  {selecting && selectedIds.size > 0 && (
                    <div className="px-3.5 py-3 border-t border-stone-100 dark:border-zinc-800">
                      <button
                        type="button"
                        disabled={consolidating}
                        onClick={() => {
                          setConsolidating(true);
                          void createWaveFromPending(Array.from(selectedIds))
                            .then((invite) => {
                              setSelecting(false);
                              setSelectedIds(new Set());
                              setShareInvite(invite);
                            })
                            .catch(() => show("ساخت لینک کلی ممکن نشد"))
                            .finally(() => setConsolidating(false));
                        }}
                        className="btn-primary w-full min-h-11"
                      >
                        {consolidating
                          ? "در حال ساخت…"
                          : `یک لینک برای ${toPersianDigits(selectedIds.size)} نفر`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {reviewing && (
        <JoinRequestSheet
          request={reviewing}
          onClose={() => setReviewing(null)}
          onAccept={async (input) => {
            const name = input.displayName;
            try {
              await acceptJoinRequest(reviewing.id, input);
              setReviewing(null);
              show(`${name} به حلقه اضافه شد`);
            } catch {
              show("قبول درخواست ممکن نشد");
            }
          }}
          onReject={async () => {
            try {
              await rejectJoinRequest(reviewing.id);
              setReviewing(null);
              show("درخواست رد شد");
            } catch {
              show("رد درخواست ممکن نشد");
            }
          }}
        />
      )}

      {showAdd && <InviteSheet onClose={() => setShowAdd(false)} />}

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

      {placing && unplaced.length > 0 && (
        <PlaceTrustSheet
          people={unplaced}
          onClose={() => setPlacing(false)}
          onPick={(person, lvl) => {
            setLevel(person.id, lvl);
            show(`${person.name} به «${SECTION_LABEL[lvl]}» منتقل شد.`);
            if (unplaced.length <= 1) setPlacing(false);
          }}
        />
      )}

      {shareInvite && (
        <InviteSharePanel
          invite={shareInvite}
          inviterName={me.name}
          onClose={() => setShareInvite(null)}
        />
      )}

      {moreInvite && (
        <InviteMoreSheet
          invite={moreInvite}
          inviterName={me.name}
          onClose={() => setMoreInvite(null)}
          onRevoke={() => {
            const id = moreInvite.id;
            setMoreInvite(null);
            void revokeInvite(id).then(
              () => show("دعوت لغو شد"),
              () => show("لغو دعوت ممکن نشد"),
            );
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

function RelationChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip whitespace-nowrap !px-2.5 !py-1.5 border text-[12px] nums ${
        active
          ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20"
          : "bg-[color:var(--circle-surface)] text-ink-muted dark:text-zinc-300 border-stone-200/70 dark:border-zinc-700"
      }`}
    >
      {label}
      <span className={active ? "text-white/80" : "text-ink-faint"}>
        {" "}
        {toPersianDigits(count)}
      </span>
    </button>
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
          جایگاه {person.name} کجا باشد؟
        </h2>
        <p className="text-[12px] text-ink-muted mt-1 mb-3">
          این انتخاب فقط برای خودت است.
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

function PlaceTrustSheet({
  people,
  onClose,
  onPick,
}: {
  people: Person[];
  onClose: () => void;
  onPick: (person: Person, level: TrustLevel) => void;
}) {
  return (
    <SheetShell onClose={onClose} labelledBy="place-trust-title" zClass="z-50">
      <h2
        id="place-trust-title"
        className="font-extrabold text-[1.1rem] text-ink dark:text-zinc-50"
      >
        جایگاه تازه‌واردها
      </h2>
      <p className="text-[12px] text-ink-muted mt-1 mb-3 leading-relaxed">
        پیش‌فرض «افراد مورد اعتماد» است. این انتخاب فقط برای خودت است.
      </p>
      <ul className="space-y-3">
        {people.map((person) => (
          <li key={person.id}>
            <p className="font-bold text-[13px] text-ink dark:text-zinc-100 mb-1.5">
              {person.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((lvl) => {
                const active = person.level === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onPick(person, lvl)}
                    className={`chip !px-3 !py-1.5 min-h-10 border ${
                      active
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200 dark:border-zinc-700"
                    }`}
                  >
                    {SECTION_LABEL[lvl]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </SheetShell>
  );
}

function inviteRowCopy(invite: Invite): { title: string; sub: string; isWave: boolean } {
  const isWave = invite.kind === "wave";
  const rawName = invite.invitedName?.trim() ?? "";
  const name = rawName
    .replace(/[0-9۰-۹+]/g, "")
    .replace(/[،,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (isWave) {
    return {
      title: `لینک ${relationLabels[invite.relationType]}`,
      sub: `${toPersianDigits(inviteRosterJoined(invite))} از ${toPersianDigits(inviteRosterTotal(invite))} پیوسته‌اند`,
      isWave: true,
    };
  }
  return {
    title: name || (invite.invitedPhone ? formatPhoneDisplay(invite.invitedPhone) : "لینک"),
    sub: name && invite.invitedPhone
      ? formatPhoneDisplay(invite.invitedPhone)
      : "هنوز نپیوسته",
    isWave: false,
  };
}

function PendingInviteRow({
  invite,
  onMore,
  selecting,
  selected,
  onToggle,
}: {
  invite: Invite;
  onMore: () => void;
  selecting?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const { title, sub, isWave } = inviteRowCopy(invite);
  const [open, setOpen] = useState(false);
  const roster = invite.expected ?? [];

  return (
    <li>
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        {selecting && (
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            aria-label={selected ? `حذف ${title}` : `انتخاب ${title}`}
            className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selected
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-stone-300 dark:border-zinc-600"
            }`}
          >
            {selected ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
              </svg>
            ) : null}
          </button>
        )}
        <button
          type="button"
          onClick={() => (isWave ? setOpen((v) => !v) : onMore())}
          className="min-w-0 flex-1 text-right"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="font-bold text-[13px] text-ink dark:text-zinc-100 truncate">
              {title}
            </p>
            {isWave && (
              <span className="shrink-0 text-[10px] font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15 px-1.5 py-0.5 rounded-md">
                گروهی
              </span>
            )}
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5 nums truncate">{sub}</p>
        </button>
        <button
          type="button"
          onClick={onMore}
          aria-label={`گزینه‌های ${title}`}
          className="shrink-0 w-10 h-10 rounded-lg text-ink-muted dark:text-zinc-400 active:bg-stone-100 dark:active:bg-zinc-800 flex items-center justify-center"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="12" cy="6" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="18" r="1.6" />
          </svg>
        </button>
      </div>
      {isWave && open && roster.length > 0 && (
        <ul className="px-3.5 pb-3 space-y-1.5">
          {roster.map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-2 rounded-xl bg-stone-50/80 dark:bg-zinc-800/40 px-2.5 py-2"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                  row.joined
                    ? "bg-brand-600 text-white"
                    : "bg-stone-200 dark:bg-zinc-700 text-ink-muted"
                }`}
                aria-hidden
              >
                {row.joined ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                  </svg>
                ) : (
                  (row.name?.trim() || "؟").charAt(0)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-ink dark:text-zinc-100 truncate">
                  {row.name?.trim() || formatPhoneDisplay(row.phone)}
                </span>
                {row.name?.trim() && (
                  <span dir="ltr" className="block text-[11px] text-ink-muted nums">
                    {formatPhoneDisplay(row.phone)}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-semibold text-ink-muted">
                {row.joined ? "پیوست" : "در انتظار"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function InviteMoreSheet({
  invite,
  inviterName,
  onClose,
  onRevoke,
}: {
  invite: Invite;
  inviterName: string;
  onClose: () => void;
  onRevoke: () => void;
}) {
  const { show } = useToast();
  const [copied, setCopied] = useState(false);
  const { title, sub, isWave } = inviteRowCopy(invite);
  const url = inviteUrl(invite.code);
  const text = inviteShareText(inviterName, url);
  const roster = invite.expected ?? [];
  const pendingPhones = roster.filter((row) => !row.joined).map((row) => row.phone);
  const waPhone = isWave ? undefined : invite.invitedPhone;
  const smsPhones = isWave
    ? pendingPhones.length > 0
      ? pendingPhones
      : undefined
    : invite.invitedPhone;

  async function onCopy() {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      show("لینک کپی شد");
    } else {
      show("کپی ممکن نشد");
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="invite-more-title"
      zClass="z-50"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="btn-primary w-full min-h-12 shadow-md shadow-brand-600/20 active:scale-[0.98] transition-transform duration-150"
        >
          باشه
        </button>
      }
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="invite-more-title"
          className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 truncate min-w-0"
        >
          {title}
        </h2>
        <span className="shrink-0 inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 px-2.5 py-1 text-[11px] font-bold">
          در انتظار
        </span>
      </div>

      <p className="text-[13px] text-ink-muted mt-2.5 leading-relaxed">
        {isWave
          ? roster.length > 0
            ? "یک لینک برای همه. وقتی با همان شماره وارد شوند، اینجا تیک می‌خورند."
            : "لینک گروهی آماده است. صبر کن تا کسی از آن وارد شود."
          : "دعوت آماده است. صبر کن تا بپیوندد."}
      </p>
      {sub && (
        <p
          dir={isWave ? undefined : "ltr"}
          className="mt-1 text-[12px] text-ink-faint nums tracking-wide"
        >
          {sub}
        </p>
      )}

      {roster.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {roster.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <span className="font-bold text-ink dark:text-zinc-100 truncate">
                {row.name?.trim() || formatPhoneDisplay(row.phone)}
              </span>
              <span className="shrink-0 text-ink-muted">
                {row.joined ? "پیوست" : "در انتظار"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-2xl border border-stone-200/80 dark:border-zinc-700 bg-stone-50/70 dark:bg-zinc-800/40 px-3.5 py-3">
        <p className="text-[11px] font-bold text-ink-muted mb-1.5">
          {isWave ? "لینک گروهی" : "لینک"}
        </p>
        <p
          dir="ltr"
          className="text-[12px] font-medium text-ink dark:text-zinc-200 break-all text-left leading-snug"
        >
          {url}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => void onCopy()}
            className="text-[13px] font-semibold text-brand-700 dark:text-brand-400"
          >
            {copied ? "کپی شد" : "کپی"}
          </button>
          <a
            href={whatsappShareHref(text, waPhone)}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-semibold text-brand-700 dark:text-brand-400"
          >
            واتساپ
          </a>
          <a
            href={smsShareHref(text, smsPhones)}
            className="text-[13px] font-semibold text-brand-700 dark:text-brand-400"
          >
            پیامک
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={onRevoke}
        className="w-full mt-4 min-h-10 text-[12px] font-semibold text-ink-faint"
      >
        لغو دعوت
      </button>
    </SheetShell>
  );
}

