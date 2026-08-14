import type { Person } from "./types";

/** True when this person counts in the viewer's live circle (not a pending invite). */
export function isActiveCircleMember(person: Person): boolean {
  return person.inMyCircle && person.inviteStatus !== "pending";
}

export function activeCircle(people: Person[]): Person[] {
  return people.filter(isActiveCircleMember);
}