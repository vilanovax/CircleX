// ---- Core domain types for Circle ----

/** Trust level of a person in your circle. A = closest/most trusted. */
export type TrustLevel = "A" | "B" | "C";

/** Kind of relationship you have with a person. */
export type RelationType =
  | "family"
  | "friend"
  | "colleague"
  | "neighbor"
  | "acquaintance";

/** What a listing offers. */
export type ListingType =
  | "sale"
  | "donation"
  | "exchange"
  | "loan"
  | "service";

/** Who is allowed to see a listing, based on trust distance. */
export type Privacy =
  | "A" // only level A
  | "AB" // level A and B
  | "ABC" // up to level C
  | "referral" // only with a referral / introduction
  | "approved"; // only people I personally approve

/** The kinds of social-trust badges a person can attach to a listing. */
export type BadgeType =
  | "verify_item" // I confirm this item / its quality
  | "know_seller" // I know the seller personally
  | "verify_quality" // I confirm the quality
  | "dealt_before"; // I have dealt with this person before

export interface Person {
  id: string;
  name: string;
  /** Emoji used as a lightweight avatar in this prototype. */
  avatar: string;
  relation: RelationType;
  level: TrustLevel;
  /** Short note about how you know them. */
  note?: string;
  /** Number of completed deals on the platform. */
  deals: number;
  /** City / area, shown on the trust profile. */
  city?: string;
  /** Whether this person is in *my* circle (vs. a friend-of-friend). */
  inMyCircle: boolean;
}

export interface Endorsement {
  personId: string;
  type: BadgeType;
}

/** A single hop in a trust path from the seller to the viewer. */
export interface TrustHop {
  personId: string;
  /** Relation of this hop relative to the previous node. */
  relationLabel: string;
}

/** A "wanted" post — someone in the circle is looking for something. */
export interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  /** Emoji icon for the request. */
  image: string;
  requesterId: string;
  postedAt: string;
  /** Optional budget in Toman. */
  budget?: number;
  privacy: Privacy;
  /** Path of people connecting the requester to "me" (ordered me-side first). */
  trustPath: TrustHop[];
  city?: string;
}

/** A single chat message in a one-to-one conversation. */
export interface Message {
  id: string;
  /** The other participant (a person id). */
  peerId: string;
  /** True when sent by the current user. */
  fromMe: boolean;
  text: string;
  postedAt: string;
  /** Incoming messages start unread until the thread is opened. */
  read: boolean;
}

/** A response to a request — someone offering what the requester wants. */
export interface Offer {
  id: string;
  requestId: string;
  fromId: string;
  message: string;
  /** Optional offered price in Toman. */
  price?: number;
  postedAt: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  type: ListingType;
  /** Price in Toman; undefined for donation / loan / exchange. */
  price?: number;
  category: string;
  /** Emoji used as the listing image placeholder. */
  image: string;
  sellerId: string;
  /** Relative time label, e.g. "۲ ساعت پیش". */
  postedAt: string;
  condition?: string;
  privacy: Privacy;
  endorsements: Endorsement[];
  /**
   * People connecting the seller to "me", ordered me-side first
   * (trustPath[0] is in my circle; the last hop knows the seller).
   * Empty when the seller is directly in my circle.
   */
  trustPath: TrustHop[];
  city?: string;
}
