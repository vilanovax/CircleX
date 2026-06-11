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
    return poster ? levelValue[poster.level] : 0;
  }

  // trustPath[0] is the person in my circle (closest to me).
  const connector = getPerson(trustPath[0].personId);
  if (!connector) return 0;
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

/** How this person relates to the viewer — for trust copy on cards. */
export function viewerRelationPhrase(person: Person): string {
  const note = person.note ?? "";
  if (/خواهر/.test(note)) return "خواهر شما";
  if (/برادر/.test(note)) return "برادر شما";
  if (/همسر/.test(note)) return "همسر شما";
  if (/همکار/.test(note)) return "همکار شما";
  if (/همسایه/.test(note)) return "همسایه‌ی شما";
  if (/دوست/.test(note)) return "دوست شما";
  return relationLabels[person.relation];
}

/** Primary trust line for listing/request/event cards. */
export function trustHighlightMessage(
  posterId: string,
  trustPath: TrustHop[],
  getPerson: (id: string) => Person | undefined,
  posterRole = "فروشنده",
): { headline: string; subline?: string } | null {
  const poster = getPerson(posterId);
  if (!poster) return null;

  if (posterId === "me") {
    return { headline: "آگهی خودتان در حلقه" };
  }

  if (trustPath.length === 0 && poster.inMyCircle) {
    return {
      headline: `${poster.name} در حلقه‌ی مستقیم شماست`,
      subline: viewerRelationPhrase(poster),
    };
  }

  if (trustPath.length === 1) {
    const connector = getPerson(trustPath[0].personId);
    if (!connector) return null;
    const rel =
      trustPath[0].relationLabel.replace(/\s*من\s*$/, " شما").trim() ||
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
    const chain = ["شما", ...hops, poster.name].join(" ← ");
    return {
      headline: "از مسیر اعتماد",
      subline: chain,
    };
  }

  // Reachable but no path stored — fallback.
  return {
    headline: `${poster.name} از طریق حلقه‌ی شما`,
    subline: posterRole,
  };
}

/** Secondary line when trusted people endorsed the listing. */
export function endorsementHighlightLine(
  endorsements: Endorsement[],
  getPerson: (id: string) => Person | undefined,
): string | null {
  const ids = Array.from(new Set(endorsements.map((e) => e.personId)));
  if (ids.length === 0) return null;
  const names = ids
    .map((id) => getPerson(id)?.name)
    .filter(Boolean) as string[];
  if (names.length === 1) {
    return `${names[0]} از حلقه‌تان این را تأیید کرده`;
  }
  if (names.length === 2) {
    return `${names[0]} و ${names[1]} از حلقه‌تان تأیید کرده‌اند`;
  }
  return `${toPersianDigits(names.length)} نفر از حلقه‌تان این را تأیید کرده‌اند`;
}

/** Split listings into what the viewer may see and how many are hidden. */
export function filterByAccess(
  listings: Listing[],
  getPerson: (id: string) => Person | undefined,
): { visible: Listing[]; hidden: number } {
  const visible = listings.filter((l) => canView(l, getPerson));
  return { visible, hidden: listings.length - visible.length };
}
