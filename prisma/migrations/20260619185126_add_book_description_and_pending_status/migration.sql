-- AlterEnum
ALTER TYPE "DossierStatus" ADD VALUE 'PENDING_VALIDATION';

-- AlterTable
ALTER TABLE "Dossier" ADD COLUMN     "description" TEXT;
