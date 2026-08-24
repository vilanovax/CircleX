import { actorRole, requireAdmin } from "@/lib/admin-auth";
import { loadAdminDashboard } from "@/lib/admin-metrics";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
    const data = await loadAdminDashboard(actorRole(auth.actor));
    return Response.json(data);
  });
}
