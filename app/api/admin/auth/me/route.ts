import { getAdminSession } from "@/lib/admin-auth";
import { jsonError, withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDb(async () => {
    const admin = await getAdminSession();
    if (!admin) return jsonError("وارد نشده‌ای", 401, "unauthorized");
    return Response.json({ admin });
  });
}
