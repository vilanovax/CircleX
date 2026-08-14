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
  /** Avatar image path (e.g. /avatars/01.webp) or legacy emoji. */
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
  /** Pending invitees are in the list but not active members. */
  inviteStatus?: "pending" | "joined";
  /** Optional phone the invite was addressed to (normalized 09…). */
  phone?: string;
  phoneNormalized?: string;
  /** ISO timestamp when the current user finished the identity sheet. */
  profileCompletedAt?: string | null;
  /** Jalali year or label, e.g. "۱۴۰۳". */
  memberSince?: string;
  /** Share of messages answered within 24h (0–100). */
  responseRate?: number;
  /** Relative activity label, e.g. "امروز". */
  lastActive?: string;
  /** Override when endorsements cannot be derived from listings alone. */
  endorsementsReceived?: number;
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
  /** Social-trust badges from people in the viewer's network. */
  endorsements: Endorsement[];
  city?: string;
}

/** Kind of community event/gathering. */
export type EventKind =
  | "class" // کلاس / کارگاه
  | "family" // دورهمی خانوادگی
  | "charity" // بازارچه / خیریه
  | "kids" // playdate کودکان
  | "trip" // سفر گروهی
  | "social"; // دورهمی عمومی

/** A community event hosted within the trust network. */
export interface CircleEvent {
  id: string;
  title: string;
  description: string;
  kind: EventKind;
  image: string;
  hostId: string;
  /** Human date label, e.g. "جمعه ۲۲ خرداد". */
  date: string;
  /** Time label, e.g. "۱۰:۰۰" (optional for multi-day). */
  time?: string;
  location: string;
  /** Max attendees; undefined = unlimited. */
  capacity?: number;
  privacy: Privacy;
  /** Person ids who have RSVP'd (excludes the host). */
  attendees: string[];
  trustPath: TrustHop[];
  /** Social-trust badges from people in the viewer's network. */
  endorsements: Endorsement[];
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
  /** When set, this message is a referral carrying a listing preview. */
  listingId?: string;
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

/** One labeled fact on a listing detail (dimensions, fabric, visit, …). */
export interface ListingSpec {
  label: string;
  value: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  type: ListingType;
  /** Price in Toman; undefined for donation / loan / exchange. */
  price?: number;
  category: string;
  /** Cover photo URL / data URL, or emoji placeholder when no photo. */
  image: string;
  /**
   * Gallery photos (detail). When omitted, detail falls back to `[image]`.
   * Feed cards keep using `image` as the cover.
   */
  images?: string[];
  /** Product / service facts shown under the description. */
  specs?: ListingSpec[];
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
  /** Soft deal state after buyer interest (mock marketplace flow). */
  dealStatus?: "available" | "reserved" | "agreed";
}

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

/** Directed invite from the current user to someone not yet (or just) joined. */
export interface Invite {
  id: string;
  code: string;
  inviterUserId: string;
  invitedPhone?: string;
  relationType: RelationType;
  trustGroup: TrustLevel;
  status: InviteStatus;
  acceptedByUserId?: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  /** Placeholder person row in the inviter's circle. */
  personId: string;
}
