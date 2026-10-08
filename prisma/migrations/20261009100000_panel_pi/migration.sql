-- AlterEnum
ALTER TYPE "CreditKind" ADD VALUE 'PANEL_PI';
ALTER TYPE "SessionType" ADD VALUE 'PANEL_PI';
ALTER TYPE "PayService" ADD VALUE 'PANEL';

-- CreateTable
CREATE TABLE "SessionPanelist" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "slotId" TEXT,
    "accrualId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionPanelist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionPanelist_accrualId_key" ON "SessionPanelist"("accrualId");
CREATE UNIQUE INDEX "SessionPanelist_sessionId_mentorId_key" ON "SessionPanelist"("sessionId", "mentorId");
CREATE INDEX "SessionPanelist_mentorId_idx" ON "SessionPanelist"("mentorId");

-- AddForeignKey
ALTER TABLE "SessionPanelist" ADD CONSTRAINT "SessionPanelist_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SessionPanelist" ADD CONSTRAINT "SessionPanelist_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SessionPanelist" ADD CONSTRAINT "SessionPanelist_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
