-- AlterTable
ALTER TABLE "Dossier" ADD COLUMN     "isbn" TEXT,
ADD COLUMN     "legalDeposit" TEXT;

-- CreateTable
CREATE TABLE "EditorialRemark" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'REVIEW',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attachments" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialRemark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageMessage" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'REVIEW',
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EditorialRemark_dossierId_stage_idx" ON "EditorialRemark"("dossierId", "stage");

-- CreateIndex
CREATE INDEX "StageMessage_dossierId_stage_idx" ON "StageMessage"("dossierId", "stage");

-- AddForeignKey
ALTER TABLE "EditorialRemark" ADD CONSTRAINT "EditorialRemark_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialRemark" ADD CONSTRAINT "EditorialRemark_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageMessage" ADD CONSTRAINT "StageMessage_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageMessage" ADD CONSTRAINT "StageMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
