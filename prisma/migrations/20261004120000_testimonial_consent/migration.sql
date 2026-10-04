-- AlterTable
ALTER TABLE "SessionRating" ADD COLUMN     "featureConsent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "ratingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_ratingId_key" ON "Testimonial"("ratingId");
