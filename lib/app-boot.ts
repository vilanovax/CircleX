import { cache } from "react";
import { isDbUnreachable } from "@/lib/db";
import { loadHomePayload } from "@/lib/home-payload";
import type { AppBoot } from "@/lib/home-types";
import { getSessionUser } from "@/lib/server-auth";

function skipHomeFetch(pathname: string): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  if (pathname.startsWith("/invite/")) return true;
  return false;
}

async function loadAppBootUncached(pathname: string): Promise<AppBoot> {
  try {
    const user = await getSessionUser();
    if (!user) return { user: null, home: null };
    if (skipHomeFetch(pathname)) return { user, home: null };
    const home = await loadHomePayload(user);
    return { user, home };
  } catch (err) {
    if (isDbUnreachable(err)) return { user: null, home: null };
    throw err;
  }
}

/** Per-request: layout and nested RSC share one session + home load. */
export const loadAppBoot = cache(loadAppBootUncached);
