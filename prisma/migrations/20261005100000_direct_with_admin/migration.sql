-- AlterEnum
ALTER TYPE "CreditKind" ADD VALUE 'PI_DIRECT';

-- AlterEnum
ALTER TYPE "SessionType" ADD VALUE 'PI_DIRECT';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "withAdmin" BOOLEAN NOT NULL DEFAULT false;
