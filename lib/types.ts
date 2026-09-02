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

/** How a request’s optional amount is framed (session / month / total). */
export type BudgetUnit = "session" | "month" | "total" | "negotiable";

/** The kinds of social-trust badges a person can attach to a listing. */
export type BadgeType =
  | "verify_item" // I confirm this item / its quality
  | "know_seller" // I know the seller personally
  | "verify_quality" // I confirm the quality
  | "dealt_before" // I have dealt with this person before
  | "word"; // optional free-text from a circle member

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
  /** False until the inviter changes the default trust group. */
  trustTouched?: boolean;
  /** When this person joined the viewer's circle (ISO). */
  joinedAt?: string;
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
  /** Optional first-person note shown next to the claims. */
  note?: string;
  /** Owner hid this whole word from the listing. */
  hidden?: boolean;
}

/** A single hop in a trust path from the seller to the viewer. */
export interface TrustHop {
  personId: string;
  /**
   * How this hop relates toward the viewer
   * (e.g. «خانواده من» = bridge → you).
   */
  relationLabel: string;
  /**
   * How the previous node toward the poster relates to this hop
   * (e.g. «خانوادهٔ عسل» under the seller when the hop is عسل).
   */
  priorRelationLabel?: string;
}

/** Undirected peer link for the trust map (DB edges among the network). */
export interface NetworkLink {
  fromId: string;
  toId: string;
  relationType: RelationType;
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
  /** Optional ceiling amount in Toman. */
  budget?: number;
  /** How `budget` is framed; omit = plain ceiling / توافقی if no amount. */
  budgetUnit?: BudgetUnit;
  privacy: Privacy;
  /** Path of people connecting the requester to "me" (ordered me-side first). */
  trustPath: TrustHop[];
  /** Social-trust badges from people in the viewer's network. */
  endorsements: Endorsement[];
  city?: string;
  /** Neighborhood or fulfillment mode (آنلاین / ارسال / سراسر شهر). */
  area?: string;
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
  /** Epoch ms of the send — inbox and threads sort by this, not array order. */
  sentAt?: number;
  /** Incoming messages start unread until the thread is opened. */
  read: boolean;
  /** Outgoing: the peer has opened the thread (second tick). */
  seenByPeer?: boolean;
  /** When set, this message is a referral carrying a listing preview. */
  listingId?: string;
  /** Listing-scoped thread; not mixed with other deals with the same peer. */
  threadListingId?: string;
  /** Uploaded chat photo (object-storage HTTPS or legacy `/api/uploads/….jpg`). */
  imageUrl?: string;
  /** Hide the peer’s real name in this thread (buyer viewing seller). */
  peerHidden?: boolean;
  /** System inbox (Circlo), not a person-to-person DM. */
  kind?: "notice" | "system";
  actionHref?: string;
  actionLabel?: string;
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
  /** Listing was published with identity hidden from the circle. */
  privatePublish?: boolean;
  /** Viewer cannot see the seller’s name or photo. */
  identityHidden?: boolean;
  /** Trust toward the real seller, kept after identity is masked. */
  viewerTrustScore?: number;
  /** True when the real seller is in the viewer’s direct circle. */
  viewerDirect?: boolean;
  /** Stable private-listing face; assigned by the app, not chosen by the seller. */
  privateAvatar?: string;
  /** Owner: people this listing is hidden from. */
  excludePersonIds?: string[];
  /** Owner: relation types this listing is hidden from. */
  excludeRelationTypes?: RelationType[];
  /** Owner: buyers who already saw the seller’s identity in chat. */
  identityRevealedPeerIds?: string[];
  endorsements: Endorsement[];
  /**
   * People connecting the seller to "me", ordered me-side first
   * (trustPath[0] is in my circle; the last hop knows the seller).
   * Empty when the seller is directly in my circle.
   */
  trustPath: TrustHop[];
  city?: string;
  /** Neighborhood or fulfillment mode (آنلاین / ارسال / سراسر شهر). */
  area?: string;
  /**
   * Deal / publish state.
   * `reserved` / `agreed` are chat-only holds. `inactive` means the owner
   * unpublished: hidden from others’ feed, still on the owner’s profile.
   */
  dealStatus?: "available" | "reserved" | "agreed" | "inactive";
  /** True when this row came from the home feed (no gallery/specs). */
  feedPreview?: boolean;
}

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export type InviteKind = "personal" | "wave";

/** Expected invitee on a wave link — matched later by OTP phone. */
export type InviteExpectedPerson = {
  id: string;
  phone: string;
  name?: string;
  joined: boolean;
  joinedUserId?: string;
};

/** Server session payload. Client `me.id` stays `"me"`. */
export type SessionUser = {
  id: string;
  phoneNormalized: string;
  name: string;
  avatar: string;
  city: string | null;
  profileCompletedAt: string | null;
  showOwnListingsInFeed: boolean;
};

/** Public invite landing — never includes trust group or relation. */
export type PublicInvite = {
  code: string;
  status: InviteStatus;
  kind: InviteKind;
  expiresAt: string;
  inviter: { id: string; name: string; avatar: string };
  isOwn: boolean;
  alreadyMember: boolean;
  alreadyRequested: boolean;
  full: boolean;
};

/** Inbound join request: used the link, but was not on the host's roster. */
export type CircleJoinRequest = {
  id: string;
  guest: {
    id: string;
    name: string;
    avatar: string;
    city?: string;
  };
  inviteId?: string;
  createdAt: string;
};

/** Directed invite from the current user to someone not yet (or just) joined. */
export interface Invite {
  id: string;
  code: string;
  inviterUserId: string;
  invitedPhone?: string;
  invitedName?: string;
  relationType: RelationType;
  trustGroup: TrustLevel;
  kind: InviteKind;
  maxUses: number;
  useCount: number;
  status: InviteStatus;
  acceptedByUserId?: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  /** Placeholder person row in the inviter's circle. */
  personId: string;
  /** Wave roster. Personal invites leave this empty. */
  expected?: InviteExpectedPerson[];
}
