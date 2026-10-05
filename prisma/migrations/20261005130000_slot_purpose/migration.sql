-- AlterEnum
ALTER TYPE "CreditKind" ADD VALUE 'STRATEGY_DIRECT';

-- AlterEnum
ALTER TYPE "SessionType" ADD VALUE 'STRATEGY_DIRECT';

-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "direct" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AvailabilityWindow" ADD COLUMN     "direct" BOOLEAN NOT NULL DEFAULT false;
