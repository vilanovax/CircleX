import { jsonError } from "@/lib/http";
import { seedCircleForUser } from "@/lib/server-circle-seed";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSessionUser();
  if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

  await seedCircleForUser(session.id, session.phoneNormalized);
  return Response.json({ ok: true });
}
