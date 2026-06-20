-- CreateEnum
CREATE TYPE "ValidationKind" AS ENUM ('CORRECTION', 'COVER', 'LAYOUT');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'VALIDATED', 'CHANGES_REQUESTED', 'EXPIRED_TO_EDITOR');

-- CreateTable
CREATE TABLE "ValidationRequest" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "kind" "ValidationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "status" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "selectedOptionId" TEXT,
    "authorComment" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ValidationRequest_dossierId_idx" ON "ValidationRequest"("dossierId");

-- CreateIndex
CREATE INDEX "ValidationRequest_status_idx" ON "ValidationRequest"("status");

-- AddForeignKey
ALTER TABLE "ValidationRequest" ADD CONSTRAINT "ValidationRequest_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationRequest" ADD CONSTRAINT "ValidationRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
