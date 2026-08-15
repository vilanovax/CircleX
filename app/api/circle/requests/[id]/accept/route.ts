import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { memberFromEdge, toClientJoinRequest } from "@/lib/mappers";
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

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const row = await prisma.circleJoinRequest.findUnique({
    where: { id: params.id },
    include: { guest: true },
  });
  if (!row || row.hostUserId !== session.id) {
    return jsonError("این درخواست پیدا نشد", 404);
  }
  if (row.status !== "pending") {
    return jsonError("این درخواست قبلاً بررسی شده", 409, "resolved");
  }

  const body = await readJson<{
    relationType?: string;
    trustGroup?: string;
    displayName?: string;
  }>(req);

  const relationType = body?.relationType as RelationType | undefined;
  const trustGroup = body?.trustGroup as TrustGroup | undefined;
  if (!relationType || !RELATIONS.includes(relationType)) {
    return jsonError("نسبت را انتخاب کن", 400);
  }
  if (!trustGroup || !GROUPS.includes(trustGroup)) {
    return jsonError("گروه اعتماد را انتخاب کن", 400);
  }

  const displayName = body?.displayName?.replace(/\s+/g, " ").trim().slice(0, 40);

  const existing = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: session.id,
        toUserId: row.guestUserId,
      },
    },
  });
  if (existing) {
    await prisma.circleJoinRequest.update({
      where: { id: row.id },
      data: { status: "accepted", resolvedAt: new Date() },
    });
    return jsonError("این فرد از قبل در حلقه است", 409, "already");
  }

  const [edge] = await prisma.$transaction([
    prisma.circleEdge.create({
      data: {
        fromUserId: session.id,
        toUserId: row.guestUserId,
        relationType,
        trustGroup,
        displayName: displayName || null,
      },
      include: { to: true },
    }),
    prisma.circleJoinRequest.update({
      where: { id: row.id },
      data: { status: "accepted", resolvedAt: new Date() },
    }),
  ]);

  return Response.json({
    member: memberFromEdge(edge),
    request: toClientJoinRequest(row),
  });
}
