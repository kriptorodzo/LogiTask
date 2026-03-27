import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface NotificationPayload {
  userId: string;
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_STATUS_CHANGED' | 'EMAIL_RECEIVED';
  title: string;
  message: string;
  taskId?: string;
  emailId?: string;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(payload: NotificationPayload) {
    return this.prisma.auditLog.create({
      data: {
        userId: payload.userId,
        taskId: payload.taskId,
        action: `NOTIFICATION_${payload.type}`,
        details: JSON.stringify({
          title: payload.title,
          message: payload.message,
          type: payload.type,
          emailId: payload.emailId,
        }),
      },
    });
  }

  async getUserNotifications(userId: string, limit = 20) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
        action: { startsWith: 'NOTIFICATION_' },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string) {
    return { success: true, message: 'Notification marked as read' };
  }

  async notifyTaskAssigned(taskId: string, assigneeId: string, taskTitle: string) {
    return this.createNotification({
      userId: assigneeId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${taskTitle}`,
      taskId,
    });
  }

  async notifyTaskStatusChange(taskId: string, userId: string, newStatus: string, taskTitle: string) {
    return this.createNotification({
      userId,
      type: 'TASK_STATUS_CHANGED',
      title: 'Task Status Updated',
      message: `Task "${taskTitle}" status changed to ${newStatus}`,
      taskId,
    });
  }

  async notifyTaskUpdated(taskId: string, userId: string, taskTitle: string, changes: string) {
    return this.createNotification({
      userId,
      type: 'TASK_UPDATED',
      title: 'Task Updated',
      message: `Task "${taskTitle}" has been updated: ${changes}`,
      taskId,
    });
  }

  async notifyNewEmailReview(managerId: string, emailId: string, subject: string) {
    return this.createNotification({
      userId: managerId,
      type: 'EMAIL_RECEIVED',
      title: 'New Email for Review',
      message: `New email requires your review: ${subject}`,
      emailId,
    });
  }

  async getUnreadCount(userId: string) {
    const notifications = await this.getUserNotifications(userId, 100);
    return { count: notifications.length };
  }
}
