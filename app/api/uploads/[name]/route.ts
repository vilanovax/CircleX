import { jsonError } from "@/lib/http";
import { readListingJpeg } from "@/lib/listing-upload";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { name: string } },
) {
  const file = await readListingJpeg(params.name);
  if (!file) return jsonError("عکس پیدا نشد", 404);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
