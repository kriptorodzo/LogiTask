import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TASK_STATUS, ROLES } from '../common/constants';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async createTask(data: {
    emailId: string;
    title: string;
    description?: string;
    requestType: string;
    dueDate?: string | Date;
    assigneeId?: string;
  }) {
    return this.prisma.task.create({
      data: {
        emailId: data.emailId,
        title: data.title,
        description: data.description,
        requestType: data.requestType,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
        status: TASK_STATUS.PROPOSED,
      },
      include: { email: true, assignee: true },
    });
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
      include: { email: true, assignee: true, dependencies: true, comments: true },
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
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        status: TASK_STATUS.APPROVED,
        assigneeId,
      },
      include: { email: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        taskId: id,
        action: 'APPROVE',
        details: JSON.stringify({ message: `Task approved and assigned to ${assigneeId}` }),
      },
    });

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
    const task = await this.prisma.task.update({
      where: { id },
      data: { status },
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

    return task;
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
