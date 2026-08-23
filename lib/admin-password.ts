import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;
const PREFIX = "scrypt";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${PREFIX}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== PREFIX) return false;
  const [, salt, hash] = parts;
  if (!salt || !hash) return false;
  try {
    const actual = scryptSync(password, salt, KEYLEN);
    const expected = Buffer.from(hash, "hex");
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function normalizeAdminEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidAdminEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}
