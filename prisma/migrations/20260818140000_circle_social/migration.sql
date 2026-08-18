-- AlterTable
ALTER TABLE "User" ADD COLUMN "showOwnListingsInFeed" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "WantRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "budget" INTEGER,
    "budgetUnit" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'ABC',
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WantRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WantOffer" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "price" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WantOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gathering" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "timeLabel" TEXT,
    "location" TEXT NOT NULL,
    "capacity" INTEGER,
    "privacy" TEXT NOT NULL DEFAULT 'ABC',
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gathering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatheringRsvp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatheringRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "peerId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreadPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WantRequest_requesterId_idx" ON "WantRequest"("requesterId");

-- CreateIndex
CREATE UNIQUE INDEX "WantOffer_requestId_fromId_key" ON "WantOffer"("requestId", "fromId");

-- CreateIndex
CREATE INDEX "WantOffer_requestId_idx" ON "WantOffer"("requestId");

-- CreateIndex
CREATE INDEX "WantOffer_fromId_idx" ON "WantOffer"("fromId");

-- CreateIndex
CREATE INDEX "Gathering_hostId_idx" ON "Gathering"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "GatheringRsvp_eventId_personId_key" ON "GatheringRsvp"("eventId", "personId");

-- CreateIndex
CREATE INDEX "GatheringRsvp_eventId_idx" ON "GatheringRsvp"("eventId");

-- CreateIndex
CREATE INDEX "GatheringRsvp_personId_idx" ON "GatheringRsvp"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedListing_userId_listingId_key" ON "SavedListing"("userId", "listingId");

-- CreateIndex
CREATE INDEX "SavedListing_userId_idx" ON "SavedListing"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadPreference_userId_peerId_key" ON "ThreadPreference"("userId", "peerId");

-- CreateIndex
CREATE INDEX "ThreadPreference_userId_idx" ON "ThreadPreference"("userId");

-- AddForeignKey
ALTER TABLE "WantRequest" ADD CONSTRAINT "WantRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantOffer" ADD CONSTRAINT "WantOffer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WantRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantOffer" ADD CONSTRAINT "WantOffer_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gathering" ADD CONSTRAINT "Gathering_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringRsvp" ADD CONSTRAINT "GatheringRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Gathering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatheringRsvp" ADD CONSTRAINT "GatheringRsvp_personId_fkey" FOREIGN KEY ("personId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadPreference" ADD CONSTRAINT "ThreadPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadPreference" ADD CONSTRAINT "ThreadPreference_peerId_fkey" FOREIGN KEY ("peerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
