import { isActiveCircleMember } from "./circle-member";
import type { Endorsement, Listing, Person, Privacy, TrustHop } from "./types";
import { relationLabels } from "./labels";
import { toPersianDigits } from "./persian";

const levelValue = { A: 3, B: 2, C: 1 } as const;

/**
 * The viewer's effective trust score toward a poster.
 * - Own post → Infinity.
 * - Directly in my circle → the level I assigned them (A=3, B=2, C=1).
 * - Reached via a path → the nearest connector's level, minus one per extra hop.
 * Returns 0 when there is no connection at all.
 */
export function trustScore(
  posterId: string,
  trustPath: TrustHop[],
  getPerson: (id: string) => Person | undefined,
): number {
  if (posterId === "me") return Infinity;

  if (trustPath.length === 0) {
    const poster = getPerson(posterId);
    if (!poster || !isActiveCircleMember(poster)) return 0;
    return levelValue[poster.level];
  }

  // trustPath[0] is the person in my circle (closest to me).
  const connector = getPerson(trustPath[0].personId);
  if (!connector || !isActiveCircleMember(connector)) return 0;
  const base = levelValue[connector.level];
  const hopPenalty = trustPath.length - 1;
  return Math.max(0, base - hopPenalty);
}

/** Minimum trust score a viewer needs for each privacy setting. */
function requiredScore(privacy: Privacy): number {
  switch (privacy) {
    case "A":
      return 3;
    case "AB":
      return 2;
    case "ABC":
      return 1;
    case "referral":
      return 1; // any connection counts as a referral
    case "approved":
      return 3; // approximated: only my closest are pre-approved
  }
}

/** Whether the current viewer is allowed to see this listing/request/event. */
export function canView(
  poster: {
    sellerId?: string;
    requesterId?: string;
    hostId?: string;
    privacy: Privacy;
    trustPath: TrustHop[];
  },
  getPerson: (id: string) => Person | undefined,
): boolean {
  const posterId = poster.sellerId ?? poster.requesterId ?? poster.hostId ?? "";
  if (posterId === "me") return true;
  // "approved" also requires a direct connection, not just a high score via path.
  if (poster.privacy === "approved" && poster.trustPath.length > 0) return false;
  return trustScore(posterId, poster.trustPath, getPerson) >= requiredScore(poster.privacy);
}

export type TrustContentKind = "listing" | "request" | "event";

/** How this person relates to the viewer — for trust copy on cards. */
export function viewerRelationPhrase(person: Person): string {
  const note = person.note ?? "";
  if (/خواهر/.test(note)) return "خواهر تو";
  if (/برادر/.test(note)) return "برادر تو";
  if (/همسر/.test(note)) return "همسر تو";
  if (/همکار/.test(note)) return "همکار تو";
  if (/همسایه/.test(note)) return "همسایه تو";
  if (/دوست/.test(note)) return "دوست تو";
  return relationLabels[person.relation];
}

/** One-line chat header: direct relation, or path — never a circle placement chip. */
export function chatPeerSubtitle(
  person: Person,
  viaName?: string | null,
): string {
  if (isActiveCircleMember(person)) return viewerRelationPhrase(person);
  if (viaName) return `از طریق ${viaName}`;
  return "از طریق حلقه‌ات";
}

const ownContentRelation: Record<TrustContentKind, string> = {
  listing: "آگهی‌ات",
  request: "درخواستت",
  event: "رویدادت",
};

/**
 * Name-line relation next to the poster (e.g. «حسین · همکار سارا»).
 * Never uses the trust-path connector's label — that belongs on the path/endorsement line.
 */
export function posterCardRelation(
  poster: Person,
  opts?: { isOwn?: boolean; contentKind?: TrustContentKind },
): string {
  if (opts?.isOwn) {
    return ownContentRelation[opts.contentKind ?? "listing"];
  }
  if (isActiveCircleMember(poster)) return viewerRelationPhrase(poster);
  const note = poster.note?.trim();
  if (note) return note;
  return relationLabels[poster.relation];
}

/**
 * Proximity line for feed cards — only when relation alone is not enough.
 * Direct circle with a clear relation → null (avoid «خواهر تو» + «نزدیک»).
 * Indirect / FoF → «از طریق آشنایان».
 */
export function posterProximityLabel(
  poster: Person,
  trustPath: TrustHop[],
): string | null {
  if (poster.id === "me") return null;
  if (isActiveCircleMember(poster) && trustPath.length === 0) {
    return null;
  }
  return "از طریق آشنایان";
}

