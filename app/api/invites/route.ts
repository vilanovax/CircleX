import { assertFlag } from "@/lib/app-settings";
import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { WAVE_ROSTER_LIMIT } from "@/lib/invite";
import { inviteExpectedInclude, toClientInvite } from "@/lib/mappers";
import { isValidIranMobile, normalizePhone } from "@/lib/phone";
import { createInviteRecord } from "@/lib/server-invite";
import { getSessionUser } from "@/lib/server-auth";
import { seedFamilyCircle } from "@/lib/server-family-seed";
import type { InviteKind, RelationType, TrustGroup } from "@prisma/client";

export const dynamic = "force-dynamic";

const RELATIONS: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];
const GROUPS: TrustGroup[] = ["A", "B", "C"];

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const rows = await prisma.invite.findMany({
    where: { inviterUserId: session.id },
    orderBy: { createdAt: "desc" },
    include: inviteExpectedInclude,
  });

  const now = Date.now();
  const expiredIds = rows
    .filter((r) => r.status === "pending" && r.expiresAt.getTime() <= now)
    .map((r) => r.id);
  if (expiredIds.length > 0) {
    await prisma.invite.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: "expired" },
    });
  }

  const invites = rows.map((r) =>
    toClientInvite(
      expiredIds.includes(r.id) ? { ...r, status: "expired" } : r,
    ),
  );
  return Response.json({ invites });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const body = await readJson<{
    relationType?: string;
    trustGroup?: string;
    invitedPhone?: string;
    invitedName?: string;
    kind?: string;
    people?: { name?: string; phone?: string }[];
  }>(req);

  const relationType = body?.relationType as RelationType | undefined;
  if (!relationType || !RELATIONS.includes(relationType)) {
    return jsonError("نسبت را انتخاب کن", 400);
  }

  const kind: InviteKind = body?.kind === "wave" ? "wave" : "personal";
  if (kind === "wave") {
    const blocked = await assertFlag("waveInvites");
    if (blocked !== true) return blocked;
  }
  let trustGroup = body?.trustGroup as TrustGroup | undefined;
  if (kind === "personal") {
    if (!trustGroup || !GROUPS.includes(trustGroup)) {
      return jsonError("گروه اعتماد را انتخاب کن", 400);
    }
  } else {
    trustGroup = "B";
  }

  let invitedPhone: string | undefined;
  let invitedName: string | undefined;
  if (kind === "personal" && body?.invitedPhone) {
    const phone = normalizePhone(body.invitedPhone);
    if (!isValidIranMobile(phone)) {
      return jsonError("شماره را با ۰۹ شروع کن — ۱۱ رقم", 400);
    }
    invitedPhone = phone;
  }
  if (kind === "personal" && body?.invitedName?.trim()) {
    invitedName = body.invitedName.trim().slice(0, 40);
  }

  let people: { phone: string; name?: string }[] | undefined;
  if (kind === "wave" && Array.isArray(body?.people) && body.people.length > 0) {
    if (body.people.length > WAVE_ROSTER_LIMIT) {
      return jsonError(`حداکثر ${WAVE_ROSTER_LIMIT} نفر در هر لینک`, 400);
    }
    const seen = new Set<string>();
    people = [];
    for (const row of body.people) {
      const phone = row?.phone ? normalizePhone(row.phone) : "";
      if (!isValidIranMobile(phone)) {
        return jsonError("یکی از شماره‌ها معتبر نیست", 400);
      }
      if (seen.has(phone)) continue;
      seen.add(phone);
      people.push({
        phone,
        name: row.name?.trim().slice(0, 40) || undefined,
      });
    }
  }

  const invite = await createInviteRecord({
    inviterUserId: session.id,
    relationType,
    trustGroup: trustGroup!,
    kind,
    invitedPhone,
    invitedName,
    people,
  });
  if (!invite) return jsonError("ساخت لینک ممکن نشد", 500);

  if (relationType === "family") {
    await seedFamilyCircle(session.id, session.phoneNormalized);
  }

  return Response.json({ invite: toClientInvite(invite) }, { status: 201 });
}
