import type { Listing, ListingType } from "./types";

export type BuyerPrompt = {
  id: string;
  label: string;
  /** Prefill text for the message composer. */
  draft: string;
};

const COMMON: BuyerPrompt[] = [
  {
    id: "available",
    label: "هنوز موجوده؟",
    draft: "سلام، هنوز موجوده؟",
  },
  {
    id: "visit",
    label: "بازدید؟",
    draft: "سلام، امکان بازدید با هماهنگی هست؟",
  },
  {
    id: "final-price",
    label: "قیمت نهایی؟",
    draft: "سلام، قیمت نهایی چقدره؟ کمی قابل مذاکره است؟",
  },
];

function hasSpec(listing: Listing, label: string): boolean {
  return (listing.specs ?? []).some((s) => s.label === label);
}

/** Ready questions for buyers — prefer gaps in structured specs. */
export function listingBuyerPrompts(listing: Listing): BuyerPrompt[] {
  const out: BuyerPrompt[] = [];
  const type: ListingType = listing.type;

  if (type === "sale" || type === "exchange" || type === "loan") {
    if (!hasSpec(listing, "ابعاد")) {
      out.push({
        id: "dimensions",
        label: "ابعاد؟",
        draft: "سلام، ابعاد دقیق چقدره؟",
      });
    }
    if (!hasSpec(listing, "ایراد اعلام‌شده") && !hasSpec(listing, "وضعیت")) {
      out.push({
        id: "defects",
        label: "ایراد؟",
        draft: "سلام، ایراد یا خط و خشی داره که بدونم؟",
      });
    }
    if (!hasSpec(listing, "ارسال")) {
      out.push({
        id: "shipping",
        label: "ارسال؟",
        draft: "سلام، ارسال هم می‌کنید یا فقط حضوری؟",
      });
    }
    if (!hasSpec(listing, "بازدید")) {
      out.push({
        id: "visit-gap",
        label: "بازدید؟",
        draft: "سلام، امکان بازدید با هماهنگی هست؟",
      });
    }
  }

  if (type === "service") {
    out.push({
      id: "schedule",
      label: "زمان‌بندی؟",
      draft: "سلام، نزدیک‌ترین زمان خالی‌تون کیه؟",
    });
  }

  if (type === "donation") {
    out.push({
      id: "pickup",
      label: "تحویل؟",
      draft: "سلام، چطور می‌تونم تحویل بگیرم؟",
    });
  }

  for (const c of COMMON) {
    if (out.some((p) => p.id === c.id || p.label === c.label)) continue;
    if (c.id === "final-price" && listing.price == null) continue;
    if (c.id === "visit" && hasSpec(listing, "بازدید")) continue;
    out.push(c);
  }

  return out.slice(0, 4);
}

/** Spec rows that buyers often need but seller left blank — for «از فروشنده بپرس». */
export function listingMissingSpecPrompts(listing: Listing): BuyerPrompt[] {
  return listingBuyerPrompts(listing).filter((p) =>
    ["dimensions", "defects", "shipping", "visit-gap"].includes(p.id),
  );
}
