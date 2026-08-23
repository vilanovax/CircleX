export const WATCH_KIND = {
  phrase: "phrase",
  person: "person",
} as const;

export type WatchKind = (typeof WATCH_KIND)[keyof typeof WATCH_KIND];

export const WATCH_PHRASE_MIN = 3;
export const WATCH_PHRASE_MAX = 40;
export const WATCH_PHRASE_CAP = 5;
export const WATCH_PERSON_CAP = 5;
export const WATCH_HIT_PER_DAY = 3;

export function normalizeWatchPhrase(raw: string): string {
  return raw
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseWatchPhrase(
  raw: unknown,
): { ok: true; phrase: string; phraseNorm: string } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "عبارت را بنویس" };
  }
  const phrase = raw.replace(/\s+/g, " ").trim();
  const phraseNorm = normalizeWatchPhrase(phrase);
  if (phraseNorm.length < WATCH_PHRASE_MIN) {
    return { ok: false, error: "عبارت حداقل سه حرف باشد" };
  }
  if (phraseNorm.length > WATCH_PHRASE_MAX) {
    return { ok: false, error: "عبارت خیلی بلند است" };
  }
  return { ok: true, phrase: phrase.slice(0, WATCH_PHRASE_MAX), phraseNorm };
}

export function listingSearchBlob(title: string, description: string): string {
  return normalizeWatchPhrase(`${title} ${description}`);
}

export function phraseMatchesListing(
  phraseNorm: string,
  title: string,
  description: string,
): boolean {
  if (!phraseNorm) return false;
  return listingSearchBlob(title, description).includes(phraseNorm);
}

export function pickBestPhraseWatch<T extends { phraseNorm: string; createdAt: Date | string }>(
  title: string,
  description: string,
  watches: T[],
): T | null {
  const blob = listingSearchBlob(title, description);
  let best: T | null = null;
  for (const watch of watches) {
    if (!watch.phraseNorm || !blob.includes(watch.phraseNorm)) continue;
    if (!best) {
      best = watch;
      continue;
    }
    if (watch.phraseNorm.length > best.phraseNorm.length) {
      best = watch;
      continue;
    }
    if (watch.phraseNorm.length === best.phraseNorm.length) {
      const a = new Date(watch.createdAt).getTime();
      const b = new Date(best.createdAt).getTime();
      if (a < b) best = watch;
    }
  }
  return best;
}
