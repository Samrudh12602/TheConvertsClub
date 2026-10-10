-- CreateEnum
CREATE TYPE "ProfileDocKind" AS ENUM ('CALL_LETTER', 'ADMIT_LETTER', 'EXAM_RESULT', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarKey" TEXT;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN "dob" TIMESTAMP(3),
ADD COLUMN "state" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "examsAppearing" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "tenthBoard" TEXT,
ADD COLUMN "tenthPercent" DOUBLE PRECISION,
ADD COLUMN "tenthYear" INTEGER,
ADD COLUMN "twelfthBoard" TEXT,
ADD COLUMN "twelfthStream" TEXT,
ADD COLUMN "twelfthPercent" DOUBLE PRECISION,
ADD COLUMN "twelfthYear" INTEGER,
ADD COLUMN "gradYear" INTEGER,
ADD COLUMN "gradScore" TEXT,
ADD COLUMN "company" TEXT,
ADD COLUMN "jobRole" TEXT,
ADD COLUMN "industry" TEXT,
ADD COLUMN "about" TEXT;

-- AlterTable
ALTER TABLE "MentorProfile" ADD COLUMN "convertedInstitutes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "examScores" TEXT,
ADD COLUMN "company" TEXT,
ADD COLUMN "jobRole" TEXT;

-- CreateTable
CREATE TABLE "ProfileDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ProfileDocKind" NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "score" TEXT,
    "note" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "contentType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileDocument_userId_kind_idx" ON "ProfileDocument"("userId", "kind");

-- AddForeignKey
ALTER TABLE "ProfileDocument" ADD CONSTRAINT "ProfileDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
