-- AlterTable
ALTER TABLE "MentorProfile" ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "photoKey" TEXT;

-- AlterTable
ALTER TABLE "MentorApplication" ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "photoFileName" TEXT,
ADD COLUMN     "photoKey" TEXT,
ADD COLUMN     "promotedMentorId" TEXT;

