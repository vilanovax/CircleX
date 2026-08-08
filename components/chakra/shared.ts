import type {
  EventKind,
  ListingType,
  Privacy,
  TrustLevel,
} from "@/lib/types";

/** Chakra colorScheme per trust level (A = closest/green … C = amber). */
export const levelScheme: Record<TrustLevel, string> = {
  A: "green",
  B: "blue",
  C: "orange",
};

export const listingTypeScheme: Record<ListingType, string> = {
  sale: "brand",
  donation: "pink",
  exchange: "teal",
  loan: "purple",
  service: "orange",
};

export const eventKindScheme: Record<EventKind, string> = {
  class: "teal",
  family: "red",
  charity: "pink",
  kids: "cyan",
  trip: "green",
  social: "purple",
};

export const privacyScheme: Record<Privacy, string> = {
  A: "green",
  AB: "blue",
  ABC: "purple",
  referral: "purple",
  approved: "orange",
};

/** Phone-column width matching the Tailwind `.app-shell` (max 480px). */
export const SHELL_MAX = "480px";
