import { withBasePath } from "./avatar";
import { normalizePhone } from "./phone";
import type { Invite, PublicInvite } from "./types";

export const PHONE_PRIVACY_LINE =
  "شماره‌ات به افراد دیگر نمایش داده نمی‌شود.";
export const GROUP_PRIVATE_LINE =
  "گروهی که انتخاب می‌کنی فقط برای خودت قابل مشاهده است.";

export const PENDING_INVITE_KEY = "circle-pending-invite";
export const PENDING_INVITER_NAME_KEY = "circle-pending-invite-name";
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const WAVE_MAX_USES = 10;
export const WAVE_DEFAULT_TRUST = "B" as const;

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function newUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function newInviteCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return s;
}

export function invitePath(code: string): string {
  return `/invite/${code}`;
}

export function inviteUrl(code: string): string {
  const path = withBasePath(invitePath(code));
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function inviteShareText(inviterName: string, url: string): string {
  return `${inviterName} دعوتت کرده به حلقه‌اش در سیرکل بپیوندی.\n${url}`;
}

export function peekPendingInviteCode(): string | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(PENDING_INVITE_KEY)?.trim();
  return v || null;
}

export function stashPendingInviteCode(code: string, inviterName?: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_INVITE_KEY, code);
  if (inviterName?.trim()) {
    sessionStorage.setItem(PENDING_INVITER_NAME_KEY, inviterName.trim());
  }
}

export function peekPendingInviteName(): string | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(PENDING_INVITER_NAME_KEY)?.trim();
  return v || null;
}

export function clearPendingInviteCode() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_INVITE_KEY);
  sessionStorage.removeItem(PENDING_INVITER_NAME_KEY);
}

export type InviteViewKind =
  | "invalid"
  | "expired"
  | "revoked"
  | "accepted"
  | "already"
  | "own"
  | "pending"
  | "full";

export function whatsappShareHref(text: string, phone?: string): string {
  const n = phone ? normalizePhone(phone) : "";
  const intl = n.length === 11 ? `98${n.slice(1)}` : "";
  const q = `text=${encodeURIComponent(text)}`;
  return intl ? `https://wa.me/${intl}?${q}` : `https://wa.me/?${q}`;
}

export function smsShareHref(text: string, phone?: string): string {
  const n = phone ? normalizePhone(phone) : "";
  const body = encodeURIComponent(text);
  return n ? `sms:${n}?body=${body}` : `sms:?body=${body}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function nativeShare(opts: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  try {
    await navigator.share(opts);
    return true;
  } catch {
    return false;
  }
}

export function effectiveInviteStatus(
  invite: Invite,
  now = Date.now(),
): Invite["status"] {
  if (invite.status === "pending" && new Date(invite.expiresAt).getTime() <= now) {
    return "expired";
  }
  return invite.status;
}

export function resolveInviteView(
  invite: Invite | undefined,
  opts: {
    loggedIn: boolean;
    isInviter: boolean;
    resumeAccept?: boolean;
    alreadyInCircle?: boolean;
    now?: number;
  },
): InviteViewKind {
  if (!invite) return "invalid";
  const status = effectiveInviteStatus(invite, opts.now);
  if (status === "expired") return "expired";
  if (status === "revoked") return "revoked";
  if (status === "accepted") return "accepted";
  if (opts.alreadyInCircle) return "already";
  if (opts.loggedIn && opts.isInviter && !opts.resumeAccept) return "own";
  return "pending";
}

export function resolvePublicInviteView(
  invite: PublicInvite | null,
  opts: {
    loggedIn: boolean;
    resumeAccept?: boolean;
  },
): InviteViewKind {
  if (!invite) return "invalid";
  if (invite.status === "expired") return "expired";
  if (invite.status === "revoked") return "revoked";
  if (invite.alreadyMember) return "already";
  if (invite.full || (invite.kind === "wave" && invite.status === "accepted")) {
    return "full";
  }
  if (invite.status === "accepted") return "accepted";
  if (opts.loggedIn && invite.isOwn && !opts.resumeAccept) return "own";
  return "pending";
}