import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { toClientInvite } from "@/lib/mappers";
import { isValidIranMobile, normalizePhone } from "@/lib/phone";
import { createInviteRecord } from "@/lib/server-invite";
import { getSessionUser } from "@/lib/server-auth";
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
  }>(req);

  const relationType = body?.relationType as RelationType | undefined;
  if (!relationType || !RELATIONS.includes(relationType)) {
    return jsonError("نسبت را انتخاب کن", 400);
  }

  const kind: InviteKind = body?.kind === "wave" ? "wave" : "personal";
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
      return jsonError("شماره را با ۰۹ شروع کنید — ۱۱ رقم", 400);
    }
    invitedPhone = phone;
  }
  if (kind === "personal" && body?.invitedName?.trim()) {
    invitedName = body.invitedName.trim().slice(0, 40);
  }

  const invite = await createInviteRecord({
    inviterUserId: session.id,
    relationType,
    trustGroup: trustGroup!,
    kind,
    invitedPhone,
    invitedName,
  });
  if (!invite) return jsonError("ساخت لینک ممکن نشد", 500);

  return Response.json({ invite: toClientInvite(invite) }, { status: 201 });
}
