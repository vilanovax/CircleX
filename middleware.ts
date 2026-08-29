import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Lets the root layout skip heavy home fetch on admin / invite routes. */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-circle-pathname", req.nextUrl.pathname);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|ico|jpg|jpeg|png|webp|woff2)$).*)",
  ],
};
