import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TASK_STATUS, ROLES } from '../common/constants';
import { CaseAggregationService } from '../reports/case-aggregation.service';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private caseAggregationService: CaseAggregationService,
  ) {}

  /**
   * Record a status change in TaskStatusHistory
   */
  private async recordStatusChange(
    taskId: string,
    fromStatus: string | null,
    toStatus: string,
    changedByUserId?: string,
    note?: string
  ) {
    try {
      return await this.prisma.taskStatusHistory.create({
        data: {
          taskId,
          fromStatus,
          toStatus,
          changedByUserId,
          note,
        },
      });
    } catch (error) {
      console.warn('Failed to create status history:', error);
      return null;
    }
  }

  async createTask(data: {
    emailId?: string;
    erpDocumentId?: string;
    inboundItemId?: string;  // NEW: Link to Master Inbox
    title: string;
    description?: string;
    requestType: string;
    dueDate?: string | Date;
    assigneeId?: string;
  }) {
    const task = await this.prisma.task.create({
      data: {
        emailId: data.emailId,
        erpDocumentId: data.erpDocumentId,
        inboundItemId: data.inboundItemId,  // NEW
        title: data.title,
        description: data.description,
        requestType: data.requestType,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
        status: TASK_STATUS.PROPOSED,
      },
      include: { email: true, assignee: true },
    });

    // Update InboundItem tasksGenerated count
    if (data.inboundItemId) {
      await this.prisma.inboundItem.update({
        where: { id: data.inboundItemId },
        data: { tasksGenerated: { increment: 1 } },
      }).catch(console.error);
    }

    // Trigger case status recalculation when task is created
    if (task.emailId) {
      this.triggerCaseStatusRecalculation(task.emailId).catch(console.error);
    }

    return task;
  }

  async getTasks(filters?: {
    status?: string;
    assigneeId?: string;
    requestType?: string;
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.requestType) where.requestType = filters.requestType;

    return this.prisma.task.findMany({
      where,
      include: { email: true, assignee: true, dependencies: true, comments: true, erpDocument: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTaskById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        email: true,
        assignee: true,
        dependencies: { include: { dependency: true } },
        dependents: { include: { dependent: true } },
        comments: { include: { user: true } },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async updateTask(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    assigneeId?: string;
    dueDate?: string | Date;
  }) {
    return this.prisma.task.update({
      where: { id },
      data,
      include: { email: true, assignee: true },
    });
  }

  async approveTask(id: string, assigneeId: string, userId: string) {
    const currentTask = await this.prisma.task.findUnique({ where: { id } });
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        status: TASK_STATUS.APPROVED,
        assigneeId,
        assignedAt: new Date(),
      },
      include: { email: true },
    });

    // Create audit log only if userId is provided
    if (userId) {
      try {
        await this.prisma.auditLog.create({
          data: {
            userId,
            taskId: id,
            action: 'APPROVE',
            details: JSON.stringify({ message: `Task approved and assigned to ${assigneeId}` }),
          },
        });
      } catch (error) {
        console.warn('Failed to create audit log:', error);
      }
    }

    await this.recordStatusChange(id, currentTask?.status || null, TASK_STATUS.APPROVED, userId, `Assigned to ${assigneeId}`);

    // Trigger case recalculation when task is approved
    if (task.emailId) {
      this.triggerCaseRecalculation(task.emailId).catch(console.error);
    }

    return task;
  }

  async rejectTask(id: string, userId: string, reason?: string) {
    const task = await this.prisma.task.update({
      where: { id },
      data: { status: TASK_STATUS.REJECTED },
      include: { email: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        taskId: id,
        action: 'REJECT',
        details: JSON.stringify({ message: reason || 'Task rejected' }),
      },
    });

    return task;
  }

  async updateStatus(id: string, status: string, userId: string) {
    const currentTask = await this.prisma.task.findUnique({ where: { id } });
    
    // Set startedAt when status changes to IN_PROGRESS
    const updateData: any = { status };
    if (status === TASK_STATUS.IN_PROGRESS && !currentTask?.startedAt) {
      updateData.startedAt = new Date();
    }
    // Set completedAt when status changes to DONE
    if (status === TASK_STATUS.DONE && !currentTask?.completedAt) {
      updateData.completedAt = new Date();
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: { assignee: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        taskId: id,
        action: `STATUS_CHANGE_${status}`,
        details: JSON.stringify({ message: `Task status changed to ${status}` }),
      },
    });

    await this.recordStatusChange(id, currentTask?.status || null, status, userId);

    // Trigger case recalculation when task status changes to DONE
    if (status === TASK_STATUS.DONE && task.emailId) {
      this.triggerCaseRecalculation(task.emailId).catch(console.error);
    }

    return task;
  }

  /**
   * Complete a task with result and optional delay reason
   */
  async completeTask(
    id: string,
    completionResult: 'FULL' | 'PARTIAL' | 'FAILED',
    userId: string,
    delayReasonCode?: string,
    delayReasonText?: string
  ) {
    const currentTask = await this.prisma.task.findUnique({ where: { id } });
    
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        status: TASK_STATUS.DONE,
        completedAt: new Date(),
        completionResult,
        delayReasonCode,
        delayReasonText,
      },
      include: { email: true, assignee: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        taskId: id,
        action: `COMPLETE_${completionResult}`,
        details: JSON.stringify({ 
          message: `Task completed with result: ${completionResult}`,
          delayReasonCode,
          delayReasonText 
        }),
      },
    });

    await this.recordStatusChange(id, currentTask?.status || null, TASK_STATUS.DONE, userId, `Completed: ${completionResult}`);

    // Trigger case recalculation when task is completed
    if (task.emailId) {
      this.triggerCaseRecalculation(task.emailId).catch(console.error);
    }

    return task;
  }

  /**
   * Update isRequiredForCase flag on a task
   */
  async updateIsRequiredForCase(id: string, isRequiredForCase: boolean, userId: string) {
    const currentTask = await this.prisma.task.findUnique({ where: { id } });
    
    const task = await this.prisma.task.update({
      where: { id },
      data: { isRequiredForCase },
      include: { email: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        taskId: id,
        action: 'UPDATE_IS_REQUIRED_FOR_CASE',
        details: JSON.stringify({ 
          message: `Task isRequiredForCase changed to ${isRequiredForCase}`,
          previousValue: currentTask?.isRequiredForCase,
          newValue: isRequiredForCase,
        }),
      },
    });

    // Trigger case recalculation when isRequiredForCase changes
    if (task.emailId) {
      this.triggerCaseRecalculation(task.emailId).catch(console.error);
    }

    return task;
  }

  /**
   * Helper method to trigger case recalculation (fire and forget)
   */
  private async triggerCaseRecalculation(emailId: string): Promise<void> {
    try {
      const emailCase = await this.prisma.emailCase.findUnique({
        where: { emailId },
      });
      if (emailCase) {
        // Recalculate both status and KPI fields
        await this.caseAggregationService.recalculateCaseStatus(emailId);
        await this.caseAggregationService.recalculateCase(emailCase.id);
      }
    } catch (error) {
      console.error('Failed to trigger case recalculation:', error);
    }
  }

  /**
   * Trigger case status recalculation (lighter weight)
   */
  private async triggerCaseStatusRecalculation(emailId: string): Promise<void> {
    try {
      await this.caseAggregationService.recalculateCaseStatus(emailId);
    } catch (error) {
      console.error('Failed to trigger case status recalculation:', error);
    }
  }

  async addComment(taskId: string, userId: string, content: string) {
    return this.prisma.taskComment.create({
      data: {
        taskId,
        userId,
        content,
      },
      include: { user: true },
    });
  }

  async getTasksByRole(role: string) {
    const roleRequestTypes: Record<string, string[]> = {
      [ROLES.MANAGER]: [],
      [ROLES.RECEPTION_COORDINATOR]: ['INBOUND_RECEIPT'],
      [ROLES.DELIVERY_COORDINATOR]: ['OUTBOUND_PREPARATION', 'OUTBOUND_DELIVERY'],
      [ROLES.DISTRIBUTION_COORDINATOR]: ['TRANSFER_DISTRIBUTION'],
    };

    const requestTypes = roleRequestTypes[role];
    if (!requestTypes || requestTypes.length === 0) {
      return this.getTasks({ status: TASK_STATUS.APPROVED });
    }

    return this.prisma.task.findMany({
      where: {
        requestType: { in: requestTypes },
        status: TASK_STATUS.APPROVED,
      },
      include: { email: true, assignee: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
