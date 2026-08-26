"use client";

import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useStore } from "@/lib/store";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { CardListSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import { lazyUi } from "@/lib/lazy-ui";
import { GraphIcon, UserPlusIcon } from "@/components/Icons";
import { levelLabels, relationLabels } from "@/lib/labels";
import { viewerRelationPhrase } from "@/lib/trust";
import {
  activeCircleCount,
  groupActiveCircle,
  unplacedMembers,
  type CircleRelationGroup,
} from "@/lib/circle-member";
import {
  effectiveInviteStatus,
  inviteRowCopy,
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

const SECTION_PREVIEW = 6;
const INVITE_PREVIEW = 3;
const ABOVE_FOLD_AVATARS = 4;
const EMPTY_MEMBERS: Person[] = [];

const InviteSheet = lazyUi(() => import("@/components/InviteSheet"));
const InviteSharePanel = lazyUi(
  () =>
    import("@/components/InviteSheet").then((mod) => ({
      default: mod.InviteSharePanel,
    })) as Promise<{
      default: typeof import("@/components/InviteSheet").InviteSharePanel;
    }>,
);
const JoinRequestSheet = lazyUi(() => import("@/components/JoinRequestSheet"));
const GroupSheet = lazyUi(
  () =>
    import("./circle-sheets").then((mod) => ({ default: mod.GroupSheet })) as Promise<{
      default: typeof import("./circle-sheets").GroupSheet;
    }>,
);
const PlaceTrustSheet = lazyUi(
  () =>
    import("./circle-sheets").then((mod) => ({
      default: mod.PlaceTrustSheet,
    })) as Promise<{
      default: typeof import("./circle-sheets").PlaceTrustSheet;
    }>,
);
const InviteMoreSheet = lazyUi(
  () =>
    import("./circle-sheets").then((mod) => ({
      default: mod.InviteMoreSheet,
    })) as Promise<{
      default: typeof import("./circle-sheets").InviteMoreSheet;
    }>,
);

function preloadInviteSheet() {
  void import("@/components/InviteSheet");
}

function preloadCircleSheets() {
  void import("./circle-sheets");
}

const RELATION_ROOTS = [
  "خواهر",
  "برادر",
  "همسر",
  "همکار",
  "همسایه",
  "دوست",
  "آشنا",
] as const;

const NOTE_STRIP = RELATION_ROOTS.map((root) => ({
  root,
  re: new RegExp(`^${root}[ه‌یيِ]?\\s*`),
}));

/** One short human line: merge relation + note without repeating the same idea. */
function circleRelationLine(person: Person): string {
  const phrase = viewerRelationPhrase(person);
  const note = person.note?.trim();
  if (!note) return phrase;

  const found = NOTE_STRIP.find(
    ({ root }) => phrase.includes(root) && note.includes(root),
  );
  if (!found) return phrase;

  const rest = note
    .replace(found.re, "")
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

function pendingInviteCount(invites: Invite[]): number {
  let n = 0;
  for (const inv of invites) {
    if (effectiveInviteStatus(inv) === "pending") n += 1;
  }
  return n;
}

function livePendingInvites(invites: Invite[]): Invite[] {
  const live = invites.filter(
    (inv) => effectiveInviteStatus(inv) === "pending",
  );
  return [...live].sort((a, b) => {
    if (a.kind === "wave" && b.kind !== "wave") return -1;
    if (a.kind !== "wave" && b.kind === "wave") return 1;
    return 0;
  });
}

export default function CircleClassic() {
  const circleReady = useStore((s) => s.circleReady);
  const ensureCircleRoster = useStore((s) => s.ensureCircleRoster);
  const emptyCircle = useStore((s) => {
    if (activeCircleCount(s.people) > 0) return false;
    if (s.joinRequests.length > 0) return false;
    return pendingInviteCount(s.invites) === 0;
  });

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [moreInvite, setMoreInvite] = useState<Invite | null>(null);
  const [shareInvite, setShareInvite] = useState<Invite | null>(null);
  const [reviewing, setReviewing] = useState<CircleJoinRequest | null>(null);

  const onInvite = useCallback(() => setShowAdd(true), []);
  const onEditGroup = useCallback((personId: string) => setEditingId(personId), []);
  const onPlace = useCallback(() => setPlacing(true), []);
  const onReview = useCallback(
    (req: CircleJoinRequest) => setReviewing(req),
    [],
  );
  const onMoreInvite = useCallback((inv: Invite) => setMoreInvite(inv), []);
  const onShare = useCallback((inv: Invite) => setShareInvite(inv), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("invite") === "1") setShowAdd(true);
    if (q.get("place") === "1") {
      setPlacing(true);
      q.delete("place");
      const next = q.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${next ? `?${next}` : ""}`,
      );
    }
  }, []);

  useEffect(() => {
    void ensureCircleRoster();
  }, [circleReady, ensureCircleRoster]);

  return (
    <main className="pb-28 min-h-[100dvh]">
      <CirclePageHeader onInvite={onInvite} />

      {!circleReady ? (
        <div className="px-4 pt-3">
          <CardListSkeleton count={5} />
        </div>
      ) : emptyCircle ? (
        <CircleEmptyState onInvite={onInvite} />
      ) : (
        <div className="px-4 pt-3 space-y-3">
          <CircleJoinBanner onReview={onReview} />
          <CircleUnplacedBanner onPlace={onPlace} />
          <CircleMembersPanel onEditGroup={onEditGroup} />
          <CircleGraphLink />
          <CirclePendingInvites onMore={onMoreInvite} onShare={onShare} />
        </div>
      )}

      {reviewing ? (
        <CircleJoinHost
          request={reviewing}
          onClose={() => setReviewing(null)}
        />
      ) : null}

      {showAdd ? (
        <InviteSheet firstRun={emptyCircle} onClose={() => setShowAdd(false)} />
      ) : null}

      {editingId ? (
        <CircleGroupHost
          personId={editingId}
          onClose={() => setEditingId(null)}
        />
      ) : null}

      {placing ? <CirclePlaceHost onClose={() => setPlacing(false)} /> : null}

      {shareInvite ? (
        <CircleShareHost
          invite={shareInvite}
          onClose={() => setShareInvite(null)}
        />
      ) : null}

      {moreInvite ? (
        <CircleMoreInviteHost
          invite={moreInvite}
          onClose={() => setMoreInvite(null)}
        />
      ) : null}

      <BottomNav />
    </main>
  );
}

const CirclePageHeader = memo(function CirclePageHeader({
  onInvite,
}: {
  onInvite: () => void;
}) {
  const members = useStore((s) => activeCircleCount(s.people));
  const joins = useStore((s) => s.joinRequests.length);
  const pending = useStore((s) => pendingInviteCount(s.invites));

  const subtitle =
    members === 0
      ? joins > 0
        ? `${toPersianDigits(joins)} درخواست عضویت`
        : pending > 0
          ? `${toPersianDigits(pending)} دعوت در انتظار`
          : "هنوز کسی اضافه نشده"
      : `${toPersianDigits(members)} نفر که خودت می‌شناسی`;

  return (
    <Header
      title="حلقه‌ی من"
      subtitle={subtitle}
      action={
        <button
          type="button"
          onClick={onInvite}
          onPointerEnter={preloadInviteSheet}
          onFocus={preloadInviteSheet}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-brand-600 px-2.5 text-[11px] font-bold leading-none text-white active:scale-95 transition-transform duration-150"
        >
          <UserPlusIcon className="block h-4 w-4 shrink-0" />
          دعوت
        </button>
      }
    />
  );
});

const CircleEmptyState = memo(function CircleEmptyState({
  onInvite,
}: {
  onInvite: () => void;
}) {
  return (
    <div className="px-4 pt-10 listing-detail-rise">
      <div className="card p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <UserPlusIcon className="w-7 h-7" />
        </div>
        <p className="font-bold text-ink dark:text-zinc-100">
          حلقه‌ات هنوز خالی است
        </p>
        <p className="text-sm text-ink-muted dark:text-zinc-400 mt-1.5 leading-relaxed">
          خانواده و دوستان را دعوت کن تا آگهی‌ها و رویدادهایشان اینجا دیده شود.
        </p>
        <button
          type="button"
          onClick={onInvite}
          onPointerEnter={preloadInviteSheet}
          onFocus={preloadInviteSheet}
          className="btn-primary inline-block mt-4 min-h-11"
        >
          دعوت اولین نفر
        </button>
      </div>
    </div>
  );
});

const CircleJoinBanner = memo(function CircleJoinBanner({
  onReview,
}: {
  onReview: (req: CircleJoinRequest) => void;
}) {
  const joinRequests = useStore((s) => s.joinRequests);
  if (joinRequests.length === 0) return null;

  return (
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
        {joinRequests.map((req, reqIndex) => (
          <li
            key={req.id}
            className="flex items-center gap-2.5 px-3.5 py-2.5"
          >
            <Avatar
              name={req.guest.name}
              src={req.guest.avatar}
              size="sm"
              showLevel={false}
              eager={reqIndex === 0}
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
              onClick={() => onReview(req)}
              className="shrink-0 text-[12px] font-bold text-brand-700 dark:text-brand-400 px-2 py-1.5"
            >
              بررسی
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

const CircleUnplacedBanner = memo(function CircleUnplacedBanner({
  onPlace,
}: {
  onPlace: () => void;
}) {
  const unplacedCount = useStore((s) => unplacedMembers(s.people).length);
  if (unplacedCount === 0) return null;

  return (
    <div className="card px-3.5 py-3">
      <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
        <span className="nums" dir="ltr">
          {toPersianDigits(unplacedCount)}
        </span>{" "}
        نفر تازه پیوسته‌اند
      </p>
      <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
        الان آگهی‌ات را می‌بینند. اگر خواستی جایگاهشان را عوض کن — اجباری نیست.
      </p>
      <button
        type="button"
        onClick={onPlace}
        onPointerEnter={preloadCircleSheets}
        onFocus={preloadCircleSheets}
        className="mt-2.5 block text-[13px] font-semibold text-brand-700 dark:text-brand-400"
      >
        جایگاه‌ها را مشخص کن
      </button>
    </div>
  );
});

const CircleMembersPanel = memo(function CircleMembersPanel({
  onEditGroup,
}: {
  onEditGroup: (personId: string) => void;
}) {
  const people = useStore((s) => s.people);
  const relationGroups = useMemo(
    () => groupActiveCircle(people, SECTION_PREVIEW),
    [people],
  );
  const memberTotal = useMemo(
    () => relationGroups.reduce((n, g) => n + g.members.length, 0),
    [relationGroups],
  );
  const [relationFilter, setRelationFilter] = useState<RelationType | "all">(
    "all",
  );
  const deferredFilter = useDeferredValue(relationFilter);
  const [openRelations, setOpenRelations] = useState<Set<RelationType>>(
    () => new Set(),
  );
  const [fullRelations, setFullRelations] = useState<Set<RelationType>>(
    () => new Set(),
  );

  const visibleGroups = useMemo(() => {
    if (deferredFilter === "all") return relationGroups;
    return relationGroups.filter((g) => g.relation === deferredFilter);
  }, [relationGroups, deferredFilter]);

  useEffect(() => {
    if (openRelations.size > 0) return;
    const first = relationGroups[0]?.relation;
    if (first) setOpenRelations(new Set([first]));
  }, [relationGroups, openRelations.size]);

  const onPickRelation = useCallback((next: RelationType | "all") => {
    startTransition(() => {
      setRelationFilter(next);
      if (next !== "all") {
        setOpenRelations((prev) => new Set(prev).add(next));
      }
    });
  }, []);

  const onToggleRelation = useCallback(
    (relation: RelationType) => {
      setOpenRelations((prev) => {
        const next = new Set(prev);
        if (next.has(relation) && relationFilter === "all") {
          next.delete(relation);
        } else {
          next.add(relation);
        }
        return next;
      });
    },
    [relationFilter],
  );

  const onShowAll = useCallback((relation: RelationType) => {
    setFullRelations((prev) => new Set(prev).add(relation));
  }, []);

  if (memberTotal === 0) return null;

  return (
    <>
      {relationGroups.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <RelationChip
            value="all"
            active={relationFilter === "all"}
            label="همه"
            count={memberTotal}
            onPick={onPickRelation}
          />
          {relationGroups.map((g) => (
            <RelationChip
              key={g.relation}
              value={g.relation}
              active={relationFilter === g.relation}
              label={relationLabels[g.relation]}
              count={g.members.length}
              onPick={onPickRelation}
            />
          ))}
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <h2 className="px-3.5 pt-3 pb-1 text-[13px] font-bold text-ink dark:text-zinc-100">
          اعضای حلقه
          <span className="text-ink-muted font-semibold">
            {" · "}
            <span className="nums" dir="ltr">
              {toPersianDigits(memberTotal)}
            </span>
          </span>
        </h2>
        {visibleGroups.map((group, i) => {
          const forcedOpen = deferredFilter !== "all";
          const open = forcedOpen || openRelations.has(group.relation);
          const showAll = forcedOpen || fullRelations.has(group.relation);
          return (
            <CircleRelationSection
              key={group.relation}
              group={group}
              bordered={i > 0}
              open={open}
              showAll={showAll}
              eagerFirst={i === 0 && open}
              onToggle={onToggleRelation}
              onShowAll={onShowAll}
              onEditGroup={onEditGroup}
            />
          );
        })}
      </div>
    </>
  );
});

const CircleRelationSection = memo(function CircleRelationSection({
  group,
  bordered,
  open,
  showAll,
  eagerFirst,
  onToggle,
  onShowAll,
  onEditGroup,
}: {
  group: CircleRelationGroup;
  bordered: boolean;
  open: boolean;
  showAll: boolean;
  eagerFirst: boolean;
  onToggle: (relation: RelationType) => void;
  onShowAll: (relation: RelationType) => void;
  onEditGroup: (personId: string) => void;
}) {
  const { relation, members, preview } = group;
  const shown = open ? (showAll ? members : preview) : EMPTY_MEMBERS;
  const hiddenCount = members.length - shown.length;

  return (
    <section
      className={bordered ? "border-t border-stone-100 dark:border-zinc-800" : ""}
    >
      <button
        type="button"
        onClick={() => onToggle(relation)}
        className="w-full flex items-center justify-between gap-2 px-3.5 pt-2.5 pb-1.5 text-right"
        aria-expanded={open}
      >
        <h3 className="text-[13px] font-bold text-ink dark:text-zinc-100">
          {relationLabels[relation]}
          <span className="text-ink-muted font-semibold">
            {" · "}
            <span className="nums" dir="ltr">
              {toPersianDigits(members.length)}
            </span>
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
            {shown.map((p, idx) => (
              <CircleMemberRow
                key={p.id}
                person={p}
                eager={eagerFirst && idx < ABOVE_FOLD_AVATARS}
                onEditGroup={onEditGroup}
              />
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => onShowAll(relation)}
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
});

const CircleGraphLink = memo(function CircleGraphLink() {
  const hasMembers = useStore((s) => activeCircleCount(s.people) > 0);
  if (!hasMembers) return null;

  return (
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
  );
});

const CirclePendingInvites = memo(function CirclePendingInvites({
  onMore,
  onShare,
}: {
  onMore: (invite: Invite) => void;
  onShare: (invite: Invite) => void;
}) {
  const invites = useStore((s) => s.invites);
  const createWaveFromPending = useStore((s) => s.createWaveFromPending);
  const { show } = useToast();
  const pendingInvites = useMemo(
    () => livePendingInvites(invites),
    [invites],
  );
  const personalPending = useMemo(
    () => pendingInvites.filter((inv) => inv.kind === "personal"),
    [pendingInvites],
  );
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [consolidating, setConsolidating] = useState(false);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (pendingInvites.length === 0) return null;

  const shown =
    invitesOpen || selecting
      ? pendingInvites
      : pendingInvites.slice(0, INVITE_PREVIEW);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-1">
        <h2 className="text-[13px] font-bold text-ink dark:text-zinc-100">
          دعوت‌های در انتظار
        </h2>
        <span className="inline-flex min-w-[1.25rem] h-5 px-1.5 items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-[11px] font-bold text-ink-muted nums">
          {toPersianDigits(pendingInvites.length)}
        </span>
        {personalPending.length > 1 ? (
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
        ) : null}
      </div>
      <ul className="divide-y divide-stone-100 dark:divide-zinc-800">
        {shown.map((inv) => (
          <PendingInviteRow
            key={inv.id}
            invite={inv}
            selecting={selecting && inv.kind === "personal"}
            selected={selectedIds.has(inv.id)}
            onToggle={toggleSelected}
            onMore={onMore}
          />
        ))}
      </ul>
      {!invitesOpen &&
      !selecting &&
      pendingInvites.length > INVITE_PREVIEW ? (
        <button
          type="button"
          onClick={() => setInvitesOpen(true)}
          className="w-full py-2.5 text-[12px] font-bold text-brand-700 dark:text-brand-300"
        >
          {toPersianDigits(pendingInvites.length - INVITE_PREVIEW)} دعوت دیگر
        </button>
      ) : null}
      {selecting && selectedIds.size > 0 ? (
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
                  onShare(invite);
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
      ) : null}
    </div>
  );
});

function CircleJoinHost({
  request,
  onClose,
}: {
  request: CircleJoinRequest;
  onClose: () => void;
}) {
  const acceptJoinRequest = useStore((s) => s.acceptJoinRequest);
  const rejectJoinRequest = useStore((s) => s.rejectJoinRequest);
  const { show } = useToast();

  return (
    <JoinRequestSheet
      request={request}
      onClose={onClose}
      onAccept={async (input) => {
        const name = input.displayName;
        try {
          await acceptJoinRequest(request.id, input);
          onClose();
          show(`${name} به حلقه اضافه شد`);
        } catch {
          show("قبول درخواست ممکن نشد");
        }
      }}
      onReject={async () => {
        try {
          await rejectJoinRequest(request.id);
          onClose();
          show("درخواست رد شد");
        } catch {
          show("رد درخواست ممکن نشد");
        }
      }}
    />
  );
}

function CircleGroupHost({
  personId,
  onClose,
}: {
  personId: string;
  onClose: () => void;
}) {
  const person = useStore((s) => {
    for (const p of s.people) if (p.id === personId) return p;
    return null;
  });
  const setLevel = useStore((s) => s.setLevel);
  const { show } = useToast();
  if (!person) return null;

  return (
    <GroupSheet
      person={person}
      onClose={onClose}
      onPick={(lvl: TrustLevel) => {
        const prev = person.level;
        const name = person.name;
        onClose();
        if (lvl === prev) return;
        setLevel(person.id, lvl);
        show(`${name} به «${levelLabels[lvl]}» منتقل شد.`, {
          action: {
            label: "بازگرداندن",
            onClick: () => setLevel(person.id, prev),
          },
        });
      }}
    />
  );
}

function CirclePlaceHost({ onClose }: { onClose: () => void }) {
  const people = useStore((s) => s.people);
  const setLevel = useStore((s) => s.setLevel);
  const { show } = useToast();
  const unplaced = useMemo(() => unplacedMembers(people), [people]);
  if (unplaced.length === 0) return null;

  return (
    <PlaceTrustSheet
      people={unplaced}
      onClose={onClose}
      onPick={(person, lvl) => {
        setLevel(person.id, lvl);
        show(`${person.name} به «${levelLabels[lvl]}» منتقل شد.`);
        if (unplaced.length <= 1) onClose();
      }}
    />
  );
}

function CircleShareHost({
  invite,
  onClose,
}: {
  invite: Invite;
  onClose: () => void;
}) {
  const meName = useStore((s) => s.me.name);
  return (
    <InviteSharePanel invite={invite} inviterName={meName} onClose={onClose} />
  );
}

function CircleMoreInviteHost({
  invite,
  onClose,
}: {
  invite: Invite;
  onClose: () => void;
}) {
  const meName = useStore((s) => s.me.name);
  const revokeInvite = useStore((s) => s.revokeInvite);
  const { show } = useToast();

  return (
    <InviteMoreSheet
      invite={invite}
      inviterName={meName}
      onClose={onClose}
      onRevoke={() => {
        const id = invite.id;
        onClose();
        void revokeInvite(id).then(
          () => show("دعوت لغو شد"),
          () => show("لغو دعوت ممکن نشد"),
        );
      }}
    />
  );
}

const RelationChip = memo(function RelationChip({
  value,
  active,
  label,
  count,
  onPick,
}: {
  value: RelationType | "all";
  active: boolean;
  label: string;
  count: number;
  onPick: (next: RelationType | "all") => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      className={`chip whitespace-nowrap !px-2.5 !py-1.5 border text-[12px] inline-flex items-center gap-1.5 ${
        active
          ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20"
          : "bg-[color:var(--circle-surface)] text-ink-muted dark:text-zinc-300 border-stone-200/70 dark:border-zinc-700"
      }`}
    >
      {label}
      <span
        dir="ltr"
        className={`nums ${active ? "text-white/80" : "text-ink-faint"}`}
      >
        {toPersianDigits(count)}
      </span>
    </button>
  );
});

const CircleMemberRow = memo(function CircleMemberRow({
  person,
  eager,
  onEditGroup,
}: {
  person: Person;
  eager?: boolean;
  onEditGroup: (personId: string) => void;
}) {
  const line = circleRelationLine(person);
  return (
    <li className="flex items-center gap-2.5 px-3.5 py-2">
      <Link
        href={`/person/${person.id}`}
        className="flex items-center gap-2.5 min-w-0 flex-1 active:opacity-90 transition-opacity"
      >
        <Avatar
          name={person.name}
          src={person.avatar}
          size="sm"
          showLevel={false}
          eager={eager}
        />
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[13px] text-ink dark:text-zinc-100 truncate leading-snug">
            {person.name}
          </span>
          <span className="block text-[11px] text-ink-muted mt-px truncate leading-snug">
            {line}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => onEditGroup(person.id)}
        onPointerEnter={preloadCircleSheets}
        onFocus={preloadCircleSheets}
        aria-label={`تغییر گروه ${person.name}`}
        className="shrink-0 max-w-[7.5rem] inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted dark:text-zinc-400 px-2 py-1.5 rounded-lg active:bg-stone-100 dark:active:bg-zinc-800"
      >
        <span className="truncate">{levelLabels[person.level]}</span>
        <span className="text-[11px] leading-none shrink-0" aria-hidden>
          ▾
        </span>
      </button>
    </li>
  );
});

const PendingInviteRow = memo(function PendingInviteRow({
  invite,
  onMore,
  selecting,
  selected,
  onToggle,
}: {
  invite: Invite;
  onMore: (invite: Invite) => void;
  selecting?: boolean;
  selected?: boolean;
  onToggle: (id: string) => void;
}) {
  const { title, sub, isWave } = inviteRowCopy(invite);
  const [open, setOpen] = useState(false);
  const roster = invite.expected ?? [];

  return (
    <li>
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        {selecting ? (
          <button
            type="button"
            onClick={() => onToggle(invite.id)}
            aria-pressed={selected}
            aria-label={selected ? `حذف ${title}` : `انتخاب ${title}`}
            className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selected
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-stone-300 dark:border-zinc-600"
            }`}
          >
            {selected ? (
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
              </svg>
            ) : null}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => (isWave ? setOpen((v) => !v) : onMore(invite))}
          className="min-w-0 flex-1 text-right"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="font-bold text-[13px] text-ink dark:text-zinc-100 truncate">
              {title}
            </p>
            {isWave ? (
              <span className="shrink-0 text-[11px] font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15 px-1.5 py-0.5 rounded-md">
                گروهی
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5 nums truncate">{sub}</p>
        </button>
        <button
          type="button"
          onClick={() => onMore(invite)}
          onPointerEnter={preloadCircleSheets}
          onFocus={preloadCircleSheets}
          aria-label={`گزینه‌های ${title}`}
          className="shrink-0 w-10 h-10 rounded-lg text-ink-muted dark:text-zinc-400 active:bg-stone-100 dark:active:bg-zinc-800 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <circle cx="12" cy="6" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="18" r="1.6" />
          </svg>
        </button>
      </div>
      {isWave && open && roster.length > 0 ? (
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
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
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
                {row.name?.trim() ? (
                  <span
                    dir="ltr"
                    className="block text-[11px] text-ink-muted nums"
                  >
                    {formatPhoneDisplay(row.phone)}
                  </span>
                ) : null}
              </span>
              <span className="text-[11px] font-semibold text-ink-muted">
                {row.joined ? "پیوست" : "در انتظار"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
});
