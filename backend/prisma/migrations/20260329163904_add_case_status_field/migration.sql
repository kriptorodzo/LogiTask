-- AlterTable
ALTER TABLE "EmailCase" ADD COLUMN     "caseStatus" TEXT NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "EmailCase_caseStatus_idx" ON "EmailCase"("caseStatus");