const ownContentHeadline: Record<TrustContentKind, string> = {
  listing: "آگهی‌ات در حلقه",
  request: "درخواستت در حلقه",
  event: "رویدادت در حلقه",
};

const endorsementObject: Record<TrustContentKind, string> = {
  listing: "این را",
  request: "این درخواست را",
  event: "این رویداد را",
};

/** Primary trust line for listing/request/event cards. */
export function trustHighlightMessage(
  posterId: string,
  trustPath: TrustHop[],
  getPerson: (id: string) => Person | undefined,
  posterRole = "فروشنده",
  contentKind: TrustContentKind = "listing",
): { headline: string; subline?: string } | null {
  const poster = getPerson(posterId);
  if (!poster) return null;

  if (posterId === "me") {
    return { headline: ownContentHeadline[contentKind] };
  }

  if (trustPath.length === 0 && isActiveCircleMember(poster)) {
    return {
      headline: `${poster.name} را مستقیم می‌شناسی`,
      subline: viewerRelationPhrase(poster),
    };
  }

  if (trustPath.length === 1) {
    const connector = getPerson(trustPath[0].personId);
    if (!connector) return null;
    const rel =
      trustPath[0].relationLabel.replace(/\s*من\s*$/, " تو").trim() ||
      viewerRelationPhrase(connector);
    return {
      headline: `توسط ${connector.name} معرفی شده`,
      subline: rel,
    };
  }

  if (trustPath.length > 1) {
    const hops = trustPath
      .map((h) => getPerson(h.personId)?.name)
      .filter(Boolean) as string[];
    const chain = ["تو", ...hops, poster.name].join(" ← ");
    return {
      headline: "از مسیر ارتباط",
      subline: chain,
    };
  }

  // Reachable but no path stored — fallback.
  return {
    headline: `${poster.name} از طریق حلقه‌ات`,
    subline: posterRole,
  };
}

/** Secondary line when trusted people endorsed a listing/request/event. */
export function endorsementHighlightLine(
  endorsements: Endorsement[],
  getPerson: (id: string) => Person | undefined,
  contentKind: TrustContentKind = "listing",
): string | null {
  const ids = Array.from(new Set(endorsements.map((e) => e.personId)));
  if (ids.length === 0) return null;
  const names = ids
    .map((id) => getPerson(id)?.name)
    .filter(Boolean) as string[];
  const object = endorsementObject[contentKind];
  if (names.length === 1) {
    return `${names[0]} از حلقه‌تان ${object} تأیید کرده`;
  }
  if (names.length === 2) {
    return `${names[0]} و ${names[1]} از حلقه‌تان ${object} تأیید کرده‌اند`;
  }
  return `${toPersianDigits(names.length)} نفر از حلقه‌تان ${object} تأیید کرده‌اند`;
}

/** Split listings into what the viewer may see and how many are hidden. */
export function filterByAccess(
  listings: Listing[],
  getPerson: (id: string) => Person | undefined,
): { visible: Listing[]; hidden: number } {
  const visible = listings.filter((l) => canView(l, getPerson));
  return { visible, hidden: listings.length - visible.length };
}

/**
 * Who can see a post at a given privacy level, with the exact circle count.
 * Do not prefix «حدود» — A/AB/ABC counts are the people already in the circle.
 */
export function privacyAudience(privacy: Privacy, circle: Person[]): string {
  const a = circle.filter((p) => p.level === "A").length;
  const b = circle.filter((p) => p.level === "B").length;
  const c = circle.filter((p) => p.level === "C").length;
  const fa = (n: number) => toPersianDigits(n);
  switch (privacy) {
    case "A":
      return a === 0
        ? "هنوز نزدیکانی در حلقه نیست"
        : `${fa(a)} نفر از نزدیکانت`;
    case "AB":
      return a + b === 0
        ? "هنوز کسی در این گروه‌ها نیست"
        : `${fa(a + b)} نفر از نزدیکان و افراد مورد اعتمادت`;
    case "ABC":
      return a + b + c === 0
        ? "حلقه‌ات هنوز خالی است"
        : `${fa(a + b + c)} نفر از حلقه‌ات`;
    case "referral":
      return "حلقه‌ات و آشنایان آن‌ها";
    case "approved":
      return "فقط با اجازهٔ تو";
  }
}
