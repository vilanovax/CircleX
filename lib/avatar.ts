/** Stable avatar palette + funny illustration pool for Circle people. */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const PALETTE = [
  { className: "bg-brand-600 text-white", hex: "#7c3aed" },
  { className: "bg-emerald-600 text-white", hex: "#059669" },
  { className: "bg-sky-600 text-white", hex: "#0284c7" },
  { className: "bg-violet-600 text-white", hex: "#7c3aed" },
  { className: "bg-amber-600 text-white", hex: "#d97706" },
  { className: "bg-rose-600 text-white", hex: "#e11d48" },
  { className: "bg-teal-600 text-white", hex: "#0d9488" },
  { className: "bg-indigo-600 text-white", hex: "#4f46e5" },
] as const;

/** Root-relative paths in /public/avatars (before basePath). */
export const AVATAR_IMAGES = Array.from(
  { length: 27 },
  (_, i) => `/avatars/${String(i + 1).padStart(2, "0")}.webp`,
);

/** Ten distinct pool faces for the identity sheet picker. */
export const PICKER_AVATARS = [
  "/avatars/01.webp",
  "/avatars/02.webp",
  "/avatars/04.webp",
  "/avatars/05.webp",
  "/avatars/07.webp",
  "/avatars/08.webp",
  "/avatars/11.webp",
  "/avatars/14.webp",
  "/avatars/18.webp",
  "/avatars/22.webp",
] as const;

export function pickPickerAvatar(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
  return PICKER_AVATARS[hash % PICKER_AVATARS.length];
}

/** Prefix a public `/…` path with Next `basePath` (e.g. `/circle`). */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  if (!BASE) return path;
  if (path === BASE || path.startsWith(`${BASE}/`)) return path;
  return `${BASE}${path}`;
}

/** Drop Next `basePath` so stored paths stay `/api/uploads/…`, `/listings/…`. */
export function withoutBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  if (!BASE) return path;
  if (path === BASE) return "/";
  if (path.startsWith(`${BASE}/`)) return path.slice(BASE.length) || "/";
  return path;
}

export function personInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "؟";
  return trimmed[0];
}

export function personAvatarColor(name: string): string {
  return PALETTE[hashName(name) % PALETTE.length].className;
}

const SOFT_PALETTE = [
  "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
] as const;

/** Softer initials for profile heroes (less attention than the name). */
export function personAvatarSoftColor(name: string): string {
  return SOFT_PALETTE[hashName(name) % SOFT_PALETTE.length];
}

export function personAvatarHex(name: string): string {
  return PALETTE[hashName(name) % PALETTE.length].hex;
}

/** True when `avatar` is an image path/URL (not a legacy emoji). */
export function isAvatarImage(avatar?: string | null): boolean {
  if (!avatar) return false;
  return (
    avatar.startsWith("/") ||
    avatar.startsWith("http://") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("data:")
  );
}

/**
 * Resolve the image to show for a person.
 * Prefers an explicit avatar URL; otherwise picks a stable image from the pool.
 * Root-relative `/avatars/…` paths get `basePath` so they work under `/circle`.
 */
export function resolveAvatarSrc(
  name: string,
  avatar?: string | null,
): string {
  if (isAvatarImage(avatar)) {
    if (
      avatar!.startsWith("http://") ||
      avatar!.startsWith("https://") ||
      avatar!.startsWith("data:")
    ) {
      return avatar!;
    }
    return withBasePath(avatar!);
  }
  return withBasePath(AVATAR_IMAGES[hashName(name) % AVATAR_IMAGES.length]);
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % 9973;
  }
  return hash;
}
