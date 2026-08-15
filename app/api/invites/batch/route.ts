import { jsonError, readJson } from "@/lib/http";
import { WAVE_ROSTER_LIMIT } from "@/lib/invite";
import { toClientInvite } from "@/lib/mappers";
import { isValidIranMobile, normalizePhone } from "@/lib/phone";
import { createInviteRecord } from "@/lib/server-invite";
import { getSessionUser } from "@/lib/server-auth";
import type { RelationType } from "@prisma/client";

export const dynamic = "force-dynamic";

const RELATIONS: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  const body = await readJson<{
    relationType?: string;
    people?: { name?: string; phone?: string }[];
  }>(req);

  const relationType = body?.relationType as RelationType | undefined;
  if (!relationType || !RELATIONS.includes(relationType)) {
    return jsonError("نسبت را انتخاب کن", 400);
  }

  const raw = Array.isArray(body?.people) ? body.people : [];
  if (raw.length === 0) return jsonError("حداقل یک شماره وارد کن", 400);
  if (raw.length > WAVE_ROSTER_LIMIT) {
    return jsonError(`حداکثر ${WAVE_ROSTER_LIMIT} نفر در هر لینک`, 400);
  }

  const seen = new Set<string>();
  const people: { name?: string; phone: string }[] = [];
  for (const row of raw) {
    const phone = row?.phone ? normalizePhone(row.phone) : "";
    if (!isValidIranMobile(phone)) {
      return jsonError("یکی از شماره‌ها معتبر نیست", 400);
    }
    if (seen.has(phone)) continue;
    seen.add(phone);
    const name = row.name?.trim().slice(0, 40) || undefined;
    people.push({ phone, name });
  }

  const invite = await createInviteRecord({
    inviterUserId: session.id,
    relationType,
    trustGroup: "B",
    kind: "wave",
    people,
  });
  if (!invite) return jsonError("ساخت لینک ممکن نشد", 500);

  return Response.json({ invite: toClientInvite(invite) }, { status: 201 });
}
