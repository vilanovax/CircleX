import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NAMES = new Set([
  "CLS",
  "FCP",
  "FID",
  "INP",
  "LCP",
  "TTFB",
]);

/** Lightweight RUM sink for Core Web Vitals (Liara/stdout). */
export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (!body || typeof body !== "object") {
    return new NextResponse(null, { status: 204 });
  }
  const row = body as {
    name?: unknown;
    value?: unknown;
    rating?: unknown;
    path?: unknown;
    connection?: unknown;
  };
  if (typeof row.name !== "string" || typeof row.value !== "number") {
    return new NextResponse(null, { status: 204 });
  }
  const allowed =
    NAMES.has(row.name) || row.name.startsWith("Next.js-");
  if (!allowed) return new NextResponse(null, { status: 204 });
  console.info(
    `[cwv] ${row.name}=${row.value} rating=${typeof row.rating === "string" ? row.rating : ""} path=${typeof row.path === "string" ? row.path : ""} conn=${typeof row.connection === "string" ? row.connection : ""}`,
  );
  return new NextResponse(null, { status: 204 });
}
