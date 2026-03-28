import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
              where: { isRequiredForCase: true },
              include: { assignee: true, statusHistory: true },
            },
          },
        },
      },
    });

    if (!emailCase) {
      throw new Error('Case not found');
    }

    const tasks = emailCase.email.tasks;
    const totalTasks = tasks.length;
    
    // Count tasks by completion result
    const completedTasks = tasks.filter(t => t.completionResult === 'FULL').length;
    const partialTasks = tasks.filter(t => t.completionResult === 'PARTIAL').length;
    const failedTasks = tasks.filter(t => t.completionResult === 'FAILED').length;

    // Determine if case is completed
    const hasCompletedTasks = tasks.some(t => t.completedAt !== null);
    
    // Calculate isOnTime: completedAt <= caseDueAt
    let isOnTime: boolean | null = null;
    if (hasCompletedTasks && emailCase.caseDueAt) {
      const lastCompletionDate = tasks.reduce((max, t) => {
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
    const approvalHistory = tasks.flatMap(t => t.statusHistory)
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
      const lastCompletionDate = tasks.reduce((max, t) => {
        if (t.completedAt && t.completedAt > max) return t.completedAt;
        return max;
      }, new Date(0));
      
      if (lastCompletionDate.getTime() > 0) {
        executionLeadMinutes = Math.round(
          (lastCompletionDate.getTime() - firstApprovalDate.getTime()) / 60000
        );
      }
    }

    // Update the case
    return this.prisma.emailCase.update({
      where: { id: caseId },
      data: {
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