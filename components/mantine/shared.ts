import type {
  EventKind,
  ListingType,
  Privacy,
  TrustLevel,
} from "@/lib/types";

/** Mantine color names per trust level (A = closest/green … C = amber). */
export const levelColor: Record<TrustLevel, string> = {
  A: "green",
  B: "blue",
  C: "orange",
};

export const listingTypeColor: Record<ListingType, string> = {
  sale: "brand",
  donation: "pink",
  exchange: "teal",
  loan: "indigo",
  service: "orange",
};

export const eventKindColor: Record<EventKind, string> = {
  class: "teal",
  family: "red",
  charity: "pink",
  kids: "cyan",
  trip: "green",
  social: "violet",
};

export const privacyColor: Record<Privacy, string> = {
  A: "green",
  AB: "blue",
  ABC: "grape",
  referral: "indigo",
  approved: "orange",
};

/** Phone-column width matching the Tailwind `.app-shell` (max 480px). */
export const SHELL_MAX = 480;
