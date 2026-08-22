-- Approximate neighborhood / fulfillment mode (not a street address).
ALTER TABLE "MarketListing" ADD COLUMN IF NOT EXISTS "area" TEXT;
ALTER TABLE "WantRequest" ADD COLUMN IF NOT EXISTS "area" TEXT;
