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

/** Prefix a public `/…` path with Next `basePath` (e.g. `/circle`). */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  if (!BASE) return path;
  if (path === BASE || path.startsWith(`${BASE}/`)) return path;
  return `${BASE}${path}`;
}

export function personInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "؟";
  return trimmed[0];
}

export function personAvatarColor(name: string): string {
  return PALETTE[hashName(name) % PALETTE.length].className;
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
