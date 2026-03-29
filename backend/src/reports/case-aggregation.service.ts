import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Case Status enum
export enum CaseStatus {
  NEW = 'NEW',
  PROPOSED = 'PROPOSED',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Task Status enum
export enum TaskStatus {
  PROPOSED = 'PROPOSED',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

// Completion Result enum
export enum CompletionResult {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
}

@Injectable()
export class CaseAggregationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new EmailCase for an email when it's processed
   */
  async createCaseForEmail(emailId: string, data?: {
    classification?: string;
    priority?: string;
    supplierName?: string;
    locationName?: string;
    deliveryDueAt?: Date;
    caseDueAt?: Date;
  }): Promise<any> {
    const email = await this.prisma.email.findUnique({
      where: { id: emailId },
      include: { tasks: true },
    });

    if (!email) {
      throw new Error('Email not found');
    }

    return this.prisma.emailCase.create({
      data: {
        emailId,
        classification: data?.classification || email.requestType || 'OTHER',
        priority: data?.priority || email.extractedUrgency || 'MEDIUM',
        supplierName: data?.supplierName || email.extractedSupplier,
        locationName: data?.locationName || email.extractedLocation,
        deliveryDueAt: data?.deliveryDueAt || email.extractedDeliveryDate,
        caseDueAt: data?.caseDueAt || email.extractedDeliveryDate,
      },
      include: { email: true },
    });
  }

  /**
   * Get case by email ID
   */
  async getCaseByEmail(emailId: string): Promise<any> {
    return this.prisma.emailCase.findUnique({
      where: { emailId },
      include: {
        email: {
          include: {
            tasks: {
              include: { assignee: true },
            },
          },
        },
      },
    });
  }

  /**
   * Recalculate case status based on all related tasks
   * Status logic:
   * - NEW: no tasks exist
   * - PROPOSED: tasks exist but none are approved
   * - APPROVED: all non-cancelled tasks are approved
   * - IN_PROGRESS: at least one task is in progress
   * - DONE: all required tasks done with FULL
   * - PARTIAL: all required tasks terminal, at least one PARTIAL
   * - FAILED: at least one required task failed
   * - CANCELLED: all required tasks cancelled
   */
  async recalculateCaseStatus(emailId: string): Promise<string> {
    const tasks = await this.prisma.task.findMany({
      where: { emailId },
      orderBy: { createdAt: 'asc' },
    });

    // Case is NEW if no tasks exist
    if (tasks.length === 0) {
      await this.updateCaseField(emailId, 'caseStatus', CaseStatus.NEW);
      return CaseStatus.NEW;
    }

    // Filter required tasks (not marked as not required for case)
    const requiredTasks = tasks.filter(t => t.isRequiredForCase !== false);
    const optionalTasks = tasks.filter(t => t.isRequiredForCase === false);

    // Check for CANCELLED state - all required tasks cancelled
    if (requiredTasks.length > 0) {
      const allCancelled = requiredTasks.every(t => t.status === TaskStatus.CANCELLED);
      if (allCancelled) {
        await this.updateCaseField(emailId, 'caseStatus', CaseStatus.CANCELLED);
        return CaseStatus.CANCELLED;
      }
    }

    // Count tasks by status
    const proposedCount = tasks.filter(t => t.status === TaskStatus.PROPOSED).length;
    const approvedCount = tasks.filter(t => t.status === TaskStatus.APPROVED).length;
    const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const doneCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const cancelledCount = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    const nonCancelledCount = tasks.length - cancelledCount;

    // Count by completion result
    const fullCount = tasks.filter(t => t.completionResult === CompletionResult.FULL).length;
    const partialCount = tasks.filter(t => t.completionResult === CompletionResult.PARTIAL).length;
    const failedCount = tasks.filter(t => t.completionResult === CompletionResult.FAILED).length;

    // Determine case status
    let newStatus: CaseStatus;

    // FAILED: any required task with FAILED completion
    if (requiredTasks.some(t => t.completionResult === CompletionResult.FAILED)) {
      newStatus = CaseStatus.FAILED;
    }
    // DONE: all required tasks are DONE with FULL completion
    else if (requiredTasks.length > 0 && requiredTasks.every(t => 
      t.status === TaskStatus.DONE && t.completionResult === CompletionResult.FULL
    )) {
      newStatus = CaseStatus.DONE;
    }
    // PARTIAL: all required tasks are terminal (DONE or CANCELLED), at least one PARTIAL, none FAILED
    else if (requiredTasks.length > 0 && requiredTasks.every(t => 
      [TaskStatus.DONE, TaskStatus.CANCELLED].includes(t.status as TaskStatus)
    ) && requiredTasks.some(t => t.completionResult === CompletionResult.PARTIAL)) {
      newStatus = CaseStatus.PARTIAL;
    }
    // IN_PROGRESS: at least one task is IN_PROGRESS or has startedAt
    else if (inProgressCount > 0 || tasks.some(t => t.startedAt)) {
      newStatus = CaseStatus.IN_PROGRESS;
    }
    // APPROVED: all non-cancelled tasks are APPROVED
    else if (approvedCount === nonCancelledCount && approvedCount > 0) {
      newStatus = CaseStatus.APPROVED;
    }
    // PROPOSED: at least one is PROPOSED, none in progress or approved
    else if (proposedCount > 0 && approvedCount === 0 && inProgressCount === 0) {
      newStatus = CaseStatus.PROPOSED;
    }
    // Default to PROPOSED if tasks exist but none of above conditions match
    else {
      newStatus = CaseStatus.PROPOSED;
    }

    await this.updateCaseField(emailId, 'caseStatus', newStatus);
    return newStatus;
  }

