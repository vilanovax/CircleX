import { requireAdmin } from "@/lib/admin-auth";
import { loadAdminAnalytics } from "@/lib/admin-metrics";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

function parseDays(raw: string | null): 7 | 14 | 30 {
  if (raw === "7") return 7;
  if (raw === "30") return 30;
  return 14;
}

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
    const url = new URL(req.url);
    const data = await loadAdminAnalytics(parseDays(url.searchParams.get("days")));
    return Response.json(data);
  });
}
