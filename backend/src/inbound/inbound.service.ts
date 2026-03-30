import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InboundService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all inbound items with optional filters
   */
  async getInboundItems(filters?: {
    sourceType?: string;
    processingStatus?: string;
    requestType?: string;
    priority?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: any = {};

    if (filters?.sourceType) where.sourceType = filters.sourceType;
    if (filters?.processingStatus) where.processingStatus = filters.processingStatus;
    if (filters?.requestType) where.requestType = filters.requestType;
    if (filters?.priority) where.priority = filters.priority;

    if (filters?.fromDate || filters?.toDate) {
      where.receivedAt = {};
      if (filters?.fromDate) where.receivedAt.gte = filters.fromDate;
      if (filters?.toDate) where.receivedAt.lte = filters.toDate;
    }

    return this.prisma.inboundItem.findMany({
      where,
      include: {
        emails: true,
        erpDocuments: true,
        cases: true,
        tasks: {
          include: { assignee: true },
        },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  /**
   * Get single inbound item by ID
   */
  async getInboundItemById(id: string) {
    return this.prisma.inboundItem.findUnique({
      where: { id },
      include: {
        emails: true,
        erpDocuments: true,
        cases: {
          include: {
            email: {
              include: { tasks: true },
            },
          },
        },
        tasks: {
          include: { assignee: true },
        },
      },
    });
  }

  /**
   * Get Manager Dashboard Summary
   * Returns aggregated data for cards
   */
  async getManagerSummary() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    todayStart.setHours(0, 0, 0, 0);

    // Manager-meaningful counts
    const total = await this.prisma.inboundItem.count();
    const newToday = await this.prisma.inboundItem.count({
      where: { receivedAt: { gte: todayStart } },
    });

    // Get base counts
    const [reclaimed, processed, failed, highPriority] = await Promise.all([
      this.prisma.inboundItem.count({ where: { intakeStatus: 'RECLAIMED' } }),
      this.prisma.inboundItem.count({ where: { intakeStatus: 'PROCESSED' } }),
      this.prisma.inboundItem.count({ where: { intakeStatus: 'FAILED' } }),
      this.prisma.inboundItem.count({ where: { priority: 'HIGH' } }),
    ]);

    // Get case/task-based for meaningful metrics
    const [doneCases, activeCases] = await Promise.all([
      this.prisma.emailCase.count({ where: { caseStatus: 'DONE' } }),
      this.prisma.emailCase.count({ where: { caseStatus: 'IN_PROGRESS' } }),
    ]);

    const pendingClassification = reclaimed;
    const inProgress = activeCases;
    const completed = doneCases;

    // Get breakdown by source type
    const sourceBreakdown = await this.prisma.inboundItem.groupBy({
      by: ['sourceType'],
      _count: true,
    });

    // Get breakdown by request type
    const requestTypeBreakdown = await this.prisma.inboundItem.groupBy({
      by: ['requestType'],
      _count: true,
    });

    // Get urgent items (HIGH priority or overdue)
    const urgentCount = await this.prisma.inboundItem.count({
      where: {
        OR: [
          { priority: 'HIGH' },
          { 
            intakeStatus: { in: ['RECLAIMED'] },
            requestedDate: { lt: now },
          },
        ],
      },
    });

    return {
      total,
      newToday,
      pendingClassification,
      inProgress,
      completed,
      urgentCount,
      sourceBreakdown: sourceBreakdown.map(s => ({
        type: s.sourceType,
        count: s._count,
      })),
      requestTypeBreakdown: requestTypeBreakdown.map(r => ({
        type: r.requestType,
        count: r._count,
      })),
    };
  }

  /**
   * Get Coordinator Workboard Summary
   */
  async getCoordinatorSummary(userId: string) {
    // Get tasks assigned to this coordinator
    const myTasks = await this.prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        assignee: true,
        inboundItem: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const taskStatuses = await this.prisma.task.groupBy({
      by: ['status'],
      where: { assigneeId: userId },
      _count: true,
    });

    return {
      myTasks,
      taskStatuses: taskStatuses.map(t => ({
        status: t.status,
        count: t._count,
      })),
    };
  }

  /**
   * Process inbound item (classify and create case/tasks)
   */
  async processInboundItem(id: string, data: {
    requestType?: string;
    priority?: string;
    supplierName?: string;
    locationName?: string;
    dueDate?: Date;
  }) {
    // Update inbound item
    const inboundItem = await this.prisma.inboundItem.update({
      where: { id },
      data: {
        requestType: data.requestType,
        priority: data.priority,
        supplierName: data.supplierName,
        locationName: data.locationName,
        requestedDate: data.dueDate,
        processingStatus: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    // If there's an email, create case and tasks
    if (inboundItem.sourceType === 'EMAIL' && inboundItem.sourceId) {
      // The case and tasks are created through classifyEmail
      // This is handled by the email service
    }

    return inboundItem;
  }
}