/** Where a profile was opened from — back leaves to that surface, not history. */
export type PersonArrival =
  | "circle"
  | "home"
  | "messages"
  | "listing"
  | "graph"
  | "profile";

export function personHref(id: string, from?: PersonArrival): string {
  const path = `/person/${encodeURIComponent(id)}`;
  return from ? `${path}?from=${from}` : path;
}

export function personBackHref(
  from: string | null | undefined,
  inCircle: boolean,
): string {
  if (from === "circle" || from === "graph") return "/circle";
  if (from === "messages") return "/messages";
  if (from === "listing" || from === "home" || from === "profile") return "/";
  return inCircle ? "/circle" : "/";
}
