import { headers } from "next/headers";

/**
 * `next start` sets NODE_ENV=production. Secure cookies then never stick on
 * http://localhost:3006, so admin login (and user OTP) look broken next to `next dev`.
 * Liara / HTTPS still get Secure via x-forwarded-proto.
 */
export function sessionCookieSecure(): boolean {
  const forced = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (forced === "0" || forced === "false") return false;
  if (forced === "1" || forced === "true") return true;

  try {
    const h = headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();
    const proto = (h.get("x-forwarded-proto") ?? "")
      .split(",")[0]
      .trim()
      .toLowerCase();
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
      return false;
    }
    if (proto === "http") return false;
    if (proto === "https") return true;
  } catch {
    /* cookies() outside a request */
  }

  return process.env.NODE_ENV === "production";
}
