import {
  ADMIN_ROLES,
  actorRole,
  canSeeFullPhone,
  requireAdmin,
} from "@/lib/admin-auth";
import { listEnvelope, parseListParams } from "@/lib/admin-http";
import { listAdminUsers } from "@/lib/admin-users";
import { withDb } from "@/lib/http";

export const dynamic = "force-dynamic";

const READ_ROLES = ADMIN_ROLES.usersRead;

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: [...READ_ROLES] });
    if (!auth.ok) return auth.response;
    const fullPhone = canSeeFullPhone(actorRole(auth.actor));

    const url = new URL(req.url);
    const { take, skip } = parseListParams(url, 40);
    const q = (url.searchParams.get("q") ?? "").trim();
    const incomplete = url.searchParams.get("profile") === "incomplete";
    const banned = url.searchParams.get("banned") === "1";

    const data = await listAdminUsers({
      q,
      incomplete,
      banned,
      take,
      skip,
      fullPhone,
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
