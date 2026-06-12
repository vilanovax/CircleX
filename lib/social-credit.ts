import type { Listing, Person } from "./types";
import { toPersianDigits } from "./persian";

export interface SocialCreditStats {
  successfulDeals: number;
  endorsementsReceived: number;
  endorsementsGiven: number;
  circleSize: number;
  memberSince: string;
  responseRate: number;
  lastActive: string;
  score: number;
  label: "عالی" | "خوب" | "متوسط" | "تازه‌وارد";
  /** Data-driven trust badge — not shown for everyone. */
  verified: boolean;
  verifiedLabel: string;
}

function endorsementsReceivedCount(personId: string, listings: Listing[]): number {
  const endorsers = new Set<string>();
  for (const listing of listings) {
    if (listing.sellerId !== personId) continue;
    for (const e of listing.endorsements) endorsers.add(e.personId);
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

function trustVerified(
  person: Person,
  stats: Pick<
    SocialCreditStats,
    "score" | "endorsementsReceived" | "successfulDeals" | "endorsementsGiven"
  >,
): { verified: boolean; verifiedLabel: string } {
  if (stats.score >= 75 && stats.endorsementsReceived >= 1) {
    return { verified: true, verifiedLabel: "تأییدشده در شبکه" };
  }
  if (stats.successfulDeals >= 5) {
    return { verified: true, verifiedLabel: "معامله‌گر باتجربه" };
  }
  if (stats.endorsementsGiven >= 3) {
    return { verified: true, verifiedLabel: "تأییدکننده‌ی فعال" };
  }
  if (person.inMyCircle && stats.score >= 60) {
    return { verified: true, verifiedLabel: "عضو حلقه‌ی شما" };
  }
  return { verified: false, verifiedLabel: "" };
}

/** Airbnb / LinkedIn-style trust signals for a profile. */
export function buildSocialCredit(
  person: Person,
  listings: Listing[],
  circleSize: number,
): SocialCreditStats {
  const endorsementsReceived =
    person.endorsementsReceived ?? endorsementsReceivedCount(person.id, listings);
  const endorsementsGiven = endorsementsGivenCount(person.id, listings);
  const responseRate = person.responseRate ?? 80;
  const successfulDeals = person.deals;

  const score = Math.min(
    100,
    Math.round(
      successfulDeals * 4 +
        endorsementsReceived * 6 +
        endorsementsGiven * 2 +
        circleSize * 2 +
        responseRate * 0.25,
    ),
  );

  const base = {
    successfulDeals,
    endorsementsReceived,
    endorsementsGiven,
    circleSize,
    memberSince: person.memberSince ?? "۱۴۰۴",
    responseRate,
    lastActive: person.lastActive ?? "این هفته",
    score,
    label: scoreLabel(score),
  };

  const { verified, verifiedLabel } = trustVerified(person, base);

  return { ...base, verified, verifiedLabel };
}

export function formatPercent(value: number): string {
  return `${toPersianDigits(value)}٪`;
}
