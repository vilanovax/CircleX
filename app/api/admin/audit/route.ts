import { ADMIN_ROLES, requireAdmin } from "@/lib/admin-auth";
import { listEnvelope, parseListParams } from "@/lib/admin-http";
import {
  listAdminAudit,
  parseAuditGroup,
} from "@/lib/admin-audit-list";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...ADMIN_ROLES.auditRead] });
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const { take, skip } = parseListParams(url, 50);
    const group = parseAuditGroup(url.searchParams.get("group"));
    const actorId = (url.searchParams.get("actor") ?? "").trim();
    const aboutUser = (url.searchParams.get("aboutUser") ?? "").trim();
    const aboutListing = (url.searchParams.get("aboutListing") ?? "").trim();
    const targetType = (url.searchParams.get("targetType") ?? "").trim();
    const targetId = (url.searchParams.get("targetId") ?? "").trim();
    const q = (url.searchParams.get("q") ?? "").trim();

    const data = await listAdminAudit({
      group,
      take,
      skip,
      actorId: actorId || undefined,
      aboutUser: aboutUser || undefined,
      aboutListing: aboutListing || undefined,
      targetType: targetType || undefined,
      targetId: targetId || undefined,
      q: q || undefined,
    });

    return Response.json(
      listEnvelope(data.items, {
        total: data.total,
        take: data.take,
        skip: data.skip,
      }),
    );
  });
}
