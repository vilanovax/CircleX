/** After publish, home reads this so the new listing can sit at the top. */
export const POSTED_QUERY = "posted";

export function postedHomeHref(id: string): string {
  return `/?${POSTED_QUERY}=${encodeURIComponent(id)}`;
}
