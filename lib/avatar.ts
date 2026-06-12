/** Stable avatar background from a display name. */
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

export function personInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "؟";
  return trimmed[0];
}

export function personAvatarColor(name: string): string {
  return PALETTE[personAvatarIndex(name)].className;
}

export function personAvatarHex(name: string): string {
  return PALETTE[personAvatarIndex(name)].hex;
}

function personAvatarIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % PALETTE.length;
  }
  return hash;
}
