import { jsonError, withDb } from "@/lib/http";
import { readListingJpeg } from "@/lib/listing-upload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

/** Member session required; cookie is sent on same-origin media requests. */
export async function GET(
  _req: Request,
  { params }: { params: { name: string } },
) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const file = await readListingJpeg(params.name);
    if (!file) return jsonError("عکس پیدا نشد", 404);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  });
}
