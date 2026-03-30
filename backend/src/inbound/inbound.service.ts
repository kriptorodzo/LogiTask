import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════════╗
 * ║                        CANONICAL WORKFLOW DEFINITION                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                  ║
 * ║  PRIMARY PATH (Recommended):                                                     ║
 * ║  ─────────────────────────────────                                                 ║
 * ║  InboundItem → EmailCase → Task                                                  ║
 * ║                                                                                  ║
 * ║  1. INBOUND ITEM arrives (from Email, ERP, or Manual)                            ║
 * ║  2. Manager reviews and CLASSIFIES (sets requestType, priority, supplier, etc) ║
 * ║  3. processInboundItem() creates:                                                ║
 * ║     - EmailCase (linked to inboundItemId, not emailId)                          ║
 * ║     - Task (linked to inboundItemId)                                             ║
 * ║  4. Coordinator works on Task                                                     ║
 * ║  5. Task completion updates Case status                                         ║
 * ║                                                                                  ║
 * ║  LEGACY PATH (Transitional - for backward compatibility only):                   ║
 * ║  ─────────────────────────────────────────────                                    ║
 * ║  Email → EmailCase → Task (via email.service classifyEmail)                     ║
 * ║                                                                                  ║
 * ║  This path is DEPRECATED. Only use for existing emails that haven't been        ║
 * ║  migrated to the InboundItem workflow.                                           ║
 * ║                                                                                  ║
 * ║  KEY RELATIONSHIPS:                                                               ║
 * ║  ───────────────────                                                              ║
 * ║  - EmailCase: uses inboundItemId (preferred) OR emailId (legacy)                ║
 * ║  - Task: uses inboundItemId (preferred) OR emailId (legacy)                     ║
 * ║  - InboundItem: can have multiple Tasks and one Case                            ║
 * ║                                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════════╝
 */

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
    // Get existing inbound item
    const existingItem = await this.prisma.inboundItem.findUnique({
      where: { id },
      include: { emails: true }
    });
    
    if (!existingItem) {
      throw new Error('Inbound item not found');
    }

    // Update inbound item status to PROCESSED
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

    // Get linked email ID if exists
    const emailId = existingItem.emails?.[0]?.id || null;

    // Create Case for this inbound item
    const emailCase = await this.prisma.emailCase.create({
      data: {
        emailId: emailId,
        inboundItemId: inboundItem.id,
        caseStatus: 'PROPOSED',
        classification: data.requestType || null,
        priority: data.priority || 'MEDIUM',
        supplierName: data.supplierName,
        locationName: data.locationName,
        deliveryDueAt: data.dueDate,
        caseDueAt: data.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      },
    });

    // Create a Task for the case
    const taskRequestType = data.requestType || existingItem.requestType || 'OTHER';
    await this.prisma.task.create({
      data: {
        emailId: emailId,
        inboundItemId: inboundItem.id,
        title: `${taskRequestType.replace('_', ' ')} - ${data.supplierName || inboundItem.subject || 'Task'}`,
        description: `Task for processing: ${inboundItem.subject || 'Inbound item ' + id}`,
        status: 'PROPOSED',
        requestType: taskRequestType,
        dueDate: data.dueDate,
        isRequiredForCase: true,
      },
    });

    // Update case totalTasks
    await this.prisma.emailCase.update({
      where: { id: emailCase.id },
      data: { totalTasks: 1 }
    });

    // Update inbound tasksGenerated count
    await this.prisma.inboundItem.update({
      where: { id },
      data: { tasksGenerated: 1 }
    });

    return {
      ...inboundItem,
      caseId: emailCase.id,
    };
  }
}