-- CreateTable
CREATE TABLE "Venture" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "hasToken" BOOLEAN NOT NULL DEFAULT false,
    "tokenSymbol" TEXT,
    "tokenChainId" TEXT,
    "tokenContractAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'Intake',
    "signalState" TEXT NOT NULL DEFAULT 'Unclear',
    "status" TEXT NOT NULL DEFAULT 'active',
    "ownerDisplayName" TEXT,
    "committeeAt" TIMESTAMP(3),
    "committeeStatus" TEXT,
    "committeeCondition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentDomain" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Not started',
    "blockerCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AssessmentDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Suggested',
    "isBlocker" BOOLEAN NOT NULL DEFAULT false,
    "binanceMode" TEXT,
    "tokenQuery" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalystResponse" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Reviewed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalystResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "content" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "requestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Venture_name_idx" ON "Venture"("name");

-- CreateIndex
CREATE INDEX "Assessment_ventureId_status_updatedAt_idx" ON "Assessment"("ventureId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "AssessmentDomain_assessmentId_position_idx" ON "AssessmentDomain"("assessmentId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentDomain_assessmentId_key_key" ON "AssessmentDomain"("assessmentId", "key");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_domainId_position_idx" ON "AssessmentQuestion"("domainId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AnalystResponse_questionId_key" ON "AnalystResponse"("questionId");

-- CreateIndex
CREATE INDEX "Evidence_questionId_createdAt_idx" ON "Evidence"("questionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentDomain" ADD CONSTRAINT "AssessmentDomain_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "AssessmentDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalystResponse" ADD CONSTRAINT "AnalystResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
