import { jsonError, withDb } from "@/lib/http";
import { PHOTO_UPLOAD_MAX_BYTES } from "@/lib/media";
import { saveListingJpeg } from "@/lib/listing-upload";
import { getSessionUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const form = await req.formData().catch(() => null);
    const file = form?.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      return jsonError("عکس را انتخاب کن", 400);
    }
    if (file.size > PHOTO_UPLOAD_MAX_BYTES) {
      return jsonError("عکس خیلی بزرگ است", 400);
    }

    const buf = Buffer.from(await file.arrayBuffer());
    try {
      const saved = await saveListingJpeg(buf, session.id);
      return Response.json({ url: saved.url });
    } catch (err) {
      const message = err instanceof Error ? err.message : "ذخیرهٔ عکس نشد";
      return jsonError(message, 400);
    }
  });
}
