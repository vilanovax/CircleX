import { jsonError, withDb } from "@/lib/http";
import { publicObjectUrl } from "@/lib/object-storage";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

/**
 * Legacy path for old `/api/uploads/….jpg` links.
 * New uploads are public HTTPS on object storage; this redirects by key when possible.
 */
export async function GET(
  _req: Request,
  { params }: { params: { name: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const name = params.name?.trim() || "";
    if (!/^[a-zA-Z0-9._-]+\.jpe?g$/i.test(name)) {
      return jsonError("عکس پیدا نشد", 404);
    }

    try {
      const target = publicObjectUrl(`uploads/${name}`);
      return Response.redirect(target, 302);
    } catch {
      return jsonError("عکس پیدا نشد", 404);
    }
  });
}
