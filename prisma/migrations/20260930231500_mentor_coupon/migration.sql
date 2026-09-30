-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "mentorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_mentorId_key" ON "Coupon"("mentorId");

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
