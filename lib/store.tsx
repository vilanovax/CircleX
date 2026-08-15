"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createContext, useContextSelector } from "use-context-selector";
import { AVATAR_IMAGES } from "./avatar";
import { api, ApiError } from "./api";
import { newUuid } from "./invite";
import {
  EVENTS,
  ME,
  MESSAGES,
  OFFERS,
  PEOPLE,
  REQUESTS,
} from "./mock-data";
import type {
  BadgeType,
  CircleEvent,
  CircleJoinRequest,
  EventKind,
  Invite,
  Listing,
  ListingType,
  Message,
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
  condition?: string;
  specs?: Listing["specs"];
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
  privacy: Privacy;
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
  invites: Invite[];
  joinRequests: CircleJoinRequest[];
  /** Null until mock phone/OTP login succeeds. */
  sessionPhone: string | null;
  onboarded: boolean;
  hydrated: boolean;
  profileCompletedAt: string | null;
  getPerson: (id: string) => Person | undefined;
  getListing: (id: string) => Listing | undefined;
  ensureListing: (id: string) => Promise<Listing | undefined>;
  getRequest: (id: string) => Request | undefined;
  getEvent: (id: string) => CircleEvent | undefined;
  addEvent: (input: NewEventInput) => string;
  toggleRsvp: (eventId: string) => void;
  isAttending: (eventId: string) => boolean;
  getOffers: (requestId: string) => Offer[];
  hasOffered: (requestId: string) => boolean;
  getThread: (peerId: string) => Message[];
  threadPeers: () => string[];
  unreadCount: (peerId: string) => number;
  totalUnread: () => number;
  addMessage: (peerId: string, text: string) => void;
  referListing: (peerId: string, listingId: string, note?: string) => void;
  markThreadRead: (peerId: string) => void;
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
  /** Mark an existing network person as part of my circle. */
  addToCircle: (
    id: string,
    input: { level: TrustLevel; relation?: RelationType; note?: string },
  ) => void;
  removePerson: (id: string) => void;
  setLevel: (id: string, level: TrustLevel) => void;
  setRelation: (id: string, relation: RelationType) => void;
  addListing: (input: NewListingInput) => Promise<string>;
  setListingDealStatus: (
    listingId: string,
    status: NonNullable<Listing["dealStatus"]>,
  ) => Promise<void>;
  toggleEndorsement: (listingId: string, type: BadgeType) => void;
  addRequest: (input: NewRequestInput) => string;
  addOffer: (input: NewOfferInput) => void;
  withdrawOffer: (requestId: string) => void;
  toggleSaved: (listingId: string) => void;
  isSaved: (listingId: string) => boolean;
  completeOnboarding: () => void;
  /** Apply the server user after OTP verify. */
  completeLogin: (user: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
  meServerId: string | null;
  refreshCircle: () => Promise<void>;
  updateProfile: (input: Partial<Pick<Person, "name" | "avatar" | "city">>) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const STORAGE_KEY = "circle-store-v2";
const SCHEMA_VERSION = 5;

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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [meProfile, setMeProfile] = useState<Person>(blankMe);
  const [people, setPeople] = useState<Person[]>(networkSeed);
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<Request[]>(REQUESTS);
  const [offers, setOffers] = useState<Offer[]>(OFFERS);
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [events, setEvents] = useState<CircleEvent[]>(EVENTS);
  const [saved, setSaved] = useState<string[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [joinRequests, setJoinRequests] = useState<CircleJoinRequest[]>([]);
  const [sessionPhone, setSessionPhone] = useState<string | null>(null);
  const [meServerId, setMeServerId] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [profileCompletedAt, setProfileCompletedAt] = useState<string | null>(
    null,
  );

  const applyUserLocal = useCallback((user: SessionUser) => {
    setMeServerId(user.id);
    setSessionPhone(user.phoneNormalized);
    setProfileCompletedAt(user.profileCompletedAt);
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

  const loadCircle = useCallback(async () => {
    const data = await api<{
      members: Person[];
      pending: Invite[];
      pendingPeople: Person[];
      listings?: Listing[];
      joinRequests?: CircleJoinRequest[];
    }>("/api/circle");
    setInvites(data.pending);
    setJoinRequests(data.joinRequests ?? []);
    setPeople(() => {
      const overlayIds = new Set([
        ...data.members.map((m) => m.id),
        ...data.pendingPeople.map((p) => p.id),
      ]);
      const seed = networkSeed().filter((p) => !overlayIds.has(p.id));
      return [...data.members, ...data.pendingPeople, ...seed];
    });
    setListings(data.listings ?? []);
  }, []);

  // Load persisted marketplace state, then overlay the cookie session.
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (Array.isArray(data.people)) {
            const restored = (data.people as Person[])
              .map((p) => {
                const seed = PEOPLE.find((s) => s.id === p.id);
                if (seed) {
                  return {
                    ...p,
                    avatar: seed.avatar,
                    name: seed.name,
                    note: seed.note ?? p.note,
                    inMyCircle: false,
                    inviteStatus: undefined,
                  };
                }
                if (p.inviteStatus === "pending") return null;
                return p;
              })
              .filter((p): p is Person => Boolean(p));
            if (!cancelled) setPeople(restored.length ? restored : networkSeed());
          }
          // Listings live on Postgres; local cache is ignored.
          if (Array.isArray(data.requests)) {
            setRequests(
              data.requests.map((r: Request) => ({
                ...r,
                endorsements: r.endorsements ?? [],
              })),
            );
          }
          if (Array.isArray(data.offers)) setOffers(data.offers);
          if (Array.isArray(data.messages)) setMessages(data.messages);
          if (Array.isArray(data.events)) {
            setEvents(
              data.events.map((e: CircleEvent) => ({
                ...e,
                endorsements: e.endorsements ?? [],
              })),
            );
          }
          if (Array.isArray(data.saved)) setSaved(data.saved);
          if (typeof data.onboarded === "boolean") setOnboarded(data.onboarded);
        }
      } catch {
        // ignore corrupt storage
      }

      try {
        const { user } = await api<{ user: SessionUser }>("/api/me");
        if (cancelled) return;
        applyUserLocal(user);
        await loadCircle();
      } catch {
        if (cancelled) return;
        setSessionPhone(null);
        setMeServerId(null);
        setProfileCompletedAt(null);
        setMeProfile(blankMe());
        setInvites([]);
        setJoinRequests([]);
        setPeople(networkSeed());
        setListings([]);
      }
      if (!cancelled) setHydrated(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [applyUserLocal, loadCircle]);

  // Persist marketplace slices only — identity lives on the server cookie.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          schemaVersion: SCHEMA_VERSION,
          people,
          requests,
          offers,
          messages,
          events,
          saved,
          onboarded,
        }),
      );
    } catch {
      // ignore quota errors
    }
  }, [
    people,
    requests,
    offers,
    messages,
    events,
    saved,
    onboarded,
    hydrated,
  ]);

  useEffect(() => {
    if (!hydrated || !sessionPhone) return;
    const onVis = () => {
      if (document.visibilityState === "visible") void loadCircle();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [hydrated, sessionPhone, loadCircle]);

  const getPerson = useCallback(
    (id: string) =>
      id === "me" || (meServerId && id === meServerId)
        ? meProfile
        : people.find((p) => p.id === id),
    [meProfile, meServerId, people],
  );

  const updateProfile = useCallback(
    (input: Partial<Pick<Person, "name" | "avatar" | "city">>) => {
      setMeProfile((prev) => ({ ...prev, ...input }));
    },
    [],
  );

  const getListing = useCallback(
    (id: string) => listings.find((l) => l.id === id),
    [listings],
  );

  const ensureListing = useCallback(async (id: string) => {
    const existing = listings.find((l) => l.id === id);
    if (existing) return existing;
    try {
      const { listing } = await api<{ listing: Listing }>(
        `/api/listings/${encodeURIComponent(id)}`,
      );
      setListings((prev) =>
        prev.some((row) => row.id === listing.id)
          ? prev
          : [listing, ...prev],
      );
      return listing;
    } catch {
      return undefined;
    }
  }, [listings]);

  const getRequest = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests],
  );

  const getOffers = useCallback(
    (requestId: string) => offers.filter((o) => o.requestId === requestId),
    [offers],
  );

  const hasOffered = useCallback(
    (requestId: string) =>
      offers.some((o) => o.requestId === requestId && o.fromId === "me"),
    [offers],
  );

  const getThread = useCallback(
    (peerId: string) => messages.filter((msg) => msg.peerId === peerId),
    [messages],
  );

  // Peers ordered most-recently-active first (by last message index).
  const threadPeers = useCallback(() => {
    const lastIndex = new Map<string, number>();
    messages.forEach((msg, i) => lastIndex.set(msg.peerId, i));
    return Array.from(lastIndex.keys()).sort(
      (a, b) => (lastIndex.get(b) ?? 0) - (lastIndex.get(a) ?? 0),
    );
  }, [messages]);

  const unreadCount = useCallback(
    (peerId: string) =>
      messages.filter((msg) => msg.peerId === peerId && !msg.fromMe && !msg.read)
        .length,
    [messages],
  );

  const totalUnread = useCallback(
    () => messages.filter((msg) => !msg.fromMe && !msg.read).length,
    [messages],
  );

  const addMessage = useCallback((peerId: string, text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        peerId,
        fromMe: true,
        text,
        postedAt: "همین حالا",
        read: true,
      },
    ]);
  }, []);

  // Refer a listing to someone in the trust network (an in-DM recommendation).
  const referListing = useCallback(
    (peerId: string, listingId: string, note?: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          peerId,
          fromMe: true,
          text: note?.trim() || "این آگهی رو دیدم، فکر کردم مناسبت باشه 👇",
          postedAt: "همین حالا",
          read: true,
          listingId,
        },
      ]);
    },
    [],
  );

  const markThreadRead = useCallback((peerId: string) => {
    setMessages((prev) => {
      // Avoid a state update (and re-render loop) when nothing is unread.
      if (!prev.some((msg) => msg.peerId === peerId && !msg.read)) return prev;
      return prev.map((msg) =>
        msg.peerId === peerId ? { ...msg, read: true } : msg,
      );
    });
  }, []);

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
      await loadCircle();
      return invite;
    },
    [loadCircle],
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
      await loadCircle();
      return invite;
    },
    [invites, loadCircle],
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
        await loadCircle();
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
    [loadCircle],
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
      await loadCircle();
    },
    [loadCircle],
  );

  const rejectJoinRequest = useCallback(
    async (id: string) => {
      await api(`/api/circle/requests/${encodeURIComponent(id)}/reject`, {
        method: "POST",
      });
      await loadCircle();
    },
    [loadCircle],
  );

  const revokeInvite = useCallback(
    async (id: string) => {
      await api(`/api/invites/${encodeURIComponent(id)}/revoke`, {
        method: "POST",
      });
      await loadCircle();
    },
    [loadCircle],
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
      await loadCircle();
    },
    [loadCircle],
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
    (
      id: string,
      input: { level: TrustLevel; relation?: RelationType; note?: string },
    ) => {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                inMyCircle: true,
                inviteStatus: "joined" as const,
                level: input.level,
                relation: input.relation ?? p.relation,
                note: input.note ?? p.note,
              }
            : p,
        ),
      );
    },
    [],
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
        .then(() => loadCircle())
        .catch(() => {});
    },
    [loadCircle],
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
        await loadCircle();
      }
    },
    [loadCircle],
  );

  // Toggle MY endorsement of a listing (acting as the current user).
  const toggleEndorsement = useCallback(
    (listingId: string, type: BadgeType) => {
      setListings((prev) =>
        prev.map((l) => {
          if (l.id !== listingId) return l;
          const exists = l.endorsements.some(
            (e) => e.personId === "me" && e.type === type,
          );
          return {
            ...l,
            endorsements: exists
              ? l.endorsements.filter(
                  (e) => !(e.personId === "me" && e.type === type),
                )
              : [...l.endorsements, { personId: "me", type }],
          };
        }),
      );
    },
    [],
  );

  const addRequest = useCallback((input: NewRequestInput) => {
    const id = `req_${Date.now()}`;
    const request: Request = {
      id,
      title: input.title,
      description: input.description,
      category: input.category,
      image: input.image,
      requesterId: "me",
      postedAt: "همین حالا",
      budget: input.budget,
      privacy: input.privacy,
      trustPath: [],
      endorsements: [],
      city: ME.city,
    };
    setRequests((prev) => [request, ...prev]);
    return id;
  }, []);

  const addOffer = useCallback((input: NewOfferInput) => {
    setOffers((prev) => {
      // One offer per person per request — replace any existing "me" offer.
      const without = prev.filter(
        (o) => !(o.requestId === input.requestId && o.fromId === "me"),
      );
      const offer: Offer = {
        id: `offer_${Date.now()}`,
        requestId: input.requestId,
        fromId: "me",
        message: input.message,
        price: input.price,
        postedAt: "همین حالا",
      };
      return [offer, ...without];
    });
  }, []);

  const withdrawOffer = useCallback((requestId: string) => {
    setOffers((prev) =>
      prev.filter((o) => !(o.requestId === requestId && o.fromId === "me")),
    );
  }, []);

  const toggleSaved = useCallback((listingId: string) => {
    setSaved((prev) =>
      prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [listingId, ...prev],
    );
  }, []);

  const isSaved = useCallback(
    (listingId: string) => saved.includes(listingId),
    [saved],
  );

  const getEvent = useCallback(
    (id: string) => events.find((e) => e.id === id),
    [events],
  );

  const addEvent = useCallback((input: NewEventInput) => {
    const id = `event_${Date.now()}`;
    const event: CircleEvent = {
      id,
      title: input.title,
      description: input.description,
      kind: input.kind,
      image: input.image,
      hostId: "me",
      date: input.date,
      time: input.time,
      location: input.location,
      capacity: input.capacity,
      privacy: input.privacy,
      attendees: [],
      trustPath: [],
      endorsements: [],
      city: ME.city,
    };
    setEvents((prev) => [event, ...prev]);
    return id;
  }, []);

  const toggleRsvp = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const going = e.attendees.includes("me");
        return {
          ...e,
          attendees: going
            ? e.attendees.filter((a) => a !== "me")
            : [...e.attendees, "me"],
        };
      }),
    );
  }, []);

  const isAttending = useCallback(
    (eventId: string) =>
      events.find((e) => e.id === eventId)?.attendees.includes("me") ?? false,
    [events],
  );

  const completeOnboarding = useCallback(() => setOnboarded(true), []);

  const completeLogin = useCallback(
    async (user: SessionUser) => {
      applyUserLocal(user);
      try {
        await loadCircle();
      } catch {
        setPeople(networkSeed());
        setInvites([]);
        setJoinRequests([]);
      }
    },
    [applyUserLocal, loadCircle],
  );

  const signOut = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // cookie clear still happens locally
    }
    setSessionPhone(null);
    setMeServerId(null);
    setProfileCompletedAt(null);
    setOnboarded(false);
    setMeProfile(blankMe());
    setInvites([]);
    setJoinRequests([]);
    setPeople(networkSeed());
    setListings([]);
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
      invites,
      joinRequests,
      sessionPhone,
      onboarded,
      hydrated,
      profileCompletedAt,
      getPerson,
      getListing,
      ensureListing,
      getRequest,
      getEvent,
      addEvent,
      toggleRsvp,
      isAttending,
      getOffers,
      hasOffered,
      getThread,
      threadPeers,
      unreadCount,
      totalUnread,
      addMessage,
      referListing,
      markThreadRead,
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
      setListingDealStatus,
      toggleEndorsement,
      addRequest,
      addOffer,
      withdrawOffer,
      toggleSaved,
      isSaved,
      completeOnboarding,
      completeLogin,
      signOut,
      meServerId,
      refreshCircle: loadCircle,
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
      invites,
      joinRequests,
      sessionPhone,
      onboarded,
      hydrated,
      profileCompletedAt,
      getPerson,
      getListing,
      ensureListing,
      getRequest,
      getEvent,
      addEvent,
      toggleRsvp,
      isAttending,
      getOffers,
      hasOffered,
      getThread,
      threadPeers,
      unreadCount,
      totalUnread,
      addMessage,
      referListing,
      markThreadRead,
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
      setListingDealStatus,
      toggleEndorsement,
      addRequest,
      addOffer,
      withdrawOffer,
      toggleSaved,
      isSaved,
      completeOnboarding,
      completeLogin,
      signOut,
      meServerId,
      loadCircle,
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
