import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { INVITE_TTL_MS, newInviteCode } from "@/lib/invite";
import { toClientInvite } from "@/lib/mappers";
import { isValidIranMobile, normalizePhone } from "@/lib/phone";
import { getSessionUser } from "@/lib/server-auth";
import type { RelationType, TrustGroup } from "@prisma/client";

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
  }>(req);

  const relationType = body?.relationType as RelationType | undefined;
  const trustGroup = body?.trustGroup as TrustGroup | undefined;
  if (!relationType || !RELATIONS.includes(relationType)) {
    return jsonError("نسبت را انتخاب کن", 400);
  }
  if (!trustGroup || !GROUPS.includes(trustGroup)) {
    return jsonError("گروه اعتماد را انتخاب کن", 400);
  }

  let invitedPhone: string | undefined;
  if (body?.invitedPhone) {
    const phone = normalizePhone(body.invitedPhone);
    if (!isValidIranMobile(phone)) {
      return jsonError("شماره را با ۰۹ شروع کنید — ۱۱ رقم", 400);
    }
    invitedPhone = phone;
  }

  let invite = null;
  for (let i = 0; i < 8; i++) {
    const code = newInviteCode();
    try {
      invite = await prisma.invite.create({
        data: {
          code,
          inviterUserId: session.id,
          invitedPhone,
          relationType,
          trustGroup,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        },
      });
      break;
    } catch (err) {
      const codeName =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (codeName !== "P2002") throw err;
    }
  }
  if (!invite) return jsonError("ساخت لینک ممکن نشد", 500);

  return Response.json({ invite: toClientInvite(invite) }, { status: 201 });
}
