-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "earlyBirdPricePaise" INTEGER,
ADD COLUMN     "earlyBirdSeats" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "earlyBird" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "BonusAward" ALTER COLUMN "ruleId" DROP NOT NULL,
ADD COLUMN     "basePaise" INTEGER,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'MILESTONE',
ADD COLUMN     "percent" INTEGER,
ADD COLUMN     "referralBatch" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "BonusAward_mentorId_referralBatch_key" ON "BonusAward"("mentorId", "referralBatch");
