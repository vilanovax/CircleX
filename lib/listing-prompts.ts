import type { Listing, ListingType } from "./types";

export type BuyerPrompt = {
  id: string;
  label: string;
  /** Prefill text for the message composer. */
  draft: string;
};

function hasSpec(listing: Listing, label: string): boolean {
  return (listing.specs ?? []).some((s) => s.label === label);
}

function specValue(listing: Listing, label: string): string | undefined {
  return listing.specs?.find((s) => s.label === label)?.value;
}

function isBulky(listing: Listing): boolean {
  const blob = `${listing.category} ${listing.title} ${listing.description}`;
  return /مبل|یخچال|میز ناهار|تخت|کمد|فرش|لوازم خانه/.test(blob);
}

/**
 * Ready questions for buyers — skip anything already answered in specs.
 * Prefer transactional gaps over repeating published facts.
 */
export function listingBuyerPrompts(listing: Listing): BuyerPrompt[] {
  const out: BuyerPrompt[] = [];
  const type: ListingType = listing.type;

  out.push({
    id: "available",
    label: "هنوز موجوده؟",
    draft: "سلام، هنوز موجوده؟",
  });

  if (type === "sale" || type === "exchange" || type === "loan") {
    if (!hasSpec(listing, "ابعاد")) {
      out.push({
        id: "dimensions",
        label: "ابعاد؟",
        draft: "سلام، ابعاد دقیق چقدره؟",
      });
    }
    if (!hasSpec(listing, "ایراد اعلام‌شده") && !listing.condition) {
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
    } else {
      out.push({
        id: "when-visit",
        label: "چه زمانی ببینم؟",
        draft: "سلام، چه زمانی می‌تونم ببینمش؟",
      });
    }

    const negotiable = specValue(listing, "قابل مذاکره");
    if (
      listing.price != null &&
      !(negotiable && /بله|کمی/.test(negotiable))
    ) {
      out.push({
        id: "final-price",
        label: "قیمت نهایی؟",
        draft: "سلام، قیمت نهایی چقدره؟ کمی قابل مذاکره است؟",
      });
    }

    if (isBulky(listing) && !hasSpec(listing, "طبقه") && !hasSpec(listing, "آسانسور")) {
      out.push({
        id: "carry",
        label: "طبقه / آسانسور؟",
        draft: "سلام، طبقه چندمه؟ آسانسور باربر دارید؟",
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

  // Dedupe by id
  const seen = new Set<string>();
  return out
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    })
    .slice(0, 3);
}

/** Spec rows that buyers often need but seller left blank. */
export function listingMissingSpecPrompts(listing: Listing): BuyerPrompt[] {
  return listingBuyerPrompts(listing).filter((p) =>
    ["dimensions", "defects", "shipping", "visit-gap", "carry"].includes(p.id),
  );
}
