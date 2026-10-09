-- AlterEnum
ALTER TYPE "CreditKind" ADD VALUE 'SNAP_MOCK';
ALTER TYPE "CreditKind" ADD VALUE 'SNAP_TEST_MOCK';

-- CreateEnum
CREATE TYPE "MockStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateTable
CREATE TABLE "Mock" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "exam" TEXT NOT NULL DEFAULT 'SNAP',
    "description" TEXT,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "status" "MockStatus" NOT NULL DEFAULT 'DRAFT',
    "releaseAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MockSection" (
    "id" TEXT NOT NULL,
    "mockId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MockSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MockQuestion" (
    "id" TEXT NOT NULL,
    "mockId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "stem" TEXT NOT NULL,
    "context" JSONB,
    "options" TEXT[],
    "correct" INTEGER NOT NULL,
    "explanation" TEXT,
    "topic" TEXT,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "negative" DOUBLE PRECISION NOT NULL DEFAULT 0.25,

    CONSTRAINT "MockQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MockAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mockId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "tabSwitches" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "correctCount" INTEGER,
    "wrongCount" INTEGER,
    "skippedCount" INTEGER,

    CONSTRAINT "MockAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MockResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "choice" INTEGER,
    "marked" BOOLEAN NOT NULL DEFAULT false,
    "visited" BOOLEAN NOT NULL DEFAULT true,
    "timeSec" INTEGER NOT NULL DEFAULT 0,
    "changes" INTEGER NOT NULL DEFAULT 0,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mock_slug_key" ON "Mock"("slug");
CREATE INDEX "MockSection_mockId_idx" ON "MockSection"("mockId");
CREATE UNIQUE INDEX "MockQuestion_mockId_number_key" ON "MockQuestion"("mockId", "number");
CREATE INDEX "MockQuestion_sectionId_idx" ON "MockQuestion"("sectionId");
CREATE UNIQUE INDEX "MockAttempt_userId_mockId_key" ON "MockAttempt"("userId", "mockId");
CREATE INDEX "MockAttempt_mockId_status_idx" ON "MockAttempt"("mockId", "status");
CREATE UNIQUE INDEX "MockResponse_attemptId_questionId_key" ON "MockResponse"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "MockSection" ADD CONSTRAINT "MockSection_mockId_fkey" FOREIGN KEY ("mockId") REFERENCES "Mock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockQuestion" ADD CONSTRAINT "MockQuestion_mockId_fkey" FOREIGN KEY ("mockId") REFERENCES "Mock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockQuestion" ADD CONSTRAINT "MockQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "MockSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockAttempt" ADD CONSTRAINT "MockAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockAttempt" ADD CONSTRAINT "MockAttempt_mockId_fkey" FOREIGN KEY ("mockId") REFERENCES "Mock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MockResponse" ADD CONSTRAINT "MockResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "MockAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MockResponse" ADD CONSTRAINT "MockResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MockQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
