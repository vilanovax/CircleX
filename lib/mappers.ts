import type {
  CircleEdge,
  Invite as DbInvite,
  InviteStatus as DbInviteStatus,
  User,
} from "@prisma/client";
import { maskPhone } from "./phone";
import type { Invite, Person } from "./types";

export function toClientInvite(row: DbInvite): Invite {
  return {
    id: row.id,
    code: row.code,
    inviterUserId: row.inviterUserId,
    invitedPhone: row.invitedPhone ?? undefined,
    relationType: row.relationType,
    trustGroup: row.trustGroup,
    status: row.status,
    acceptedByUserId: row.acceptedByUserId ?? undefined,
    expiresAt: row.expiresAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    personId: row.id,
  };
}

export function effectiveDbInviteStatus(
  row: Pick<DbInvite, "status" | "expiresAt">,
  now = Date.now(),
): DbInviteStatus {
  if (row.status === "pending" && row.expiresAt.getTime() <= now) {
    return "expired";
  }
  return row.status;
}

export function memberFromEdge(
  edge: CircleEdge & { to: User },
): Person {
  return {
    id: edge.to.id,
    name: edge.to.name || "عضو حلقه",
    avatar: edge.to.avatar || "/avatars/01.webp",
    relation: edge.relationType,
    level: edge.trustGroup,
    deals: 0,
    city: edge.to.city ?? undefined,
    inMyCircle: true,
    inviteStatus: "joined",
    phoneNormalized: undefined,
  };
}

export function pendingPersonFromInvite(invite: Invite): Person {
  const phone = invite.invitedPhone;
  return {
    id: invite.personId,
    name: phone ? `دعوت برای ${maskPhone(phone)}` : "لینک دعوت",
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
