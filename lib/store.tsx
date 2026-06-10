"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LISTINGS, ME, PEOPLE, REQUESTS } from "./mock-data";
import type {
  BadgeType,
  Listing,
  ListingType,
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
  privacy: Privacy;
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

interface StoreValue {
  me: Person;
  people: Person[];
  listings: Listing[];
  requests: Request[];
  saved: string[];
  onboarded: boolean;
  hydrated: boolean;
  getPerson: (id: string) => Person | undefined;
  getListing: (id: string) => Listing | undefined;
  addPerson: (input: NewPersonInput) => void;
  removePerson: (id: string) => void;
  setLevel: (id: string, level: TrustLevel) => void;
  addListing: (input: NewListingInput) => string;
  toggleEndorsement: (listingId: string, type: BadgeType) => void;
  addRequest: (input: NewRequestInput) => string;
  toggleSaved: (listingId: string) => void;
  isSaved: (listingId: string) => boolean;
  completeOnboarding: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const STORAGE_KEY = "circle-store-v1";

const AVATAR_POOL = ["🧑", "👩", "🧔", "👨", "👵", "👴", "🧑‍🦱", "👩‍🦰", "🧑‍🦲", "👨‍🦳"];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>(PEOPLE);
  const [listings, setListings] = useState<Listing[]>(LISTINGS);
  const [requests, setRequests] = useState<Request[]>(REQUESTS);
  const [saved, setSaved] = useState<string[]>([]);
  const [onboarded, setOnboarded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load any persisted state on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.people)) setPeople(data.people);
        if (Array.isArray(data.listings)) setListings(data.listings);
        if (Array.isArray(data.requests)) setRequests(data.requests);
        if (Array.isArray(data.saved)) setSaved(data.saved);
        if (typeof data.onboarded === "boolean") setOnboarded(data.onboarded);
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
        JSON.stringify({ people, listings, requests, saved, onboarded }),
      );
    } catch {
      // ignore quota errors
    }
  }, [people, listings, requests, saved, onboarded, hydrated]);

  const getPerson = useCallback(
    (id: string) => (id === "me" ? ME : people.find((p) => p.id === id)),
    [people],
  );

  const getListing = useCallback(
    (id: string) => listings.find((l) => l.id === id),
    [listings],
  );

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
      city: ME.city,
    };
    setRequests((prev) => [request, ...prev]);
    return id;
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

  const completeOnboarding = useCallback(() => setOnboarded(true), []);

  const value = useMemo<StoreValue>(
    () => ({
      me: ME,
      people,
      listings,
      requests,
      saved,
      onboarded,
      hydrated,
      getPerson,
      getListing,
      addPerson,
      removePerson,
      setLevel,
      addListing,
      toggleEndorsement,
      addRequest,
      toggleSaved,
      isSaved,
      completeOnboarding,
    }),
    [
      people,
      listings,
      requests,
      saved,
      onboarded,
      hydrated,
      getPerson,
      getListing,
      addPerson,
      removePerson,
      setLevel,
      addListing,
      toggleEndorsement,
      addRequest,
      toggleSaved,
      isSaved,
      completeOnboarding,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