  private async updateCaseField(emailId: string, field: string, value: any): Promise<void> {
    const updateData: any = { [field]: value };

    // Set timestamps based on status
    if (field === 'caseStatus') {
      if (value === CaseStatus.APPROVED) {
        updateData.approvedAt = new Date();
      } else if ([CaseStatus.DONE, CaseStatus.PARTIAL, CaseStatus.FAILED, CaseStatus.CANCELLED].includes(value)) {
        updateData.completedAt = new Date();
      }
    }

    try {
      await this.prisma.emailCase.update({
        where: { emailId },
        data: updateData,
      });
    } catch (error) {
      // Case might not exist yet - ignore
      console.warn('Could not update case field:', error);
    }
  }

  /**
   * Full case refresh - recalculate status and all KPI fields
   */
  async refreshCase(emailId: string): Promise<any> {
    const caseData = await this.prisma.emailCase.findUnique({
      where: { emailId },
    });

    if (!caseData) {
      throw new Error('Case not found');
    }

    // First recalculate status
    await this.recalculateCaseStatus(emailId);

    // Then recalculate other KPIs
    return this.recalculateCase(caseData.id);
  }

  /**
   * Recalculate all KPI fields for a case based on its tasks
   * OTIF Logic:
   * - On-Time = completedAt <= caseDueAt
   * - In-Full = no PARTIAL or FAILED tasks (among isRequiredForCase tasks)
   * - OTIF = On-Time AND In-Full
   */
  async recalculateCase(caseId: string): Promise<any> {
    const emailCase = await this.prisma.emailCase.findUnique({
      where: { id: caseId },
      include: {
        email: {
          include: {
            tasks: {
              include: { assignee: true, statusHistory: true },
            },
          },
        },
      },
    });

    if (!emailCase) {
      throw new Error('Case not found');
    }

    const allTasks = emailCase.email.tasks;
    const tasks = allTasks.filter(t => t.isRequiredForCase !== false);
    const requiredTasks = tasks; // All non-excluded tasks are required
    const totalTasks = allTasks.length;
    
    // Count tasks by completion result (use allTasks for complete picture)
    const completedTasks = allTasks.filter(t => t.completionResult === 'FULL').length;
    const partialTasks = allTasks.filter(t => t.completionResult === 'PARTIAL').length;
    const failedTasks = allTasks.filter(t => t.completionResult === 'FAILED').length;

    // Determine if case is completed
    const hasCompletedTasks = allTasks.some(t => t.completedAt !== null);
    
    // Calculate isOnTime: completedAt <= caseDueAt
    let isOnTime: boolean | null = null;
    if (hasCompletedTasks && emailCase.caseDueAt) {
      const lastCompletionDate = allTasks.reduce((max, t) => {
        if (t.completedAt && t.completedAt > max) return t.completedAt;
        return max;
      }, new Date(0));
      isOnTime = lastCompletionDate <= emailCase.caseDueAt;
    }

    // Calculate isInFull: no PARTIAL or FAILED tasks
    let isInFull: boolean | null = null;
    if (hasCompletedTasks) {
      isInFull = partialTasks === 0 && failedTasks === 0;
    }

    // Calculate isOtif: On-Time AND In-Full
    let isOtif: boolean | null = null;
    if (isOnTime !== null && isInFull !== null) {
      isOtif = isOnTime && isInFull;
    }

    // Calculate lead times
    let approvalLeadMinutes: number | null = null;
    let executionLeadMinutes: number | null = null;

    // Find first approval (first task going to APPROVED status)
    const approvalHistory = allTasks.flatMap(t => t.statusHistory)
      .filter(h => h.toStatus === 'APPROVED')
      .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

    if (approvalHistory.length > 0 && emailCase.email.receivedAt) {
      const firstApproval = approvalHistory[0];
      approvalLeadMinutes = Math.round(
        (firstApproval.changedAt.getTime() - emailCase.email.receivedAt.getTime()) / 60000
      );
    }

    // Calculate execution lead time (first approval to last completion)
    if (approvalHistory.length > 0) {
      const firstApprovalDate = approvalHistory[0].changedAt;
      const lastCompletionDate = allTasks.reduce((max, t) => {
        if (t.completedAt && t.completedAt > max) return t.completedAt;
        return max;
      }, new Date(0));
      
      if (lastCompletionDate.getTime() > 0) {
        executionLeadMinutes = Math.round(
          (lastCompletionDate.getTime() - firstApprovalDate.getTime()) / 60000
        );
      }
    }

    // Update the case - first calculate status
    const status = await this.determineCaseStatus(tasks, requiredTasks);
    
    return this.prisma.emailCase.update({
      where: { id: caseId },
      data: {
        caseStatus: status,
        completedAt: hasCompletedTasks ? new Date() : null,
        approvedAt: approvalHistory.length > 0 ? approvalHistory[0].changedAt : null,
        isOnTime,
        isInFull,
        isOtif,
        approvalLeadMinutes,
        executionLeadMinutes,
        totalTasks,
        completedTasks,
        partialTasks,
        failedTasks,
      },
    });
  }

