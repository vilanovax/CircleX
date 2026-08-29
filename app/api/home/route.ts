import { jsonError, withDb } from "@/lib/http";
import { loadHomePayload } from "@/lib/home-payload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");
    const payload = await loadHomePayload(session);
    return Response.json(payload);
  });
}
