"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createContext, useContextSelector } from "use-context-selector";
import { AVATAR_IMAGES } from "./avatar";
import { api, ApiError, invalidateApiCache } from "./api";
import { CIRCLO_PERSON, isCircloPeer } from "./circlo";
import { newUuid } from "./invite";
import {
  isActiveCircleMember,
  reusePeopleList,
  reusePerson,
} from "./circle-member";
import {
  ME,
  PEOPLE,
} from "./mock-data";
import { reconcileDemoMessages, mergeInboxMessages } from "./demo-requests";
import { clearThreadListing } from "./thread-listing";
import { threadKey, parseThreadKey } from "./listing-privacy";
import {
  buildThreadIndex,
  EMPTY_THREAD,
  type ThreadIndex,
} from "./thread-index";
import { ENDORSE_NOTE_MAX } from "./labels";
import type { HomeBootPayload } from "./home-types";
import type {
  BadgeType,
  BudgetUnit,
  CircleEvent,
  CircleJoinRequest,
  Endorsement,
  EventKind,
  Invite,
  Listing,
  ListingType,
  Message,
  NetworkLink,
  Offer,
  Person,
  Privacy,
  RelationType,
  Request,
  SessionUser,
  TrustLevel,
} from "./types";

interface NewListingInput {
  title: string;
  description: string;
  type: ListingType;
  price?: number;
  category: string;
  image: string;
  images?: string[];
  privacy: Privacy;
  hideIdentity?: boolean;
  excludePersonIds?: string[];
  excludeRelationTypes?: RelationType[];
  condition?: string;
  specs?: Listing["specs"];
  area?: string;
}

interface NewPersonInput {
  name: string;
  relation: RelationType;
  level: TrustLevel;
  note?: string;
}

interface NewRequestInput {
  title: string;
  description: string;
  category: string;
  image: string;
  budget?: number;
  budgetUnit?: BudgetUnit;
  privacy: Privacy;
  area?: string;
}

interface NewOfferInput {
  requestId: string;
  message: string;
  price?: number;
}

interface NewEventInput {
  title: string;
  description: string;
  kind: EventKind;
  image: string;
  date: string;
  time?: string;
  location: string;
  capacity?: number;
  privacy: Privacy;
}

export interface StoreValue {
  me: Person;
  people: Person[];
  listings: Listing[];
  requests: Request[];
  offers: Offer[];
  messages: Message[];
  events: CircleEvent[];
  saved: string[];
  /** Listings this viewer hid from feed / person cards; URL still works. */
  hiddenListings: string[];
  /** Sellers whose listings this viewer hid from feed; relationship is unchanged. */
  hiddenPeople: string[];
  /** Private per-listing notes; only the current user ever sees these. */
  listingNotes: Record<string, string>;
  /** Peer ids hidden from the main inbox (still recoverable). */
  archivedThreads: string[];
  /** Peer ids pinned to the top of the inbox (max a few). */
  pinnedThreads: string[];
  invites: Invite[];
  joinRequests: CircleJoinRequest[];
  /** People who already placed me, while I have not placed them. */
  addedYou: Person[];
  /** Peer edges among circle + FoF for the trust map. */
  networkLinks: NetworkLink[];
  /** Null until mock phone/OTP login succeeds. */
  sessionPhone: string | null;
  hydrated: boolean;
  /** Circle + listings finished loading after session. */
  circleReady: boolean;
  /** True after GET /api/circle or /api/graph (people + map links). Home boot is false. */
  circleFull: boolean;
  /** When false, own listings stay on profile and out of the home feed. */
  showOwnListingsInFeed: boolean;
  setShowOwnListingsInFeed: (value: boolean) => Promise<void>;
  profileCompletedAt: string | null;
  getPerson: (id: string) => Person | undefined;
  getListing: (id: string) => Listing | undefined;
  ensureListing: (id: string) => Promise<Listing | undefined>;
  getRequest: (id: string) => Request | undefined;
  ensureRequest: (id: string) => Promise<Request | undefined>;
  getEvent: (id: string) => CircleEvent | undefined;
  ensureEvent: (id: string) => Promise<CircleEvent | undefined>;
  addEvent: (input: NewEventInput) => Promise<string>;
  toggleRsvp: (eventId: string) => Promise<void>;
  isAttending: (eventId: string) => boolean;
  getOffers: (requestId: string) => Offer[];
  hasOffered: (requestId: string) => boolean;
  getThread: (peerId: string, listingId?: string | null) => Message[];
  threadIndex: ThreadIndex;
  threadPeers: () => string[];
  unreadCount: (peerId: string, listingId?: string | null) => number;
  refreshInbox: () => Promise<void>;
  totalUnread: () => number;
  addMessage: (
    peerId: string,
    text: string,
    listingId?: string,
    listingScoped?: boolean,
    imageUrl?: string,
  ) => Promise<Message | void>;
  referListing: (peerId: string, listingId: string, note?: string) => Promise<void>;
  revealListingIdentity: (listingId: string, peerId: string) => Promise<void>;
  markThreadRead: (peerId: string, listingId?: string | null) => void;
  archiveThread: (peerId: string) => Promise<void>;
  unarchiveThread: (peerId: string) => Promise<void>;
  isThreadArchived: (peerId: string) => boolean;
  togglePinThread: (peerId: string) => Promise<boolean>;
  isThreadPinned: (peerId: string) => boolean;
  deleteThread: (peerId: string) => Promise<void>;
  addPerson: (input: NewPersonInput) => void;
  createInvite: (input: {
    relationType: RelationType;
    trustGroup?: TrustLevel;
    invitedPhone?: string;
    invitedName?: string;
    kind?: "personal" | "wave";
    people?: { name?: string; phone: string }[];
  }) => Promise<Invite>;
  createWaveFromPending: (inviteIds: string[]) => Promise<Invite>;
  getInvite: (code: string) => Invite | undefined;
  acceptInvite: (
    code: string,
  ) => Promise<{
    invite: Invite;
    inviter: Person;
    edgeCreated?: boolean;
    requested?: boolean;
  } | null>;
  acceptJoinRequest: (
    id: string,
    input: {
      relation: RelationType;
      level: TrustLevel;
      displayName?: string;
    },
  ) => Promise<void>;
  rejectJoinRequest: (id: string) => Promise<void>;
  revokeInvite: (id: string) => Promise<void>;
  placePersonInMyCircle: (
    id: string,
    input: { level: TrustLevel; relation: RelationType },
  ) => Promise<void>;
  completeProfile: (input: { name: string; avatar?: string }) => Promise<void>;
  /** Persist a FoF / thread peer into my directed circle. */
  addToCircle: (
    id: string,
    input: { level: TrustLevel; relation?: RelationType; note?: string },
  ) => Promise<void>;
  removePerson: (id: string) => void;
  setLevel: (id: string, level: TrustLevel) => void;
  setRelation: (id: string, relation: RelationType) => void;
  addListing: (input: NewListingInput) => Promise<string>;
  updateListing: (id: string, input: NewListingInput) => Promise<void>;
  setListingDealStatus: (
    listingId: string,
    status: NonNullable<Listing["dealStatus"]>,
  ) => Promise<void>;
  deleteListing: (listingId: string) => Promise<void>;
  setMyListingEndorsement: (
    listingId: string,
    types: BadgeType[],
    note?: string,
  ) => Promise<void>;
  setListingEndorsementHidden: (
    listingId: string,
    personId: string,
    hidden: boolean,
  ) => Promise<void>;
  addRequest: (input: NewRequestInput) => Promise<string>;
  addOffer: (input: NewOfferInput) => Promise<void>;
  withdrawOffer: (requestId: string) => Promise<void>;
  toggleSaved: (listingId: string) => Promise<void>;
  toggleHiddenListing: (listingId: string) => Promise<void>;
  toggleHiddenPerson: (personId: string) => Promise<void>;
  setListingNote: (listingId: string, note: string) => Promise<void>;
  isSaved: (listingId: string) => boolean;
  isListingHidden: (listingId: string) => boolean;
  isPersonHidden: (personId: string) => boolean;
  /** Apply the server user after OTP verify. */
  completeLogin: (user: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
  meServerId: string | null;
  refreshCircle: () => Promise<void>;
  /** Skip /api/circle when home already applied a fresh roster. */
  ensureCircleRoster: () => Promise<void>;
  refreshGraph: () => Promise<void>;
  updateProfile: (
    input: Partial<Pick<Person, "name" | "avatar" | "city">>,
  ) => Promise<void>;
}

function deferNonUrgent(task: () => void) {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => task(), { timeout: 2500 });
    return;
  }
  setTimeout(task, 80);
}