  /**
   * Determine case status based on task states
   */
  private async determineCaseStatus(tasks: any[], requiredTasks: any[]): Promise<CaseStatus> {
    if (tasks.length === 0) {
      return CaseStatus.NEW;
    }

    const allCancelled = requiredTasks.length > 0 && requiredTasks.every(t => t.status === TaskStatus.CANCELLED);
    if (allCancelled) {
      return CaseStatus.CANCELLED;
    }

    const proposedCount = tasks.filter(t => t.status === TaskStatus.PROPOSED).length;
    const approvedCount = tasks.filter(t => t.status === TaskStatus.APPROVED).length;
    const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const cancelledCount = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    const nonCancelledCount = tasks.length - cancelledCount;

    if (requiredTasks.some(t => t.completionResult === CompletionResult.FAILED)) {
      return CaseStatus.FAILED;
    }
    if (requiredTasks.length > 0 && requiredTasks.every(t => 
      t.status === TaskStatus.DONE && t.completionResult === CompletionResult.FULL
    )) {
      return CaseStatus.DONE;
    }
    if (requiredTasks.length > 0 && requiredTasks.every(t => 
      [TaskStatus.DONE, TaskStatus.CANCELLED].includes(t.status as TaskStatus)
    ) && requiredTasks.some(t => t.completionResult === CompletionResult.PARTIAL)) {
      return CaseStatus.PARTIAL;
    }
    if (inProgressCount > 0 || tasks.some(t => t.startedAt)) {
      return CaseStatus.IN_PROGRESS;
    }
    if (approvedCount === nonCancelledCount && approvedCount > 0) {
      return CaseStatus.APPROVED;
    }
    if (proposedCount > 0 && approvedCount === 0 && inProgressCount === 0) {
      return CaseStatus.PROPOSED;
    }
    return CaseStatus.NEW;
  }

  /**
   * Mark case as approved (called when first task is approved)
   */
  async approveCase(caseId: string): Promise<any> {
    return this.recalculateCase(caseId);
  }

  /**
   * Get all cases with optional filters
   */
  async getCases(filters: {
    from?: Date;
    to?: Date;
    otif?: boolean;
    onTime?: boolean;
    inFull?: boolean;
    supplierName?: string;
    locationName?: string;
    classification?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ cases: any[]; total: number }> {
    const where: any = {};

    if (filters.from || filters.to) {
      where.completedAt = {};
      if (filters.from) where.completedAt.gte = filters.from;
      if (filters.to) where.completedAt.lte = filters.to;
    }

    if (filters.otif !== undefined) where.isOtif = filters.otif;
    if (filters.onTime !== undefined) where.isOnTime = filters.onTime;
    if (filters.inFull !== undefined) where.isInFull = filters.inFull;
    if (filters.supplierName) where.supplierName = filters.supplierName;
    if (filters.locationName) where.locationName = filters.locationName;
    if (filters.classification) where.classification = filters.classification;

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [cases, total] = await Promise.all([
      this.prisma.emailCase.findMany({
        where,
        include: {
          email: {
            include: { tasks: { where: { isRequiredForCase: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.emailCase.count({ where }),
    ]);

    return { cases, total };
  }
}