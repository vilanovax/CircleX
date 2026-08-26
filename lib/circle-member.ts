import type { Person, RelationType } from "./types";

export const CIRCLE_RELATION_ORDER: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

/** True when this person counts in the viewer's live circle (not a pending invite). */
export function isActiveCircleMember(person: Person): boolean {
  return person.inMyCircle && person.inviteStatus !== "pending";
}

/** Fresh joiners whose trust slot has not been confirmed since the edge was created. */
export const UNPLACED_MS = 14 * 24 * 60 * 60 * 1000;

export function isUnplacedMember(person: Person, now = Date.now()): boolean {
  if (!isActiveCircleMember(person)) return false;
  if (person.trustTouched) return false;
  if (!person.joinedAt) return false;
  const age = now - new Date(person.joinedAt).getTime();
  return age >= 0 && age < UNPLACED_MS;
}

export function unplacedMembers(people: Person[], now = Date.now()): Person[] {
  return people.filter((p) => isUnplacedMember(p, now));
}

/** First live member name — for first-listing copy after the circle opens. */
export function firstLiveMemberName(people: Person[]): string {
  for (let i = 0; i < people.length; i++) {
    if (isActiveCircleMember(people[i])) return people[i].name;
  }
  return "";
}

const activeCircleByRoster = new WeakMap<Person[], Person[]>();

export function activeCircle(people: Person[]): Person[] {
  const cached = activeCircleByRoster.get(people);
  if (cached) return cached;
  const next: Person[] = [];
  for (let i = 0; i < people.length; i++) {
    if (isActiveCircleMember(people[i])) next.push(people[i]);
  }
  activeCircleByRoster.set(people, next);
  return next;
}

export function activeCircleCount(people: Person[]): number {
  let n = 0;
  for (const p of people) if (isActiveCircleMember(p)) n += 1;
  return n;
}

/** Keep the previous object when roster fields did not change. */
export function reusePerson(prev: Person | undefined, next: Person): Person {
  if (!prev) return next;
  if (
    prev.name === next.name &&
    prev.avatar === next.avatar &&
    prev.relation === next.relation &&
    prev.level === next.level &&
    prev.note === next.note &&
    prev.deals === next.deals &&
    prev.city === next.city &&
    prev.inMyCircle === next.inMyCircle &&
    prev.inviteStatus === next.inviteStatus &&
    prev.trustTouched === next.trustTouched &&
    prev.joinedAt === next.joinedAt &&
    prev.phone === next.phone &&
    prev.phoneNormalized === next.phoneNormalized
  ) {
    return prev;
  }
  return next;
}

/** Reuse previous array + row objects when a reload returns the same roster. */
export function reusePeopleList(prev: Person[], next: Person[]): Person[] {
  if (prev.length === 0) return next;
  if (next.length === 0) return next;
  const prevById = new Map(prev.map((p) => [p.id, p]));
  let identical = prev.length === next.length;
  const out = new Array<Person>(next.length);
  for (let i = 0; i < next.length; i++) {
    const row = next[i];
    const reused = reusePerson(prevById.get(row.id), row);
    out[i] = reused;
    if (identical && reused !== prev[i]) identical = false;
  }
  return identical ? prev : out;
}

export type CircleRelationGroup = {
  relation: RelationType;
  members: Person[];
  preview: Person[];
};

const PREVIEW_CAP = 6;

/** One pass over active members, sorted, with a stable preview slice. */
export function groupActiveCircle(
  people: Person[],
  previewCap = PREVIEW_CAP,
): CircleRelationGroup[] {
  const buckets: Record<RelationType, Person[]> = {
    family: [],
    friend: [],
    colleague: [],
    neighbor: [],
    acquaintance: [],
  };
  for (const p of people) {
    if (!isActiveCircleMember(p)) continue;
    buckets[p.relation].push(p);
  }
  const groups: CircleRelationGroup[] = [];
  for (const relation of CIRCLE_RELATION_ORDER) {
    const members = buckets[relation];
    if (members.length === 0) continue;
    members.sort((a, b) => a.name.localeCompare(b.name, "fa"));
    groups.push({
      relation,
      members,
      preview:
        members.length <= previewCap
          ? members
          : members.slice(0, previewCap),
    });
  }
  return groups;
}
