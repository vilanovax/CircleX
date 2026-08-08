import type { ListingType, TrustLevel } from "@/lib/types";

type HeroColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

/** HeroUI semantic color per trust level (A = closest/green … C = amber). */
export const levelColor: Record<TrustLevel, HeroColor> = {
  A: "success",
  B: "primary",
  C: "warning",
};

/** Hex per trust level for the avatar badge dot. */
export const levelHex: Record<TrustLevel, string> = {
  A: "#16a34a",
  B: "#2563eb",
  C: "#d97706",
};

export const listingTypeColor: Record<ListingType, HeroColor> = {
  sale: "primary",
  donation: "secondary",
  exchange: "success",
  loan: "default",
  service: "warning",
};

/** Phone-column width matching the Tailwind `.app-shell` (max 480px). */
export const SHELL_MAX = 480;
