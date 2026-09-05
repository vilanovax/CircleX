import { activeCircle } from "@/lib/circle-member";
import { privacyLabels, relationLabels } from "@/lib/labels";
import { requiredScore } from "@/lib/trust";
import type {
  Endorsement,
  Listing,
  Person,
  Privacy,
  RelationType,
  TrustHop,
} from "@/lib/types";

const LEVEL_VALUE = { A: 3, B: 2, C: 1 } as const;

export const CIRCLE_MEMBER_NAME = "یکی از اعضای سیرکل";

export const HIDDEN_SELLER_PREFIX = "hidden:";

/** Dedicated faces for identity-hidden listings — not in the profile picker. */
export const PRIVATE_LISTING_AVATARS = Array.from(
  { length: 50 },
  (_, i) => `/avatars/private/${String(i + 1).padStart(2, "0")}.webp`,
);

export function privateListingAvatar(listingId: string): string {
  let hash = 2166136261;
  for (let i = 0; i < listingId.length; i++) {
    hash ^= listingId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return PRIVATE_LISTING_AVATARS[(hash >>> 0) % PRIVATE_LISTING_AVATARS.length];
}

export function listingIdFromHiddenSeller(id: string): string | undefined {
  if (!id.startsWith(HIDDEN_SELLER_PREFIX)) return undefined;
  const listingId = id.slice(HIDDEN_SELLER_PREFIX.length);
  return listingId || undefined;
}

const RELATION_TYPES: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

/** Inbox row when the peer is not on the circle roster yet. */
export function inboxUnknownPeer(id: string): Person {
  return {
    id,
    name: "گفتگو",
    avatar: "/avatars/01.webp",
    relation: "acquaintance",
    level: "C",
    deals: 0,
    inMyCircle: false,
    note: "از پیام",
  };
}

export function circleMemberPerson(id: string, listingId?: string): Person {
  const lid = listingId ?? listingIdFromHiddenSeller(id);
  return {
    id,
    name: CIRCLE_MEMBER_NAME,
    avatar: lid ? privateListingAvatar(lid) : PRIVATE_LISTING_AVATARS[0],
    relation: "acquaintance",
    level: "C",
    deals: 0,
    inMyCircle: false,
  };
}

export function isHiddenSellerId(id: string): boolean {
  return id.startsWith(HIDDEN_SELLER_PREFIX);
}

export function hiddenSellerId(listingId: string): string {
  return `${HIDDEN_SELLER_PREFIX}${listingId}`;
}

export function threadKey(peerId: string, listingId?: string | null): string {
  const listing = listingId?.trim();
  return listing ? `${peerId}::${listing}` : peerId;
}

export function parseThreadKey(key: string): {
  peerId: string;
  listingId?: string;
} {
  const at = key.indexOf("::");
  if (at <= 0) return { peerId: key };
  return { peerId: key.slice(0, at), listingId: key.slice(at + 2) };
}

export function listingChatHref(
  listing: Pick<Listing, "id" | "sellerId" | "privatePublish">,
  extra?: { draft?: string; peerId?: string },
): string {
  const listingQ = encodeURIComponent(listing.id);
  const draft = extra?.draft
    ? `&draft=${encodeURIComponent(extra.draft)}`
    : "";
  if (listing.privatePublish) {
    if (extra?.peerId && extra.peerId !== "me" && !isHiddenSellerId(extra.peerId)) {
      return `/messages/${encodeURIComponent(extra.peerId)}?listing=${listingQ}&scoped=1${draft.replace(/^&/, "&")}`;
    }
    return `/messages/listing/${encodeURIComponent(listing.id)}${extra?.draft ? `?draft=${encodeURIComponent(extra.draft)}` : ""}`;
  }
  const peer = extra?.peerId ?? listing.sellerId;
  return `/messages/${encodeURIComponent(peer)}?listing=${listingQ}&scoped=1${draft}`;
}

export function audienceIsWider(from: Privacy, to: Privacy): boolean {
  return requiredScore(to) < requiredScore(from);
}

export function viewerExcludedFromListing(opts: {
  viewerId: string;
  excludePersonIds: Iterable<string>;
  excludeRelationTypes: Iterable<RelationType>;
  sellerToViewerRelation?: RelationType | null;
}): boolean {
  for (const id of Array.from(opts.excludePersonIds)) {
    if (id === opts.viewerId) return true;
  }
  const relation = opts.sellerToViewerRelation;
  if (!relation) return false;
  for (const type of Array.from(opts.excludeRelationTypes)) {
    if (type === relation) return true;
  }
  return false;
}

export function parseRelationTypes(value: unknown): RelationType[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<RelationType>();
  const out: RelationType[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    if (!RELATION_TYPES.includes(item as RelationType)) continue;
    const type = item as RelationType;
    if (seen.has(type)) continue;
    seen.add(type);
    out.push(type);
  }
  return out;
}

export function parsePersonIds(value: unknown, max = 40): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (id.length < 8 || id === "me" || isHiddenSellerId(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

export function listingAudienceLine(privacy: Privacy): string {
  return `این آگهی را ${privacyLabels[privacy]} می‌بینند.`;
}

/** People in the owner’s circle who can see this listing under current rules. */
export function listingVisibleCircleMembers(opts: {
  people: Person[];
  privacy: Privacy;
  excludePersonIds?: string[];
  excludeRelationTypes?: RelationType[];
}): Person[] {
  const need = requiredScore(opts.privacy);
  const excludedIds = new Set(opts.excludePersonIds ?? []);
  const excludedRelations = new Set(opts.excludeRelationTypes ?? []);
  return activeCircle(opts.people)
    .filter((person) => LEVEL_VALUE[person.level] >= need)
    .filter((person) => !excludedIds.has(person.id))
    .filter((person) => !excludedRelations.has(person.relation))
    .sort((a, b) => a.name.localeCompare(b.name, "fa"));
}

export function listingPrivacySummary(opts: {
  privacy: Privacy;
  hideIdentity: boolean;
  excludePersonNames: string[];
  excludeRelationTypes: RelationType[];
}): string[] {
  const lines = [listingAudienceLine(opts.privacy)];
  const blocks: string[] = opts.excludeRelationTypes.map(
    (type) => relationLabels[type],
  );
  if (opts.excludePersonNames.length) {
    blocks.push(opts.excludePersonNames.join(" و "));
  }
  if (blocks.length) {
    lines.push(`${blocks.join(" و ")} آن را نمی‌بینند.`);
  }
  lines.push(
    opts.hideIdentity
      ? "هویت تو برای همه پنهان است."
      : "نام و تصویر تو روی آگهی دیده می‌شود.",
  );
  return lines;
}

export type ListingIdentityView = {
  hideIdentity: boolean;
  revealed: boolean;
  isOwner: boolean;
  excludePersonIds?: string[];
  excludeRelationTypes?: RelationType[];
  identityRevealedPeerIds?: string[];
  viewerTrustScore?: number;
  viewerDirect?: boolean;
};

export function applyListingIdentity<
  T extends {
    id: string;
    sellerId: string;
    trustPath: TrustHop[];
    endorsements: Endorsement[];
  },
>(row: T, view: ListingIdentityView): T & {
  privatePublish: boolean;
  identityHidden: boolean;
  excludePersonIds?: string[];
  excludeRelationTypes?: RelationType[];
  identityRevealedPeerIds?: string[];
  privateAvatar?: string;
  viewerTrustScore?: number;
  viewerDirect?: boolean;
} {
  const identityHidden =
    view.hideIdentity && !view.isOwner && !view.revealed;
  const sellerId = view.isOwner
    ? "me"
    : identityHidden
      ? hiddenSellerId(row.id)
      : row.sellerId;
  const viewerDirect =
    view.viewerDirect ?? (view.isOwner || row.trustPath.length === 0);
  const viewerTrustScore = view.isOwner
    ? undefined
    : (view.viewerTrustScore ?? 1);
  return {
    ...row,
    sellerId,
    trustPath: identityHidden ? [] : row.trustPath,
    endorsements: identityHidden ? [] : row.endorsements,
    privatePublish: view.hideIdentity,
    identityHidden,
    viewerDirect,
    ...(viewerTrustScore != null ? { viewerTrustScore } : {}),
    ...(view.hideIdentity
      ? { privateAvatar: privateListingAvatar(row.id) }
      : {}),
    ...(view.isOwner
      ? {
          excludePersonIds: view.excludePersonIds ?? [],
          excludeRelationTypes: view.excludeRelationTypes ?? [],
          identityRevealedPeerIds: view.identityRevealedPeerIds ?? [],
        }
      : {}),
  };
}
