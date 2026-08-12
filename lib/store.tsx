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
import { isListingPhoto } from "./listing-image";
import {
  EVENTS,
  LISTINGS,
  ME,
  MESSAGES,
  OFFERS,
  PEOPLE,
  REQUESTS,
} from "./mock-data";
import type {
  BadgeType,
  CircleEvent,
  EventKind,
  Listing,
  ListingType,
  Message,
  Offer,
  Person,
  Privacy,
  RelationType,
  Request,
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
  /** Null until mock phone/OTP login succeeds. */
  sessionPhone: string | null;
  onboarded: boolean;
  hydrated: boolean;
  getPerson: (id: string) => Person | undefined;
  getListing: (id: string) => Listing | undefined;
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
  /** Mark an existing network person as part of my circle. */
  addToCircle: (
    id: string,
    input: { level: TrustLevel; relation?: RelationType; note?: string },
  ) => void;
  removePerson: (id: string) => void;
  setLevel: (id: string, level: TrustLevel) => void;
  addListing: (input: NewListingInput) => string;
  setListingDealStatus: (
    listingId: string,
    status: NonNullable<Listing["dealStatus"]>,
  ) => void;
  toggleEndorsement: (listingId: string, type: BadgeType) => void;
  addRequest: (input: NewRequestInput) => string;
  addOffer: (input: NewOfferInput) => void;
  withdrawOffer: (requestId: string) => void;
  toggleSaved: (listingId: string) => void;
  isSaved: (listingId: string) => boolean;
  completeOnboarding: () => void;
  /** Mark session authenticated after mock OTP (sample code 12345). */
  completeLogin: (phone: string) => void;
  signOut: () => void;
  updateProfile: (input: Partial<Pick<Person, "name" | "avatar" | "city">>) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const STORAGE_KEY = "circle-store-v2";

const AVATAR_POOL = AVATAR_IMAGES;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [meProfile, setMeProfile] = useState<Person>(ME);
  const [people, setPeople] = useState<Person[]>(PEOPLE);
  const [listings, setListings] = useState<Listing[]>(LISTINGS);
  const [requests, setRequests] = useState<Request[]>(REQUESTS);
  const [offers, setOffers] = useState<Offer[]>(OFFERS);
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [events, setEvents] = useState<CircleEvent[]>(EVENTS);
  const [saved, setSaved] = useState<string[]>([]);
  const [sessionPhone, setSessionPhone] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load any persisted state on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.me && typeof data.me === "object") setMeProfile(data.me);
        if (Array.isArray(data.people)) setPeople(data.people);
        if (Array.isArray(data.listings)) {
          setListings(
            data.listings.map((l: Listing) => {
              const seed = LISTINGS.find((s) => s.id === l.id);
              if (!seed) return l;
              return {
                ...l,
                image: isListingPhoto(l.image) ? l.image : seed.image,
                images: l.images?.length ? l.images : seed.images,
                specs: seed.specs ?? l.specs,
                description: seed.description,
                condition: seed.condition ?? l.condition,
              };
            }),
          );
        }
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
        // New field; migrate prior demos that already finished onboarding.
        if (typeof data.sessionPhone === "string" && data.sessionPhone.length > 0) {
          setSessionPhone(data.sessionPhone);
        } else if (data.onboarded) {
          setSessionPhone("09121234567");
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist on change (after first hydration so we don't overwrite with defaults).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          me: meProfile,
          people,
          listings,
          requests,
          offers,
          messages,
          events,
          saved,
          sessionPhone,
          onboarded,
        }),
      );
    } catch {
      // ignore quota errors
    }
  }, [
    meProfile,
    people,
    listings,
    requests,
    offers,
    messages,
    events,
    saved,
    sessionPhone,
    onboarded,
    hydrated,
  ]);

  const getPerson = useCallback(
    (id: string) => (id === "me" ? meProfile : people.find((p) => p.id === id)),
    [meProfile, people],
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
      const id = `p_${prev.length + 1}_${input.name}`;
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
      };
      return [person, ...prev];
    });
  }, []);

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

  const setLevel = useCallback((id: string, level: TrustLevel) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, level } : p)),
    );
  }, []);

  const addListing = useCallback((input: NewListingInput) => {
    const id = `new_${Date.now()}`;
    const listing: Listing = {
      id,
      title: input.title,
      description: input.description,
      type: input.type,
      price: input.price,
      category: input.category,
      image: input.image,
      images: input.images,
      specs: input.specs,
      condition: input.condition,
      sellerId: "me",
      postedAt: "همین حالا",
      privacy: input.privacy,
      endorsements: [],
      trustPath: [],
      city: ME.city,
    };
    setListings((prev) => [listing, ...prev]);
    return id;
  }, []);

  const setListingDealStatus = useCallback(
    (listingId: string, status: NonNullable<Listing["dealStatus"]>) => {
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, dealStatus: status } : l)),
      );
    },
    [],
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

  const completeLogin = useCallback((phone: string) => {
    setSessionPhone(phone);
  }, []);

  const signOut = useCallback(() => {
    setSessionPhone(null);
    setOnboarded(false);
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
      sessionPhone,
      onboarded,
      hydrated,
      getPerson,
      getListing,
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
      addToCircle,
      removePerson,
      setLevel,
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
      updateProfile,
    }),
    [
      people,
      listings,
      requests,
      offers,
      messages,
      events,
      saved,
      sessionPhone,
      onboarded,
      hydrated,
      getPerson,
      getListing,
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
      addToCircle,
      removePerson,
      setLevel,
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
      updateProfile,
      meProfile,
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
