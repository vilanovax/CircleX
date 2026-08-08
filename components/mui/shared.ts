import type { ListingType, TrustLevel } from "@/lib/types";

/** Hex color per trust level (A = closest/green … C = amber). */
export const levelHex: Record<TrustLevel, string> = {
  A: "#16a34a",
  B: "#2563eb",
  C: "#d97706",
};

/** MUI Chip color per listing type (falls back to a custom sx where needed). */
export const listingTypeChipColor: Record<
  ListingType,
  "primary" | "secondary" | "success" | "warning" | "info" | "default"
> = {
  sale: "primary",
  donation: "secondary",
  exchange: "info",
  loan: "default",
  service: "warning",
};

/** Phone-column width matching the Tailwind `.app-shell` (max 480px). */
export const SHELL_MAX = 480;
