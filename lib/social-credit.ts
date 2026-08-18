import { isActiveCircleMember } from "./circle-member";
import type { Listing, Person } from "./types";
import { toPersianDigits } from "./persian";

export interface SocialCreditStats {
  successfulDeals: number;
  endorsementsReceived: number;
  endorsementsGiven: number;
  /** Optional network/activity count — not mixed into trust score. */
  activityCount: number;
  memberSince: string;
  responseRate: number;
  lastActive: string;
  /**
   * Internal composite for optional “how is this calculated?” — not a
   * platform certification. Excludes endorsements the person gave to others.
   */
  score: number;
  label: "عالی" | "خوب" | "متوسط" | "تازه‌وارد";
  /** Soft membership / activity hint — never “identity verified”. */
  verified: boolean;
  verifiedLabel: string;
}

/** @deprecated Use activityCount — kept for older call sites that passed circleSize. */
export type SocialCreditStatsLegacy = SocialCreditStats & { circleSize: number };

/** Count of endorsement records on this person's listings (not unique people). */
function endorsementsReceivedCount(personId: string, listings: Listing[]): number {
  let n = 0;
  for (const listing of listings) {
    if (listing.sellerId !== personId) continue;
    n += listing.endorsements.filter((e) => !e.hidden).length;
  }
  return n;
}

function uniqueEndorsersReceivedCount(
  personId: string,
  listings: Listing[],
): number {
  const endorsers = new Set<string>();
  for (const listing of listings) {
    if (listing.sellerId !== personId) continue;
    for (const e of listing.endorsements) {
      if (e.hidden) continue;
      endorsers.add(e.personId);
    }
  }
  return endorsers.size;
}

function endorsementsGivenCount(personId: string, listings: Listing[]): number {
  return listings.reduce(
    (sum, l) => sum + l.endorsements.filter((e) => e.personId === personId).length,
    0,
  );
}

function scoreLabel(score: number): SocialCreditStats["label"] {
  if (score >= 85) return "عالی";
  if (score >= 70) return "خوب";
  if (score >= 50) return "متوسط";
  return "تازه‌وارد";
}

/**
 * Soft labels only — never imply KYC / platform certification.
 * Prefer empty when the person is already in the viewer’s direct circle.
 */
function trustHint(
  person: Person,
  stats: Pick<
    SocialCreditStats,
    "score" | "endorsementsReceived" | "successfulDeals"
  >,
): { verified: boolean; verifiedLabel: string } {
  if (person.id === "me") {
    return { verified: false, verifiedLabel: "" };
  }
  if (isActiveCircleMember(person)) {
    return { verified: true, verifiedLabel: "او را مستقیم می‌شناسی" };
  }
  if (stats.endorsementsReceived >= 1) {
    return {
      verified: true,
      verifiedLabel: `${toPersianDigits(stats.endorsementsReceived)} تأیید از اعضای حلقه`,
    };
  }
  if (stats.successfulDeals >= 5) {
    return { verified: true, verifiedLabel: "سابقهٔ چند معامله تکمیل‌شده" };
  }
  return { verified: false, verifiedLabel: "" };
}

/**
 * Evidence-first stats for a profile.
 * Third argument is activity count (e.g. visible listings+requests), not “circle size”.
 */
export function buildSocialCredit(
  person: Person,
  listings: Listing[],
  activityCount = 0,
): SocialCreditStats & { circleSize: number } {
  // Always derive from listings so hero/list never disagree with mock overrides.
  const endorsementsReceived = endorsementsReceivedCount(person.id, listings);
  const uniqueEndorsers = uniqueEndorsersReceivedCount(person.id, listings);
  const endorsementsGiven = endorsementsGivenCount(person.id, listings);
  const responseRate = person.responseRate ?? 80;
  const successfulDeals = person.deals;

  // Trust-relevant only — giving endorsements is participation, not credibility.
  // Weight unique endorsers more than raw badge spam from one person.
  const score = Math.min(
    100,
    Math.round(
      successfulDeals * 5 +
        uniqueEndorsers * 10 +
        endorsementsReceived * 2 +
        responseRate * 0.3,
    ),
  );

  const base = {
    successfulDeals,
    endorsementsReceived,
    endorsementsGiven,
    activityCount,
    circleSize: activityCount,
    memberSince: person.memberSince ?? "۱۴۰۴",
    responseRate,
    lastActive: person.lastActive ?? "این هفته",
    score,
    label: scoreLabel(score),
  };

  const { verified, verifiedLabel } = trustHint(person, base);

  return { ...base, verified, verifiedLabel };
}

export function formatPercent(value: number): string {
  return `${toPersianDigits(value)}٪`;
}

/** Human-readable evidence line for profile heroes (no opaque score). */
export function evidenceSummaryLine(
  stats: SocialCreditStats,
  opts?: { uniqueEndorsers?: number },
): string {
  const parts: string[] = [];
  if (stats.successfulDeals > 0) {
    parts.push(`${toPersianDigits(stats.successfulDeals)} معامله تکمیل‌شده`);
  }
  if (stats.endorsementsReceived > 0) {
    const unique = opts?.uniqueEndorsers;
    if (unique != null && unique > 0) {
      parts.push(
        `${toPersianDigits(stats.endorsementsReceived)} تأیید از ${toPersianDigits(unique)} عضو حلقه`,
      );
    } else {
      parts.push(
        `${toPersianDigits(stats.endorsementsReceived)} تأیید از اعضای حلقه`,
      );
    }
  }
  return parts.join(" · ");
}
