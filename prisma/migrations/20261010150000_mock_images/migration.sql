-- CreateEnum
CREATE TYPE "MockImageScope" AS ENUM ('QUESTION', 'SOLUTION');

-- CreateTable
CREATE TABLE "MockImage" (
    "id" TEXT NOT NULL,
    "mockId" TEXT NOT NULL,
    "scope" "MockImageScope" NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MockImage_mockId_idx" ON "MockImage"("mockId");

-- AddForeignKey
ALTER TABLE "MockImage" ADD CONSTRAINT "MockImage_mockId_fkey" FOREIGN KEY ("mockId") REFERENCES "Mock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
