-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AUTHOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INVITED');

-- CreateEnum
CREATE TYPE "ThemePref" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('FR', 'EN');

-- CreateEnum
CREATE TYPE "DossierStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('CONTRAT', 'ISBN', 'RELECTURE', 'CORRECTION', 'COUVERTURE', 'MISE_EN_PAGE', 'COMMUNICATION', 'PUBLICATION');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('DONE', 'IN_PROGRESS', 'UPCOMING', 'PENDING');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'CASH', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('VALIDATED', 'PENDING');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('GENERAL', 'COMPLAINT', 'FINANCE', 'PROOFREADING', 'COVER', 'COMMUNICATION', 'TECHNICAL', 'TERMINATION');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('MANUSCRIPT', 'ADMINISTRATIVE', 'VISUALS', 'COVER', 'CONTENT', 'FINANCIAL', 'COMMUNICATION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STAGE', 'DOCUMENT', 'TICKET', 'PAYMENT', 'VALIDATION', 'TERMINATION');

-- CreateEnum
CREATE TYPE "TerminationStatus" AS ENUM ('NOT_STARTED', 'SUBMITTED', 'REVIEW', 'DECISION', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "role" "Role" NOT NULL DEFAULT 'AUTHOR',
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "locale" "Locale" NOT NULL DEFAULT 'FR',
    "theme" "ThemePref" NOT NULL DEFAULT 'SYSTEM',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'ACTIVATION',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dossier" (
    "id" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "bookTitle" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "status" "DossierStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "globalProgress" INTEGER NOT NULL DEFAULT 0,
    "contractTotal" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "estimatedPublication" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "type" "StageType" NOT NULL,
    "status" "StageStatus" NOT NULL DEFAULT 'UPCOMING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "substeps" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSchedule" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "comment" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "authorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TerminationRequest" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "status" "TerminationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reason" TEXT,
    "steps" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TerminationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dossierId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "dossierId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_token_key" ON "InviteToken"("token");

-- CreateIndex
CREATE INDEX "InviteToken_userId_idx" ON "InviteToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_trackingNumber_key" ON "Dossier"("trackingNumber");

-- CreateIndex
CREATE INDEX "Dossier_authorId_idx" ON "Dossier"("authorId");

-- CreateIndex
CREATE INDEX "Dossier_managerId_idx" ON "Dossier"("managerId");

-- CreateIndex
CREATE INDEX "Dossier_status_idx" ON "Dossier"("status");

-- CreateIndex
CREATE INDEX "Stage_dossierId_idx" ON "Stage"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_dossierId_type_key" ON "Stage"("dossierId", "type");

-- CreateIndex
CREATE INDEX "Payment_dossierId_idx" ON "Payment"("dossierId");

-- CreateIndex
CREATE INDEX "PaymentSchedule_dossierId_idx" ON "PaymentSchedule"("dossierId");

-- CreateIndex
CREATE INDEX "Document_dossierId_idx" ON "Document"("dossierId");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ref_key" ON "Ticket"("ref");

-- CreateIndex
CREATE INDEX "Ticket_dossierId_idx" ON "Ticket"("dossierId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "TerminationRequest_dossierId_key" ON "TerminationRequest"("dossierId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "ActivityLog_dossierId_idx" ON "ActivityLog"("dossierId");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerminationRequest" ADD CONSTRAINT "TerminationRequest_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
