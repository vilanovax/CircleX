import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { memberFromEdge } from "@/lib/mappers";
import { getSessionUser } from "@/lib/server-auth";
import { ensureFamilyReciprocal } from "@/lib/server-family-reciprocal";
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

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const body = await readJson<{
    toUserId?: string;
    trustGroup?: string;
    relationType?: string;
  }>(req);

  const toUserId = body?.toUserId?.trim() ?? "";
  if (!toUserId) return jsonError("فرد مشخص نیست", 400);
  if (toUserId === session.id) {
    return jsonError("نمی‌شود خودت را به حلقه اضافه کرد", 400);
  }

  const other = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!other) return jsonError("این فرد پیدا نشد", 404);

  const trustGroup = body?.trustGroup as TrustGroup | undefined;
  if (!trustGroup || !GROUPS.includes(trustGroup)) {
    return jsonError("گروه اعتماد را انتخاب کن", 400);
  }

  const existing = await prisma.circleEdge.findUnique({
    where: {
      fromUserId_toUserId: { fromUserId: session.id, toUserId },
    },
  });

  const relationType = (body?.relationType as RelationType | undefined) ??
    existing?.relationType ??
    "friend";
  if (!RELATIONS.includes(relationType)) {
    return jsonError("نسبت را انتخاب کن", 400);
  }

  const edge = await prisma.circleEdge.upsert({
    where: {
      fromUserId_toUserId: { fromUserId: session.id, toUserId },
    },
    create: {
      fromUserId: session.id,
      toUserId,
      trustGroup,
      relationType,
    },
    update: {
      trustGroup,
      relationType: body?.relationType ? relationType : undefined,
    },
    include: { to: true },
  });

  if (edge.relationType === "family") {
    await ensureFamilyReciprocal(
      prisma,
      session.id,
      toUserId,
      edge.trustGroup,
    );
  }

  return Response.json({ member: memberFromEdge(edge) });
}
