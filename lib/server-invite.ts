import { prisma } from "@/lib/db";
import {
  INVITE_TTL_MS,
  WAVE_DEFAULT_TRUST,
  WAVE_ROSTER_LIMIT,
  newInviteCode,
  waveMaxUses,
} from "@/lib/invite";
import { inviteExpectedInclude } from "@/lib/mappers";
import { normalizePhone } from "@/lib/phone";
import type { InviteKind, RelationType, TrustGroup } from "@prisma/client";

export type InviteRosterPerson = { phone: string; name?: string };

/** True only when this OTP phone was named on the invite roster. */
export function isExpectedInvitee(
  invite: {
    kind: InviteKind;
    invitedPhone: string | null;
    expected?: { phone: string }[];
  },
  phone: string,
): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  if (invite.kind === "personal") {
    return Boolean(invite.invitedPhone && invite.invitedPhone === normalized);
  }
  return (invite.expected ?? []).some((row) => row.phone === normalized);
}

export async function createInviteRecord(input: {
  inviterUserId: string;
  relationType: RelationType;
  trustGroup: TrustGroup;
  kind: InviteKind;
  invitedPhone?: string;
  invitedName?: string;
  people?: InviteRosterPerson[];
}) {
  const kind = input.kind;
  const roster =
    kind === "wave"
      ? dedupeRoster(input.people ?? []).slice(0, WAVE_ROSTER_LIMIT)
      : [];
  const maxUses = kind === "wave" ? waveMaxUses(roster.length) : 1;
  const trustGroup = kind === "wave" ? WAVE_DEFAULT_TRUST : input.trustGroup;

  for (let i = 0; i < 8; i++) {
    const code = newInviteCode();
    try {
      return await prisma.invite.create({
        data: {
          code,
          inviterUserId: input.inviterUserId,
          invitedPhone: kind === "wave" ? null : input.invitedPhone,
          invitedName: kind === "wave" ? null : input.invitedName,
          relationType: input.relationType,
          trustGroup,
          kind,
          maxUses,
          useCount: 0,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
          expected:
            roster.length > 0
              ? {
                  create: roster.map((person) => ({
                    phone: person.phone,
                    name: person.name,
                  })),
                }
              : undefined,
        },
        include: inviteExpectedInclude,
      });
    } catch (err) {
      const codeName =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (codeName !== "P2002") throw err;
    }
  }
  return null;
}

function dedupeRoster(people: InviteRosterPerson[]): InviteRosterPerson[] {
  const seen = new Set<string>();
  const out: InviteRosterPerson[] = [];
  for (const person of people) {
    if (!person.phone || seen.has(person.phone)) continue;
    seen.add(person.phone);
    out.push({
      phone: person.phone,
      name: person.name?.trim().slice(0, 40) || undefined,
    });
  }
  return out;
}
