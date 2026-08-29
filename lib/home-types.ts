import type {
  CircleEvent,
  CircleJoinRequest,
  Invite,
  Listing,
  Offer,
  Person,
  Request,
  SessionUser,
} from "@/lib/types";

/** Shared `/api/home` + SSR boot payload. */
export type HomeBootPayload = {
  members: Person[];
  network: Person[];
  pending: Invite[];
  listings: Listing[];
  requests: Request[];
  offers: Offer[];
  events: CircleEvent[];
  joinRequests: CircleJoinRequest[];
  saved: string[];
  hiddenListings: string[];
  hiddenPeople: string[];
  listingNotes: Record<string, string>;
  showOwnListingsInFeed: boolean;
  addedYou: Person[];
};

export type AppBoot = {
  user: SessionUser | null;
  home: HomeBootPayload | null;
};
