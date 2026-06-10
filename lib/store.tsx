"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LISTINGS, ME, PEOPLE } from "./mock-data";
import type {
  BadgeType,
  Listing,
  ListingType,
  Person,
  Privacy,
  RelationType,
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

interface StoreValue {
  me: Person;
  people: Person[];
  listings: Listing[];
  getPerson: (id: string) => Person | undefined;
  getListing: (id: string) => Listing | undefined;
  addPerson: (input: NewPersonInput) => void;
  removePerson: (id: string) => void;
  setLevel: (id: string, level: TrustLevel) => void;
  addListing: (input: NewListingInput) => string;
  toggleEndorsement: (listingId: string, type: BadgeType) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const STORAGE_KEY = "circle-store-v1";

const AVATAR_POOL = ["🧑", "👩", "🧔", "👨", "👵", "👴", "🧑‍🦱", "👩‍🦰", "🧑‍🦲", "👨‍🦳"];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>(PEOPLE);
  const [listings, setListings] = useState<Listing[]>(LISTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Load any persisted state on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.people)) setPeople(data.people);
        if (Array.isArray(data.listings)) setListings(data.listings);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ people, listings }));
    } catch {
      // ignore quota errors
    }
  }, [people, listings, hydrated]);

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

  const value = useMemo<StoreValue>(
    () => ({
      me: ME,
      people,
      listings,
      getPerson,
      getListing,
      addPerson,
      removePerson,
      setLevel,
      addListing,
      toggleEndorsement,
    }),
    [
      people,
      listings,
      getPerson,
      getListing,
      addPerson,
      removePerson,
      setLevel,
      addListing,
      toggleEndorsement,
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