const StoreContext = createContext<StoreValue | null>(null);

/** Same window as the tab-visible home refresh — roster is already on /api/home. */
const ROSTER_FRESH_MS = 45_000;

const AVATAR_POOL = AVATAR_IMAGES;
const SEED_IDS = new Set(PEOPLE.map((p) => p.id));

function networkSeed(): Person[] {
  return PEOPLE.map((p) => ({
    ...p,
    inMyCircle: false,
    inviteStatus: undefined,
  }));
}

function blankMe(): Person {
  return { ...ME, name: "", profileCompletedAt: null };
}

function overlayPeople(prev: Person[], incoming: Person[]): Person[] {
  if (incoming.length === 0) return prev;
  const map = new Map(prev.map((p) => [p.id, p]));
  let changed = false;
  for (const person of incoming) {
    if (isCircloPeer(person.id)) continue;
    const existing = map.get(person.id);
    if (!existing) {
      map.set(person.id, person);
      changed = true;
      continue;
    }
    const next = reusePerson(existing, person);
    if (next !== existing) {
      map.set(person.id, next);
      changed = true;
    }
  }
  if (!changed) return prev;
  return Array.from(map.values());
}

function meFromSession(user: SessionUser | null): Person {
  if (!user) return blankMe();
  return {
    ...ME,
    id: "me",
    name: user.name,
    avatar: user.avatar || ME.avatar,
    city: user.city ?? ME.city,
    phone: user.phoneNormalized,
    phoneNormalized: user.phoneNormalized,
    profileCompletedAt: user.profileCompletedAt,
  };
}

function peopleFromHome(home: HomeBootPayload | null): Person[] {
  if (!home) return networkSeed();
  const incoming = [
    ...home.members,
    ...(home.network ?? []),
    ...(home.addedYou ?? []),
  ].filter((p) => !isCircloPeer(p.id));
  const merged: Person[] = [];
  const seen = new Set<string>();
  for (const p of incoming) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    merged.push(p);
  }
  return merged;
}

