-- CreateTable
CREATE TABLE "HiddenPerson" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HiddenPerson_userId_idx" ON "HiddenPerson"("userId");

-- CreateIndex
CREATE INDEX "HiddenPerson_personId_idx" ON "HiddenPerson"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "HiddenPerson_userId_personId_key" ON "HiddenPerson"("userId", "personId");

-- AddForeignKey
ALTER TABLE "HiddenPerson" ADD CONSTRAINT "HiddenPerson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiddenPerson" ADD CONSTRAINT "HiddenPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
