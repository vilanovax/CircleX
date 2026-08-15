import type {
  CircleEdge,
  CircleJoinRequest as DbJoinRequest,
  Invite as DbInvite,
  InviteExpected,
  InviteStatus as DbInviteStatus,
  MarketListing,
  User,
} from "@prisma/client";
import { relationLabels } from "./labels";
import { parseDealStatus, parseSpecs } from "./listing-payload";
import { toPersianDigits } from "./persian";
import { maskPhone } from "./phone";
import type {
  CircleJoinRequest,
  Invite,
  InviteExpectedPerson,
  Listing,
  ListingType,
  Person,
  Privacy,
  TrustHop,
} from "./types";

export const inviteExpectedInclude = {
  expected: { orderBy: { createdAt: "asc" as const } },
};

export function toClientExpected(
  row: InviteExpected,
): InviteExpectedPerson {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name ?? undefined,
    joined: Boolean(row.joinedUserId),
    joinedUserId: row.joinedUserId ?? undefined,
  };
}

export function toClientInvite(
  row: DbInvite & { expected?: InviteExpected[] },
): Invite {
  return {
    id: row.id,
    code: row.code,
    inviterUserId: row.inviterUserId,
    invitedPhone: row.invitedPhone ?? undefined,
    invitedName: row.invitedName ?? undefined,
    relationType: row.relationType,
    trustGroup: row.trustGroup,
    kind: row.kind,
    maxUses: row.maxUses,
    useCount: row.useCount,
    status: row.status,
    acceptedByUserId: row.acceptedByUserId ?? undefined,
    expiresAt: row.expiresAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    personId: row.id,
    expected: row.expected?.map(toClientExpected),
  };
}

export function effectiveDbInviteStatus(
  row: Pick<DbInvite, "status" | "expiresAt" | "kind" | "useCount" | "maxUses">,
  now = Date.now(),
): DbInviteStatus {
  if (row.status === "pending" && row.expiresAt.getTime() <= now) {
    return "expired";
  }
  return row.status;
}

export function inviteIsFull(
  row: Pick<DbInvite, "kind" | "useCount" | "maxUses" | "status">,
): boolean {
  if (row.status === "accepted" && row.kind === "wave") return true;
  return row.useCount >= row.maxUses;
}

export function memberFromEdge(
  edge: CircleEdge & { to: User },
): Person {
  const touched =
    Math.abs(edge.updatedAt.getTime() - edge.createdAt.getTime()) > 1500;
  return {
    id: edge.to.id,
    name: edge.displayName?.trim() || edge.to.name || "عضو حلقه",
    avatar: edge.to.avatar || "/avatars/01.webp",
    relation: edge.relationType,
    level: edge.trustGroup,
    deals: 0,
    city: edge.to.city ?? undefined,
    inMyCircle: true,
    inviteStatus: "joined",
    trustTouched: touched,
    joinedAt: edge.createdAt.toISOString(),
    phoneNormalized: undefined,
  };
}

export function pendingPersonFromInvite(invite: Invite): Person {
  const phone = invite.invitedPhone;
  const name = invite.invitedName?.trim()
    ? invite.invitedName.trim()
    : invite.kind === "wave"
      ? `لینک ${relationLabels[invite.relationType]}`
      : phone
        ? `دعوت برای ${maskPhone(phone)}`
        : "لینک";
  return {
    id: invite.personId,
    name,
    avatar: "/avatars/01.webp",
    relation: invite.relationType,
    level: invite.trustGroup,
    deals: 0,
    inMyCircle: true,
    inviteStatus: "pending",
    phone,
    phoneNormalized: phone,
  };
}

export function relativePostedAt(date: Date, now = Date.now()): string {
  const diff = Math.max(0, now - date.getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "همین حالا";
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "دیروز";
  if (days < 7) return `${toPersianDigits(days)} روز پیش`;
  if (days < 30) return `${toPersianDigits(Math.floor(days / 7))} هفته پیش`;
  return `${toPersianDigits(Math.floor(days / 30))} ماه پیش`;
}

export function toHomeListing(
  row: Pick<
    MarketListing,
    | "id"
    | "title"
    | "description"
    | "type"
    | "price"
    | "category"
    | "image"
    | "sellerId"
    | "createdAt"
    | "privacy"
    | "city"
  >,
  viewerId?: string,
  trustPath: TrustHop[] = [],
): Listing {
  const description = row.description.trim();
  return {
    id: row.id,
    title: row.title,
    description:
      description.length > 180 ? `${description.slice(0, 180).trim()}…` : description,
    type: row.type as ListingType,
    price: row.price ?? undefined,
    category: row.category,
    image: row.image,
    sellerId: viewerId && row.sellerId === viewerId ? "me" : row.sellerId,
    postedAt: relativePostedAt(row.createdAt),
    privacy: (row.privacy as Privacy) || "ABC",
    endorsements: [],
    trustPath,
    city: row.city ?? undefined,
    feedPreview: true,
  };
}

export function toClientListing(
  row: MarketListing,
  viewerId?: string,
  trustPath: TrustHop[] = [],
): Listing {
  const images = row.images.length > 0 ? row.images : [row.image];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as ListingType,
    price: row.price ?? undefined,
    category: row.category,
    image: row.image,
    images,
    sellerId: viewerId && row.sellerId === viewerId ? "me" : row.sellerId,
    postedAt: relativePostedAt(row.createdAt),
    condition: row.condition ?? undefined,
    privacy: (row.privacy as Privacy) || "ABC",
    endorsements: [],
    trustPath,
    city: row.city ?? undefined,
    specs: parseSpecs(row.specs),
    dealStatus: parseDealStatus(row.dealStatus),
  };
}

export function toClientJoinRequest(
  row: DbJoinRequest & { guest: User },
): CircleJoinRequest {
  return {
    id: row.id,
    guest: {
      id: row.guest.id,
      name: row.guest.name || "عضو جدید",
      avatar: row.guest.avatar || "/avatars/01.webp",
      city: row.guest.city ?? undefined,
    },
    inviteId: row.inviteId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function personFromUser(
  user: Pick<User, "id" | "name" | "avatar" | "city">,
  opts: { relation: Invite["relationType"]; level: Invite["trustGroup"] },
): Person {
  return {
    id: user.id,
    name: user.name || "عضو حلقه",
    avatar: user.avatar || "/avatars/01.webp",
    relation: opts.relation,
    level: opts.level,
    deals: 0,
    city: user.city ?? undefined,
    inMyCircle: true,
    inviteStatus: "joined",
  };
}

export type { PublicInvite as PublicInvitePayload } from "./types";
