import { writeAdminAudit } from "@/lib/admin-audit";
import { requireAdmin, sessionAdminId } from "@/lib/admin-auth";
import { backupSummary, buildFullBackup } from "@/lib/admin-backup";
import { jsonError, withDb } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  return withDb(async () => {
    const auth = await requireAdmin(req, { roles: ["superadmin"] });
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const download = url.searchParams.get("download") === "1";

    if (!download) {
      return Response.json(await backupSummary());
    }

    const dump = await buildFullBackup();
    const adminId = sessionAdminId(auth.actor);
    if (adminId) {
      await writeAdminAudit({
        adminUserId: adminId,
        action: "backup.download",
        targetType: "backup",
        targetId: dump.filename,
        meta: { bytes: dump.byteLength },
      });
    }

    return new Response(dump.body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${dump.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
