import { draftListingFromText, type ListingDraft } from "./listing-draft";
import type { ListingType } from "./types";

/**
 * Local stand-in for model polish: cleaner title/narrative, never invents dimensions.
 * Softens over-optimistic condition when age contradicts it.
 */
export function createPolishedListingDraft(input: {
  text: string;
  type: ListingType;
  price?: number;
}): ListingDraft {
  const base = draftListingFromText(input);
  let title = base.title.replace(/\s+/g, " ").replace(/[،,]+$/g, "").trim();
  if (title.length > 56) title = `${title.slice(0, 54).trim()}…`;

  let description = base.description
    .replace(/\d+\s*[×xX]\s*\d+(?:\s*[×xX]\s*\d+)?\s*(?:سانتی\s*متر|سم)?/g, "")
    .replace(/باتری\s*[۰-۹0-9]+\s*٪?/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!description || description === title) {
    description =
      input.type === "service"
        ? "جزئیات خدمت را در پیام هماهنگ می‌کنیم."
        : "جزئیات را در پیام بپرسید؛ هماهنگی از همان‌جا.";
  }

  let condition = base.condition;
  const yearsSpec = base.specs.find((s) => s.label === "مدت استفاده");
  if (
    condition &&
    /در حد نو|بسیار کم/.test(condition) &&
    yearsSpec &&
    /[۳-۹3-9]|۱۰|ده/.test(yearsSpec.value)
  ) {
    condition = "سالم با ایراد جزئی";
  }

  return { ...base, title, description, condition };
}
