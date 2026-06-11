import type { Listing, Person } from "./types";
import { toPersianDigits } from "./persian";

export interface SocialCreditStats {
  successfulDeals: number;
  endorsementsReceived: number;
  circleSize: number;
  memberSince: string;
  responseRate: number;
  lastActive: string;
  score: number;
  label: "عالی" | "خوب" | "متوسط" | "تازه‌وارد";
}

function endorsementsFromListings(personId: string, listings: Listing[]): number {
  const endorsers = new Set<string>();
  for (const listing of listings) {
    if (listing.sellerId !== personId) continue;
    for (const e of listing.endorsements) endorsers.add(e.personId);
  }
  return endorsers.size;
}

function scoreLabel(score: number): SocialCreditStats["label"] {
  if (score >= 85) return "عالی";
  if (score >= 70) return "خوب";
  if (score >= 50) return "متوسط";
  return "تازه‌وارد";
}

/** Airbnb / LinkedIn-style trust signals for a profile. */
export function buildSocialCredit(
  person: Person,
  listings: Listing[],
  circleSize: number,
): SocialCreditStats {
  const endorsementsReceived =
    person.endorsementsReceived ?? endorsementsFromListings(person.id, listings);
  const responseRate = person.responseRate ?? 80;
  const successfulDeals = person.deals;

  const score = Math.min(
    100,
    Math.round(
      successfulDeals * 4 +
        endorsementsReceived * 6 +
        circleSize * 2 +
        responseRate * 0.25,
    ),
  );

  return {
    successfulDeals,
    endorsementsReceived,
    circleSize,
    memberSince: person.memberSince ?? "۱۴۰۴",
    responseRate,
    lastActive: person.lastActive ?? "این هفته",
    score,
    label: scoreLabel(score),
  };
}

export function formatPercent(value: number): string {
  return `${toPersianDigits(value)}٪`;
}
