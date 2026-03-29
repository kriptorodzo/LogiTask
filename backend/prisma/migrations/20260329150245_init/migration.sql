-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'RECEPTION_COORDINATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mailbox" (
    "id" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mailbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "microsoftGraphId" TEXT,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "body" TEXT,
    "bodyPlainText" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "extractedSupplier" TEXT,
    "extractedLocation" TEXT,
    "extractedDeliveryDate" TIMESTAMP(3),
    "extractedUrgency" TEXT,
    "requestType" TEXT NOT NULL DEFAULT 'UNCLASSIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "requestType" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completionResult" TEXT,
    "delayReasonCode" TEXT,
    "delayReasonText" TEXT,
    "isRequiredForCase" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "dependentId" TEXT NOT NULL,
    "dependencyId" TEXT NOT NULL,
    "offsetDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" TEXT NOT NULL,
    "assigneeRole" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "taskId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCase" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "classification" TEXT,
    "priority" TEXT,
    "supplierName" TEXT,
    "locationName" TEXT,
    "deliveryDueAt" TIMESTAMP(3),
    "caseDueAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isOnTime" BOOLEAN,
    "isInFull" BOOLEAN,
    "isOtif" BOOLEAN,
    "approvalLeadMinutes" INTEGER,
    "executionLeadMinutes" INTEGER,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "partialTasks" INTEGER NOT NULL DEFAULT 0,
    "failedTasks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskStatusHistory" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "TaskStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
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
    "otifRate" DOUBLE PRECISION,
    "onTimeRate" DOUBLE PRECISION,
    "inFullRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_emailAddress_key" ON "Mailbox"("emailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Email_microsoftGraphId_key" ON "Email"("microsoftGraphId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_dependentId_dependencyId_key" ON "TaskDependency"("dependentId", "dependencyId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutingRule_name_key" ON "RoutingRule"("name");

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

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "Mailbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependencyId_fkey" FOREIGN KEY ("dependencyId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCase" ADD CONSTRAINT "EmailCase_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatusHistory" ADD CONSTRAINT "TaskStatusHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatusHistory" ADD CONSTRAINT "TaskStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
