-- CreateTable
CREATE TABLE "EmailCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "classification" TEXT,
    "priority" TEXT,
    "supplierName" TEXT,
    "locationName" TEXT,
    "deliveryDueAt" DATETIME,
    "caseDueAt" DATETIME,
    "approvedAt" DATETIME,
    "completedAt" DATETIME,
    "isOnTime" BOOLEAN,
    "isInFull" BOOLEAN,
    "isOtif" BOOLEAN,
    "approvalLeadMinutes" INTEGER,
    "executionLeadMinutes" INTEGER,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "partialTasks" INTEGER NOT NULL DEFAULT 0,
    "failedTasks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailCase_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "TaskStatusHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaskStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodType" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "roleCode" TEXT,
    "coordinatorUserId" TEXT,
    "supplierName" TEXT,
    "locationName" TEXT,
    "totalCases" INTEGER NOT NULL DEFAULT 0,
    "otifCases" INTEGER NOT NULL DEFAULT 0,
    "onTimeCases" INTEGER NOT NULL DEFAULT 0,
    "inFullCases" INTEGER NOT NULL DEFAULT 0,
    "overdueCases" INTEGER NOT NULL DEFAULT 0,
    "avgApprovalMinutes" INTEGER,
    "avgExecutionMinutes" INTEGER,
    "otifRate" REAL,
    "onTimeRate" REAL,
    "inFullRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "requestType" TEXT NOT NULL,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assignedAt" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "completionResult" TEXT,
    "delayReasonCode" TEXT,
    "delayReasonText" TEXT,
    "isRequiredForCase" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Task_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assigneeId", "createdAt", "description", "dueDate", "emailId", "id", "requestType", "status", "title", "updatedAt") SELECT "assigneeId", "createdAt", "description", "dueDate", "emailId", "id", "requestType", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EmailCase_emailId_key" ON "EmailCase"("emailId");

-- CreateIndex
CREATE INDEX "EmailCase_caseDueAt_idx" ON "EmailCase"("caseDueAt");

-- CreateIndex
CREATE INDEX "EmailCase_approvedAt_idx" ON "EmailCase"("approvedAt");

-- CreateIndex
CREATE INDEX "EmailCase_completedAt_idx" ON "EmailCase"("completedAt");

-- CreateIndex
CREATE INDEX "EmailCase_supplierName_idx" ON "EmailCase"("supplierName");

-- CreateIndex
CREATE INDEX "EmailCase_locationName_idx" ON "EmailCase"("locationName");

-- CreateIndex
CREATE INDEX "EmailCase_isOtif_idx" ON "EmailCase"("isOtif");

-- CreateIndex
CREATE INDEX "TaskStatusHistory_taskId_changedAt_idx" ON "TaskStatusHistory"("taskId", "changedAt");

-- CreateIndex
CREATE INDEX "KpiSnapshot_periodType_periodStart_periodEnd_idx" ON "KpiSnapshot"("periodType", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "KpiSnapshot_roleCode_idx" ON "KpiSnapshot"("roleCode");

-- CreateIndex
CREATE INDEX "KpiSnapshot_coordinatorUserId_idx" ON "KpiSnapshot"("coordinatorUserId");

-- CreateIndex
CREATE INDEX "KpiSnapshot_supplierName_idx" ON "KpiSnapshot"("supplierName");

-- CreateIndex
CREATE INDEX "KpiSnapshot_locationName_idx" ON "KpiSnapshot"("locationName");
