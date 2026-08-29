/** First-visit concept banner. Cleared from profile to show again. */
export const CONCEPT_TIP_KEY = "circle-home-concept-tip-v1";

/** Empty-circle first-run: what Circle is, before the invite sheet. */
export const FIRST_RUN_EXPLAIN_KEY = "circle-first-run-explain-v1";
export const HOW_QUERY = "how";

export function isConceptTipPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONCEPT_TIP_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markConceptTipSeen(): void {
  try {
    localStorage.setItem(CONCEPT_TIP_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isFirstRunExplainPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(FIRST_RUN_EXPLAIN_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markFirstRunExplainSeen(): void {
  try {
    localStorage.setItem(FIRST_RUN_EXPLAIN_KEY, "1");
  } catch {
    /* ignore */
  }
}
