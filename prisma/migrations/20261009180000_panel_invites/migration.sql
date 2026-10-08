-- CreateEnum
CREATE TYPE "PanelStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "SessionPanelist" ADD COLUMN "status" "PanelStatus" NOT NULL DEFAULT 'INVITED';
ALTER TABLE "SessionPanelist" ADD COLUMN "respondedAt" TIMESTAMP(3);
ALTER TABLE "SessionPanelist" ADD COLUMN "slotCreated" BOOLEAN NOT NULL DEFAULT false;
