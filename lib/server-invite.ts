import { prisma } from "@/lib/db";
import {
  INVITE_TTL_MS,
  WAVE_DEFAULT_TRUST,
  WAVE_MAX_USES,
  newInviteCode,
} from "@/lib/invite";
import type { InviteKind, RelationType, TrustGroup } from "@prisma/client";

export async function createInviteRecord(input: {
  inviterUserId: string;
  relationType: RelationType;
  trustGroup: TrustGroup;
  kind: InviteKind;
  invitedPhone?: string;
  invitedName?: string;
}) {
  const kind = input.kind;
  const maxUses = kind === "wave" ? WAVE_MAX_USES : 1;
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
        },
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
