-- CreateTable
CREATE TABLE "SentMail" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "messageId" TEXT,
    "error" TEXT,
    "sentById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentMail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SentMail_createdAt_idx" ON "SentMail"("createdAt");

-- CreateIndex
CREATE INDEX "SentMail_batchId_idx" ON "SentMail"("batchId");
