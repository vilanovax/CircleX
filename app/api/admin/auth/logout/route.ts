import { destroyAdminSession } from "@/lib/admin-auth";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  return withDb(async () => {
    await destroyAdminSession();
    return Response.json({ ok: true });
  });
}