export function StoreProvider({
  children,
  initialUser = null,
  initialHome = null,
}: {
  children: ReactNode;
  initialUser?: SessionUser | null;
  initialHome?: HomeBootPayload | null;
}) {
  const [meProfile, setMeProfile] = useState(() => meFromSession(initialUser));
  const [people, setPeople] = useState(() => peopleFromHome(initialHome));
  const [listings, setListings] = useState<Listing[]>(
    () => initialHome?.listings ?? [],
  );
  const [requests, setRequests] = useState<Request[]>(
    () => initialHome?.requests ?? [],
  );
  const [offers, setOffers] = useState<Offer[]>(() => initialHome?.offers ?? []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<CircleEvent[]>(
    () => initialHome?.events ?? [],
  );
  const [saved, setSaved] = useState<string[]>(() => initialHome?.saved ?? []);
  const [hiddenListings, setHiddenListings] = useState<string[]>(
    () => initialHome?.hiddenListings ?? [],
  );
  const [hiddenPeople, setHiddenPeople] = useState<string[]>(
    () => initialHome?.hiddenPeople ?? [],
  );
  const [listingNotes, setListingNotes] = useState<Record<string, string>>(
    () => initialHome?.listingNotes ?? {},
  );
  const [archivedThreads, setArchivedThreads] = useState<string[]>([]);
  const [pinnedThreads, setPinnedThreads] = useState<string[]>([]);
  const [deletedThreads, setDeletedThreads] = useState<string[]>([]);
  const [invites, setInvites] = useState<Invite[]>(
    () => initialHome?.pending ?? [],
  );
  const [joinRequests, setJoinRequests] = useState<CircleJoinRequest[]>(
    () => initialHome?.joinRequests ?? [],
  );
  const [addedYou, setAddedYou] = useState<Person[]>(
    () => initialHome?.addedYou ?? [],
  );
  const [networkLinks, setNetworkLinks] = useState<NetworkLink[]>([]);
  const [sessionPhone, setSessionPhone] = useState<string | null>(
    () => initialUser?.phoneNormalized ?? null,
  );
  const [meServerId, setMeServerId] = useState<string | null>(
    () => initialUser?.id ?? null,
  );
  const [hydrated] = useState(true);
  const [circleReady, setCircleReady] = useState(
    () => !initialUser || Boolean(initialHome),
  );
  const [circleFull, setCircleFull] = useState(false);
  const rosterFetchedAtRef = useRef(initialHome ? Date.now() : 0);
  const graphInflightRef = useRef<Promise<void> | null>(null);
  const [showOwnListingsInFeed, setShowOwnFeedState] = useState(
    () =>
      initialHome?.showOwnListingsInFeed ??
      initialUser?.showOwnListingsInFeed ??
      true,
  );
  const [profileCompletedAt, setProfileCompletedAt] = useState<string | null>(
    () => initialUser?.profileCompletedAt ?? null,
  );

  const applyUserLocal = useCallback((user: SessionUser) => {
    setMeServerId(user.id);
    setSessionPhone(user.phoneNormalized);
    setProfileCompletedAt(user.profileCompletedAt);
    setShowOwnFeedState(user.showOwnListingsInFeed);
    setMeProfile((prev) => ({
      ...prev,
      id: "me",
      name: user.name,
      avatar: user.avatar || prev.avatar || ME.avatar,
      city: user.city ?? prev.city,
      phone: user.phoneNormalized,
      phoneNormalized: user.phoneNormalized,
      profileCompletedAt: user.profileCompletedAt,
    }));
  }, []);

  type CirclePayload = {
    members: Person[];
    network?: Person[];
    links?: { fromId: string; toId: string; relationType: string }[];
    pending: Invite[];
    pendingPeople?: Person[];
    listings?: Listing[];
    requests?: Request[];
    offers?: Offer[];
    events?: CircleEvent[];
    joinRequests?: CircleJoinRequest[];
    saved?: string[];
    hiddenListings?: string[];
    hiddenPeople?: string[];
    listingNotes?: Record<string, string>;
    addedYou?: Person[];
    archivedThreads?: string[];
    pinnedThreads?: string[];
    deletedThreads?: string[];
    showOwnListingsInFeed?: boolean;
  };

  const peopleRef = useRef(people);
  peopleRef.current = people;
  const listingsRef = useRef(listings);
  listingsRef.current = listings;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const deletedThreadsRef = useRef(deletedThreads);
  deletedThreadsRef.current = deletedThreads;

  const applyCirclePayload = useCallback(
    (data: CirclePayload, opts?: { full?: boolean; keepGraph?: boolean }) => {
      const full = opts?.full ?? Boolean(data.links);
      const keepGraph = Boolean(opts?.keepGraph) && !full;
      setInvites(data.pending);
      const memberIds = new Set(
        data.members
          .filter((p) => isActiveCircleMember(p))
          .map((p) => p.id),
      );
      setJoinRequests(
        (data.joinRequests ?? []).filter((row) => !memberIds.has(row.guest.id)),
      );
      if (full) {
        setNetworkLinks((data.links ?? []) as NetworkLink[]);
      } else if (!keepGraph) {
        // Drop map edges so stale FoF ids never linger after a plain home load.
        setNetworkLinks([]);
      }
      if (Array.isArray(data.addedYou)) {
        setAddedYou(data.addedYou);
      }
      const incoming = [
        ...data.members,
        ...(data.pendingPeople ?? []),
        ...(data.network ?? []),
        ...(data.addedYou ?? []),
      ].filter((p) => !isCircloPeer(p.id));
      const mergedPeople = keepGraph
        ? overlayPeople(peopleRef.current, incoming)
        : (() => {
            const merged: Person[] = [];
            const seen = new Set<string>();
            for (const p of incoming) {
              if (seen.has(p.id)) continue;
              seen.add(p.id);
              merged.push(p);
            }
            return reusePeopleList(peopleRef.current, merged);
          })();
      setPeople(mergedPeople);
      if (data.listings) setListings(data.listings);
      if (data.requests) setRequests(data.requests);
      if (data.offers) setOffers(data.offers);
      if (data.events) setEvents(data.events);
      if (Array.isArray(data.saved)) setSaved(data.saved);
      if (Array.isArray(data.hiddenListings)) {
        setHiddenListings(data.hiddenListings);
      }
      if (Array.isArray(data.hiddenPeople)) {
        setHiddenPeople(data.hiddenPeople);
      }
      if (data.listingNotes && typeof data.listingNotes === "object") {
        setListingNotes(data.listingNotes);
      }
      if (Array.isArray(data.archivedThreads)) {
        setArchivedThreads(data.archivedThreads);
      }
      if (Array.isArray(data.pinnedThreads)) {
        setPinnedThreads(data.pinnedThreads);
      }
      if (Array.isArray(data.deletedThreads)) {
        setDeletedThreads(data.deletedThreads);
      }
      if (typeof data.showOwnListingsInFeed === "boolean") {
        setShowOwnFeedState(data.showOwnListingsInFeed);
      }
      setMessages((prev) =>
        reconcileDemoMessages(
          prev,
          mergedPeople,
          data.listings ?? listingsRef.current,
        ),
      );
      setCircleReady(true);
      if (full) setCircleFull(true);
      else if (!keepGraph) setCircleFull(false);
      rosterFetchedAtRef.current = Date.now();
    },
    [],
  );

  const loadMessages = useCallback(async () => {
    const data = await api<{
      messages: Message[];
      people: Person[];
      archivedThreads?: string[];
      pinnedThreads?: string[];
      deletedThreads?: string[];
    }>("/api/messages");
    if (data.people.length > 0) {
      setPeople((prev) => overlayPeople(prev, data.people));
    }
    if (Array.isArray(data.archivedThreads)) {
      setArchivedThreads(data.archivedThreads);
    }
    if (Array.isArray(data.pinnedThreads)) {
      setPinnedThreads(data.pinnedThreads);
    }
    if (Array.isArray(data.deletedThreads)) {
      deletedThreadsRef.current = data.deletedThreads;
      setDeletedThreads(data.deletedThreads);
    }
    const { messages: next, revivedPeerIds } = mergeInboxMessages(
      data.messages,
      messagesRef.current,
      deletedThreadsRef.current,
    );
    setMessages(next);
    if (revivedPeerIds.length > 0) {
      const revived = new Set(revivedPeerIds);
      setDeletedThreads((prev) => prev.filter((id) => !revived.has(id)));
    }
  }, []);

  const loadHome = useCallback(
    async (opts?: { keepGraph?: boolean }) => {
      const data = await api<CirclePayload>("/api/home");
      applyCirclePayload(data, { full: false, keepGraph: opts?.keepGraph });
      // Inbox is not on the home LCP path — don't contend with listing photos.
      deferNonUrgent(() => void loadMessages().catch(() => {}));
      return data;
    },
    [applyCirclePayload, loadMessages],
  );

  const loadCircle = useCallback(async () => {
    const data = await api<CirclePayload>("/api/circle");
    applyCirclePayload(data, { full: true });
  }, [applyCirclePayload]);

  const loadGraph = useCallback(async () => {
    if (graphInflightRef.current) return graphInflightRef.current;
    const run = (async () => {
      const data = await api<{
        members: Person[];
        network?: Person[];
        links: NetworkLink[];
      }>("/api/graph");
      setNetworkLinks(data.links);
      const pending = peopleRef.current.filter(
        (p) => p.inviteStatus === "pending",
      );
      const next = overlayPeople(pending, [
        ...data.members,
        ...(data.network ?? []),
      ]);
      setPeople(next);
      setMessages((m) => reconcileDemoMessages(m, next, listingsRef.current));
      setCircleFull(true);
    })();
    graphInflightRef.current = run.finally(() => {
      graphInflightRef.current = null;
    });
    return graphInflightRef.current;
  }, []);

  const circleFullRef = useRef(circleFull);
  circleFullRef.current = circleFull;

  const circleReadyRef = useRef(circleReady);
  circleReadyRef.current = circleReady;

  /** Home already has the live roster; only refetch when that payload is stale. */
  const ensureCircleRoster = useCallback(async () => {
    if (!sessionPhone) return;
    if (!circleReadyRef.current) return;
    if (Date.now() - rosterFetchedAtRef.current < ROSTER_FRESH_MS) return;
    await loadHome({ keepGraph: circleFullRef.current });
  }, [sessionPhone, loadHome]);

  /** After invite/edge changes: slim home feed, keep map if already loaded. */
  const refreshAfterMutation = useCallback(async () => {
    const keepGraph = circleFullRef.current;
    await loadHome({ keepGraph });
    if (keepGraph) await loadGraph();
  }, [loadHome, loadGraph]);

  const fillHome = useCallback(async () => {
    try {
      await loadHome();
    } catch {
      setPeople(networkSeed());
      setInvites([]);
      setJoinRequests([]);
      setAddedYou([]);
      setNetworkLinks([]);
      setListings([]);
      setRequests([]);
      setOffers([]);
      setEvents([]);
      setSaved([]);
      setHiddenListings([]);
      setHiddenPeople([]);
      setCircleReady(true);
      setCircleFull(false);
    }
  }, [loadHome]);

  // First-paint snapshot only. Later navigations keep this provider mounted.
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!initialUser) return;
      if (initialHome) {
        deferNonUrgent(() => void loadMessages().catch(() => {}));
        return;
      }
      try {
        const home = await api<CirclePayload>("/api/home");
        if (cancelled) return;
        applyCirclePayload(home, { full: false });
        if (cancelled) return;
        deferNonUrgent(() => void loadMessages().catch(() => {}));
      } catch {
        if (cancelled) return;
        setInvites([]);
        setJoinRequests([]);
        setAddedYou([]);
        setPeople(networkSeed());
        setListings([]);
        setRequests([]);
        setOffers([]);
        setEvents([]);
        setSaved([]);
        setHiddenListings([]);
        setHiddenPeople([]);
        setCircleReady(true);
        setCircleFull(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once from SSR snapshot
  }, []);

  useEffect(() => {
    if (!hydrated || !sessionPhone) return;
    let last = 0;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - last < ROSTER_FRESH_MS) return;
      last = now;
      // Soft-refresh slim home. Browser may abort fetch after sleep/suspend
      // (ERR_NETWORK_IO_SUSPENDED) — ignore; next focus/action will retry.
      void loadHome({ keepGraph: circleFull }).catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [hydrated, sessionPhone, circleFull, loadHome]);

  const personById = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of people) map.set(p.id, p);
    return map;
  }, [people]);

  const getPerson = useCallback(
    (id: string) =>
      isCircloPeer(id)
        ? CIRCLO_PERSON
        : id === "me" || (meServerId && id === meServerId)
          ? meProfile
          : personById.get(id),
    [meProfile, meServerId, personById],
  );

  const updateProfile = useCallback(
    async (input: Partial<Pick<Person, "name" | "avatar" | "city">>) => {
      const name = (input.name ?? meProfile.name).trim();
      const { user } = await api<{ user: SessionUser }>("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          avatar: input.avatar,
          city: input.city,
        }),
      });
      applyUserLocal(user);
    },
    [applyUserLocal, meProfile.name],
  );

  const listingById = useMemo(() => {
    const map = new Map<string, Listing>();
    for (const listing of listings) map.set(listing.id, listing);
    return map;
  }, [listings]);

  const getListing = useCallback(
    (id: string) => listingById.get(id),
    [listingById],
  );

  const ensureListing = useCallback(async (id: string) => {
    const existing = listingsRef.current.find((l) => l.id === id);
    if (existing && !existing.feedPreview) return existing;
    try {
      const { listing, personalNote } = await api<{
        listing: Listing;
        personalNote?: string | null;
      }>(`/api/listings/${encodeURIComponent(id)}`);
      const current = listingsRef.current.find((row) => row.id === listing.id);
      const next = {
        ...listing,
        endorsements:
          listing.endorsements.length > 0
            ? listing.endorsements
            : (current?.endorsements ?? []),
      };
      setListings((prev) =>
        prev.some((row) => row.id === next.id)
          ? prev.map((row) => (row.id === next.id ? next : row))
          : [next, ...prev],
      );
      if (typeof personalNote === "string" && personalNote.trim()) {
        setListingNotes((prev) =>
          prev[listing.id] === personalNote
            ? prev
            : { ...prev, [listing.id]: personalNote },
        );
      } else if (personalNote === null) {
        setListingNotes((prev) => {
          if (!(listing.id in prev)) return prev;
          const copy = { ...prev };
          delete copy[listing.id];
          return copy;
        });
      }
      return next;
    } catch (err) {
      if (err instanceof ApiError && err.code === "listing_not_visible") {
        setListings((prev) => prev.filter((row) => row.id !== id));
        return undefined;
      }
      return listingsRef.current.find((l) => l.id === id) ?? existing;
    }
  }, []);

  const getRequest = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests],
  );

  const ensureRequest = useCallback(async (id: string) => {
    const existing = requests.find((r) => r.id === id);
    if (existing) return existing;
    try {
      const data = await api<{ request: Request; offers: Offer[] }>(
        `/api/requests/${encodeURIComponent(id)}`,
      );
      setRequests((prev) =>
        prev.some((row) => row.id === data.request.id)
          ? prev.map((row) =>
              row.id === data.request.id ? data.request : row,
            )
          : [data.request, ...prev],
      );
      setOffers((prev) => {
        const others = prev.filter((o) => o.requestId !== data.request.id);
        return [...data.offers, ...others];
      });
      return data.request;
    } catch {
      return existing;
    }
  }, [requests]);

  const getOffers = useCallback(
    (requestId: string) => offers.filter((o) => o.requestId === requestId),
    [offers],
  );

  const hasOffered = useCallback(
    (requestId: string) =>
      offers.some((o) => o.requestId === requestId && o.fromId === "me"),
    [offers],
  );

  const threadIndexPrevRef = useRef<ThreadIndex | undefined>(undefined);
  const threadIndex = useMemo(() => {
    const next = buildThreadIndex(messages, threadIndexPrevRef.current);
    threadIndexPrevRef.current = next;
    return next;
  }, [messages]);

  const getThread = useCallback(
    (peerId: string, listingId?: string | null) =>
      threadIndex.threadByPeer.get(threadKey(peerId, listingId)) ??
      EMPTY_THREAD,
    [threadIndex],
  );

  const threadPeers = useCallback(
    () => threadIndex.peerIds,
    [threadIndex],
  );

  const unreadCount = useCallback(
    (peerId: string, listingId?: string | null) =>
      threadIndex.unreadByPeer.get(threadKey(peerId, listingId)) ?? 0,
    [threadIndex],
  );

  const totalUnread = useCallback(
    () => threadIndex.totalUnread,
    [threadIndex],
  );

  const addMessage = useCallback(
    async (
      peerId: string,
      text: string,
      listingId?: string,
      listingScoped?: boolean,
      imageUrl?: string,
    ) => {
      if (isCircloPeer(peerId)) return;
      if (!peerId && !listingScoped) return;
      const tempId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: Message = {
        id: tempId,
        peerId: peerId || "pending",
        fromMe: true,
        text,
        postedAt: "همین حالا",
        sentAt: Date.now(),
        read: true,
        seenByPeer: false,
        ...(listingId ? { listingId, threadListingId: listingId } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      };
      setMessages((prev) => [...prev, optimistic]);
      const key = threadKey(peerId || "pending", listingId);
      setArchivedThreads((prev) => prev.filter((id) => id !== key));
      setDeletedThreads((prev) => prev.filter((id) => id !== key));
      try {
        const data = await api<{ message: Message; peer: Person | null }>(
          "/api/messages",
          {
            method: "POST",
            body: JSON.stringify({
              ...(peerId && !peerId.startsWith("hidden:") ? { peerId } : {}),
              text,
              ...(listingId ? { listingId, listingScoped: true } : {}),
              ...(imageUrl ? { imageUrl } : {}),
            }),
          },
        );
        if (data.peer && !data.message.peerHidden) {
          setPeople((prev) => overlayPeople(prev, [data.peer as Person]));
        }
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? data.message : msg)),
        );
        return data.message;
      } catch (err) {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        throw err;
      }
    },
    [],
  );

  const revealListingIdentity = useCallback(
    async (listingId: string, peerId: string) => {
      const data = await api<{ listing: Listing; message: Message }>(
        `/api/listings/${encodeURIComponent(listingId)}/reveal`,
        {
          method: "POST",
          body: JSON.stringify({ peerId }),
        },
      );
      setListings((prev) =>
        prev.map((row) => (row.id === data.listing.id ? data.listing : row)),
      );
      setMessages((prev) => [...prev, data.message]);
    },
    [],
  );

  const referListing = useCallback(
    async (peerId: string, listingId: string, note?: string) => {
      const listing = listingsRef.current.find((row) => row.id === listingId);
      if (listing?.privatePublish) {
        throw new ApiError(400, "این آگهی را نمی‌توان در چت دیگری فرستاد");
      }
      await addMessage(peerId, note?.trim() ?? "", listingId);
    },
    [addMessage],
  );

  const markThreadRead = useCallback(
    (peerId: string, listingId?: string | null) => {
      const scopedId = listingId?.trim() || undefined;
      setMessages((prev) => {
        const unread = prev.some((msg) => {
          if (msg.peerId !== peerId || msg.fromMe || msg.read) return false;
          if (scopedId) return msg.threadListingId === scopedId;
          return !msg.threadListingId;
        });
        if (!unread) return prev;
        return prev.map((msg) => {
          if (msg.peerId !== peerId || msg.fromMe) return msg;
          if (scopedId) {
            return msg.threadListingId === scopedId ? { ...msg, read: true } : msg;
          }
          return msg.threadListingId ? msg : { ...msg, read: true };
        });
      });
      void api("/api/messages/read", {
        method: "POST",
        body: JSON.stringify({
          peerId,
          ...(scopedId ? { listingId: scopedId } : {}),
        }),
      }).catch(() => {});
    },
    [],
  );

  const persistThread = useCallback(
    async (
      key: string,
      patch: { archived?: boolean; pinned?: boolean; deleted?: boolean },
    ) => {
      const { peerId, listingId } = parseThreadKey(key);
      if (isCircloPeer(peerId)) return;
      await api("/api/messages/thread", {
        method: "PUT",
        body: JSON.stringify({
          peerId,
          listingId: listingId ?? "",
          ...patch,
        }),
      });
    },
    [],
  );

  const archiveThread = useCallback(
    async (peerId: string) => {
      if (isCircloPeer(peerId)) return;
      setArchivedThreads((prev) =>
        prev.includes(peerId) ? prev : [...prev, peerId],
      );
      setPinnedThreads((prev) => prev.filter((id) => id !== peerId));
      await persistThread(peerId, { archived: true });
    },
    [persistThread],
  );

  const unarchiveThread = useCallback(
    async (peerId: string) => {
      setArchivedThreads((prev) => prev.filter((id) => id !== peerId));
      await persistThread(peerId, { archived: false });
    },
    [persistThread],
  );

  const isThreadArchived = useCallback(
    (peerId: string) => archivedThreads.includes(peerId),
    [archivedThreads],
  );

  const deleteThread = useCallback(
    async (peerId: string) => {
      if (isCircloPeer(peerId)) return;
      setMessages((prev) =>
        prev.filter((msg) => threadKey(msg.peerId, msg.threadListingId) !== peerId),
      );
      setArchivedThreads((prev) => prev.filter((id) => id !== peerId));
      setPinnedThreads((prev) => prev.filter((id) => id !== peerId));
      setDeletedThreads((prev) =>
        prev.includes(peerId) ? prev : [...prev, peerId],
      );
      clearThreadListing(peerId);
      await persistThread(peerId, { deleted: true });
    },
    [persistThread],
  );

  const togglePinThread = useCallback(
    async (peerId: string) => {
      if (isCircloPeer(peerId)) return false;
      const pinned = pinnedThreads.includes(peerId);
      if (!pinned && pinnedThreads.length >= 3) return false;
      if (pinned) {
        setPinnedThreads((prev) => prev.filter((id) => id !== peerId));
      } else {
        setPinnedThreads((prev) => [peerId, ...prev]);
        setArchivedThreads((a) => a.filter((id) => id !== peerId));
      }
      try {
        await persistThread(peerId, { pinned: !pinned });
        return true;
      } catch {
        if (pinned) {
          setPinnedThreads((prev) => [peerId, ...prev]);
        } else {
          setPinnedThreads((prev) => prev.filter((id) => id !== peerId));
        }
        return false;
      }
    },
    [persistThread, pinnedThreads],
  );

  const isThreadPinned = useCallback(
    (peerId: string) => pinnedThreads.includes(peerId),
    [pinnedThreads],
  );

  const addPerson = useCallback((input: NewPersonInput) => {
    setPeople((prev) => {
      const id = newUuid();
      const avatar = AVATAR_POOL[prev.length % AVATAR_POOL.length];
      const person: Person = {
        id,
        name: input.name,
        avatar,
        relation: input.relation,
        level: input.level,
        note: input.note,
        deals: 0,
        city: ME.city,
        inMyCircle: true,
        inviteStatus: "joined",
      };
      return [person, ...prev];
    });
  }, []);

  const createInvite = useCallback(
    async (input: {
      relationType: RelationType;
      trustGroup?: TrustLevel;
      invitedPhone?: string;
      invitedName?: string;
      kind?: "personal" | "wave";
      people?: { name?: string; phone: string }[];
    }) => {
      const { invite } = await api<{ invite: Invite }>("/api/invites", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refreshAfterMutation();
      return invite;
    },
    [refreshAfterMutation],
  );

  const createWaveFromPending = useCallback(
    async (inviteIds: string[]) => {
      const selected = invites.filter(
        (inv) => inviteIds.includes(inv.id) && inv.kind === "personal",
      );
      const people = selected
        .filter((inv) => inv.invitedPhone)
        .map((inv) => ({
          phone: inv.invitedPhone as string,
          name: inv.invitedName,
        }));
      if (people.length === 0) {
        throw new Error("no-phones");
      }
      const relationType = selected.every(
        (inv) => inv.relationType === selected[0].relationType,
      )
        ? selected[0].relationType
        : selected[0].relationType;
      const { invite } = await api<{ invite: Invite }>("/api/invites", {
        method: "POST",
        body: JSON.stringify({
          relationType,
          kind: "wave",
          people,
        }),
      });
      await Promise.all(
        selected.map((inv) =>
          api(`/api/invites/${encodeURIComponent(inv.id)}/revoke`, {
            method: "POST",
          }),
        ),
      );
      await refreshAfterMutation();
      return invite;
    },
    [invites, refreshAfterMutation],
  );

  const getInvite = useCallback(
    (code: string) =>
      invites.find((i) => i.code.toLowerCase() === code.toLowerCase()),
    [invites],
  );

  const acceptInvite = useCallback(
    async (code: string) => {
      try {
        const data = await api<{
          invite: Invite;
          inviter: Person;
          edgeCreated?: boolean;
          requested?: boolean;
        }>(
          `/api/invites/${encodeURIComponent(code)}/accept`,
          { method: "POST" },
        );
        await refreshAfterMutation();
        setPeople((prev) => {
          if (prev.some((p) => p.id === data.inviter.id)) return prev;
          return [{ ...data.inviter, inMyCircle: false }, ...prev];
        });
        return data;
      } catch (err) {
        if (err instanceof ApiError && err.code === "own") return null;
        throw err;
      }
    },
    [refreshAfterMutation],
  );

  const acceptJoinRequest = useCallback(
    async (
      id: string,
      input: {
        relation: RelationType;
        level: TrustLevel;
        displayName?: string;
      },
    ) => {
      await api(`/api/circle/requests/${encodeURIComponent(id)}/accept`, {
        method: "POST",
        body: JSON.stringify({
          relationType: input.relation,
          trustGroup: input.level,
          displayName: input.displayName,
        }),
      });
      await refreshAfterMutation();
    },
    [refreshAfterMutation],
  );

  const rejectJoinRequest = useCallback(
    async (id: string) => {
      await api(`/api/circle/requests/${encodeURIComponent(id)}/reject`, {
        method: "POST",
      });
      await refreshAfterMutation();
    },
    [refreshAfterMutation],
  );

  const revokeInvite = useCallback(
    async (id: string) => {
      await api(`/api/invites/${encodeURIComponent(id)}/revoke`, {
        method: "POST",
      });
      await refreshAfterMutation();
    },
    [refreshAfterMutation],
  );

  const placePersonInMyCircle = useCallback(
    async (
      id: string,
      input: { level: TrustLevel; relation: RelationType },
    ) => {
      await api("/api/circle/edges", {
        method: "POST",
        body: JSON.stringify({
          toUserId: id,
          trustGroup: input.level,
          relationType: input.relation,
        }),
      });
      await refreshAfterMutation();
    },
    [refreshAfterMutation],
  );

  const completeProfile = useCallback(
    async (input: { name: string; avatar?: string }) => {
      const { user } = await api<{ user: SessionUser }>("/api/me", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      applyUserLocal(user);
    },
    [applyUserLocal],
  );

  const addToCircle = useCallback(
    async (
      id: string,
      input: { level: TrustLevel; relation?: RelationType; note?: string },
    ) => {
      await api("/api/circle/edges", {
        method: "POST",
        body: JSON.stringify({
          toUserId: id,
          trustGroup: input.level,
          relationType: input.relation ?? "friend",
        }),
      });
      setAddedYou((prev) => prev.filter((p) => p.id !== id));
      await refreshAfterMutation();
    },
    [refreshAfterMutation],
  );

  const removePerson = useCallback((id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const persistEdge = useCallback(
    (id: string, input: { level: TrustLevel; relation: RelationType }) => {
      if (SEED_IDS.has(id)) return;
      void api("/api/circle/edges", {
        method: "POST",
        body: JSON.stringify({
          toUserId: id,
          trustGroup: input.level,
          relationType: input.relation,
        }),
      })
        .then(() => refreshAfterMutation())
        .catch(() => {});
    },
    [refreshAfterMutation],
  );

  const setLevel = useCallback(
    (id: string, level: TrustLevel) => {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, level, trustTouched: true } : p,
        ),
      );
      const person = people.find((p) => p.id === id);
      if (!person || person.inviteStatus === "pending") return;
      persistEdge(id, { level, relation: person.relation });
    },
    [people, persistEdge],
  );

  const setRelation = useCallback(
    (id: string, relation: RelationType) => {
      setPeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, relation } : p)),
      );
      const person = people.find((p) => p.id === id);
      if (!person || person.inviteStatus === "pending") return;
      persistEdge(id, { level: person.level, relation });
    },
    [people, persistEdge],
  );

  const addListing = useCallback(async (input: NewListingInput) => {
    const { listing } = await api<{ listing: Listing }>("/api/listings", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setListings((prev) => [
      listing,
      ...prev.filter((row) => row.id !== listing.id),
    ]);
    return listing.id;
  }, []);

  const updateListing = useCallback(
    async (id: string, input: NewListingInput) => {
      const { listing } = await api<{ listing: Listing }>(
        `/api/listings/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(input),
        },
      );
      setListings((prev) =>
        prev.map((row) => (row.id === listing.id ? listing : row)),
      );
    },
    [],
  );

  const setListingDealStatus = useCallback(
    async (listingId: string, status: NonNullable<Listing["dealStatus"]>) => {
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, dealStatus: status } : l)),
      );
      try {
        const { listing } = await api<{ listing: Listing }>(
          `/api/listings/${encodeURIComponent(listingId)}`,
          {
            method: "PATCH",
            body: JSON.stringify({ dealStatus: status }),
          },
        );
        setListings((prev) =>
          prev.map((row) => (row.id === listingId ? listing : row)),
        );
      } catch {
        await loadHome({ keepGraph: circleFullRef.current });
      }
    },
    [loadHome],
  );

  const deleteListing = useCallback(async (listingId: string) => {
    await api(`/api/listings/${encodeURIComponent(listingId)}`, {
      method: "DELETE",
    });
    setListings((prev) => prev.filter((row) => row.id !== listingId));
    setSaved((prev) => prev.filter((id) => id !== listingId));
    setHiddenListings((prev) => prev.filter((id) => id !== listingId));
  }, []);

  // Persist MY word on a listing (badges + optional note). Empty clears it.
  const setMyListingEndorsement = useCallback(
    async (listingId: string, types: BadgeType[], note?: string) => {
      const noteTrim = note?.trim()
        ? note.trim().slice(0, ENDORSE_NOTE_MAX)
        : undefined;
      const badges = types.filter((t) => t !== "word");
      const previous =
        listingsRef.current.find((l) => l.id === listingId)?.endorsements ??
        [];
      const others = previous.filter((e) => e.personId !== "me");
      const mine =
        badges.length === 0 && !noteTrim
          ? []
          : badges.length > 0
            ? badges.map((type, i) => ({
                personId: "me" as const,
                type,
                ...(i === 0 && noteTrim ? { note: noteTrim } : {}),
              }))
            : [
                {
                  personId: "me" as const,
                  type: "word" as const,
                  note: noteTrim,
                },
              ];
      const optimistic = [...others, ...mine];
      setListings((prev) =>
        prev.map((l) =>
          l.id === listingId ? { ...l, endorsements: optimistic } : l,
        ),
      );
      try {
        const { endorsements } = await api<{ endorsements: Endorsement[] }>(
          `/api/listings/${encodeURIComponent(listingId)}/endorsements`,
          {
            method: "PUT",
            body: JSON.stringify({ types: badges, note: noteTrim ?? "" }),
          },
        );
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId ? { ...l, endorsements } : l,
          ),
        );
      } catch (err) {
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId ? { ...l, endorsements: previous } : l,
          ),
        );
        throw err;
      }
    },
    [],
  );

  const setListingEndorsementHidden = useCallback(
    async (listingId: string, personId: string, hidden: boolean) => {
      const previous =
        listingsRef.current.find((l) => l.id === listingId)?.endorsements ??
        [];
      setListings((prev) =>
        prev.map((l) =>
          l.id === listingId
            ? {
                ...l,
                endorsements: l.endorsements.map((e) =>
                  e.personId === personId ? { ...e, hidden } : e,
                ),
              }
            : l,
        ),
      );
      try {
        const { endorsements } = await api<{ endorsements: Endorsement[] }>(
          `/api/listings/${encodeURIComponent(listingId)}/endorsements`,
          {
            method: "PATCH",
            body: JSON.stringify({ personId, hidden }),
          },
        );
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId ? { ...l, endorsements } : l,
          ),
        );
      } catch (err) {
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId ? { ...l, endorsements: previous } : l,
          ),
        );
        throw err;
      }
    },
    [],
  );

  const addRequest = useCallback(async (input: NewRequestInput) => {
    const { request } = await api<{ request: Request }>("/api/requests", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setRequests((prev) => [request, ...prev.filter((r) => r.id !== request.id)]);
    return request.id;
  }, []);

  const addOffer = useCallback(async (input: NewOfferInput) => {
    const { offer } = await api<{ offer: Offer }>(
      `/api/requests/${encodeURIComponent(input.requestId)}/offers`,
      {
        method: "POST",
        body: JSON.stringify({
          message: input.message,
          price: input.price,
        }),
      },
    );
    setOffers((prev) => [
      offer,
      ...prev.filter(
        (o) => !(o.requestId === input.requestId && o.fromId === "me"),
      ),
    ]);
  }, []);

  const withdrawOffer = useCallback(async (requestId: string) => {
    await api(`/api/requests/${encodeURIComponent(requestId)}/offers`, {
      method: "DELETE",
    });
    setOffers((prev) =>
      prev.filter((o) => !(o.requestId === requestId && o.fromId === "me")),
    );
  }, []);

  const toggleSaved = useCallback(async (listingId: string) => {
    const { saved: next } = await api<{ saved: string[] }>("/api/saved", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
    setSaved(next);
  }, []);

  const toggleHiddenListing = useCallback(async (listingId: string) => {
    const { hidden: next } = await api<{ hidden: string[] }>("/api/hidden", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
    setHiddenListings(next);
  }, []);

  const toggleHiddenPerson = useCallback(async (personId: string) => {
    const { hiddenPeople: next } = await api<{ hiddenPeople: string[] }>(
      "/api/hidden-people",
      {
        method: "POST",
        body: JSON.stringify({ personId }),
      },
    );
    setHiddenPeople(next);
  }, []);

  const setListingNote = useCallback(async (listingId: string, note: string) => {
    const { note: nextNote, saved: nextSaved } = await api<{
      note: string | null;
      saved: string[];
    }>(`/api/listings/${encodeURIComponent(listingId)}/note`, {
      method: "PUT",
      body: JSON.stringify({ note }),
    });
    setListingNotes((prev) => {
      if (!nextNote) {
        if (!(listingId in prev)) return prev;
        const copy = { ...prev };
        delete copy[listingId];
        return copy;
      }
      if (prev[listingId] === nextNote) return prev;
      return { ...prev, [listingId]: nextNote };
    });
    setSaved(nextSaved);
  }, []);

  const savedSet = useMemo(() => new Set(saved), [saved]);
  const hiddenListingSet = useMemo(
    () => new Set(hiddenListings),
    [hiddenListings],
  );
  const hiddenPersonSet = useMemo(() => new Set(hiddenPeople), [hiddenPeople]);

  const isSaved = useCallback(
    (listingId: string) => savedSet.has(listingId),
    [savedSet],
  );
  const isListingHidden = useCallback(
    (listingId: string) => hiddenListingSet.has(listingId),
    [hiddenListingSet],
  );
  const isPersonHidden = useCallback(
    (personId: string) => hiddenPersonSet.has(personId),
    [hiddenPersonSet],
  );

  const getEvent = useCallback(
    (id: string) => events.find((e) => e.id === id),
    [events],
  );

  const ensureEvent = useCallback(async (id: string) => {
    const existing = events.find((e) => e.id === id);
    if (existing) return existing;
    try {
      const { event } = await api<{ event: CircleEvent }>(
        `/api/events/${encodeURIComponent(id)}`,
      );
      setEvents((prev) =>
        prev.some((row) => row.id === event.id)
          ? prev.map((row) => (row.id === event.id ? event : row))
          : [event, ...prev],
      );
      return event;
    } catch {
      return existing;
    }
  }, [events]);

  const addEvent = useCallback(async (input: NewEventInput) => {
    const { event } = await api<{ event: CircleEvent }>("/api/events", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setEvents((prev) => [event, ...prev.filter((e) => e.id !== event.id)]);
    return event.id;
  }, []);

  const toggleRsvp = useCallback(async (eventId: string) => {
    const { event } = await api<{ event: CircleEvent }>(
      `/api/events/${encodeURIComponent(eventId)}/rsvp`,
      { method: "POST" },
    );
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? event : e)),
    );
  }, []);

  const isAttending = useCallback(
    (eventId: string) =>
      events.find((e) => e.id === eventId)?.attendees.includes("me") ?? false,
    [events],
  );

  const completeLogin = useCallback(
    async (user: SessionUser) => {
      applyUserLocal(user);
      setCircleReady(false);
      setCircleFull(false);
      void fillHome();
    },
    [applyUserLocal, fillHome],
  );

  const setShowOwnListingsInFeed = useCallback(async (value: boolean) => {
    setShowOwnFeedState(value);
    try {
      await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ showOwnListingsInFeed: value }),
      });
    } catch (err) {
      setShowOwnFeedState(!value);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // cookie clear still happens locally
    }
    setSessionPhone(null);
    setMeServerId(null);
    setProfileCompletedAt(null);
    setMeProfile(blankMe());
    setInvites([]);
    setJoinRequests([]);
    setAddedYou([]);
    setNetworkLinks([]);
    setPeople(networkSeed());
    setListings([]);
    setRequests([]);
    setOffers([]);
    setEvents([]);
    setSaved([]);
    setHiddenListings([]);
    setHiddenPeople([]);
    setListingNotes({});
    setMessages([]);
    setArchivedThreads([]);
    setPinnedThreads([]);
    setDeletedThreads([]);
    setShowOwnFeedState(true);
    setCircleReady(true);
    setCircleFull(false);
    invalidateApiCache();
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      me: meProfile,
      people,
      listings,
      requests,
      offers,
      messages,
      events,
      saved,
      hiddenListings,
      hiddenPeople,
      listingNotes,
      archivedThreads,
      pinnedThreads,
      invites,
      joinRequests,
      addedYou,
      networkLinks,
      sessionPhone,
      hydrated,
      circleReady,
      circleFull,
      showOwnListingsInFeed,
      setShowOwnListingsInFeed,
      profileCompletedAt,
      getPerson,
      getListing,
      ensureListing,
      getRequest,
      ensureRequest,
      getEvent,
      ensureEvent,
      addEvent,
      toggleRsvp,
      isAttending,
      getOffers,
      hasOffered,
      getThread,
      threadIndex,
      threadPeers,
      unreadCount,
      refreshInbox: loadMessages,
      totalUnread,
      addMessage,
      referListing,
      revealListingIdentity,
      markThreadRead,
      archiveThread,
      unarchiveThread,
      isThreadArchived,
      togglePinThread,
      isThreadPinned,
      deleteThread,
      addPerson,
      createInvite,
      createWaveFromPending,
      getInvite,
      acceptInvite,
      acceptJoinRequest,
      rejectJoinRequest,
      revokeInvite,
      placePersonInMyCircle,
      completeProfile,
      addToCircle,
      removePerson,
      setLevel,
      setRelation,
      addListing,
      updateListing,
      setListingDealStatus,
      deleteListing,
      setMyListingEndorsement,
      setListingEndorsementHidden,
      addRequest,
      addOffer,
      withdrawOffer,
      toggleSaved,
      toggleHiddenListing,
      toggleHiddenPerson,
      setListingNote,
      isSaved,
      isListingHidden,
      isPersonHidden,
      completeLogin,
      signOut,
      meServerId,
      refreshCircle: loadCircle,
      ensureCircleRoster,
      refreshGraph: loadGraph,
      updateProfile,
    }),
    [
      meProfile,
      people,
      listings,
      requests,
      offers,
      messages,
      events,
      saved,
      hiddenListings,
      hiddenPeople,
      listingNotes,
      archivedThreads,
      pinnedThreads,
      invites,
      joinRequests,
      addedYou,
      networkLinks,
      sessionPhone,
      hydrated,
      circleReady,
      circleFull,
      showOwnListingsInFeed,
      setShowOwnListingsInFeed,
      profileCompletedAt,
      getPerson,
      getListing,
      ensureListing,
      getRequest,
      ensureRequest,
      getEvent,
      ensureEvent,
      addEvent,
      toggleRsvp,
      isAttending,
      getOffers,
      hasOffered,
      getThread,
      threadIndex,
      threadPeers,
      unreadCount,
      loadMessages,
      totalUnread,
      addMessage,
      referListing,
      revealListingIdentity,
      markThreadRead,
      archiveThread,
      unarchiveThread,
      isThreadArchived,
      togglePinThread,
      isThreadPinned,
      deleteThread,
      addPerson,
      createInvite,
      createWaveFromPending,
      getInvite,
      acceptInvite,
      acceptJoinRequest,
      rejectJoinRequest,
      revokeInvite,
      placePersonInMyCircle,
      completeProfile,
      addToCircle,
      removePerson,
      setLevel,
      setRelation,
      addListing,
      updateListing,
      setListingDealStatus,
      deleteListing,
      setMyListingEndorsement,
      setListingEndorsementHidden,
      addRequest,
      addOffer,
      withdrawOffer,
      toggleSaved,
      toggleHiddenListing,
      toggleHiddenPerson,
      setListingNote,
      isSaved,
      isListingHidden,
      isPersonHidden,
      completeLogin,
      signOut,
      meServerId,
      loadCircle,
      ensureCircleRoster,
      loadGraph,
      updateProfile,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

/** Full store — re-renders whenever any slice changes (legacy call sites). */
export function useStore(): StoreValue;
/** Selected slice — re-renders only when the selected value changes (Object.is). */
export function useStore<T>(selector: (s: StoreValue) => T): T;
export function useStore<T>(selector?: (s: StoreValue) => T): StoreValue | T {
  return useContextSelector(StoreContext, (s) => {
    if (!s) throw new Error("useStore must be used within StoreProvider");
    return selector ? selector(s) : s;
  });
}
