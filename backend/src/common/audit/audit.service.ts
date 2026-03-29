import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log an action to the audit trail
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Store in database if available, otherwise log to console
      if (this.prisma) {
        // For PostgreSQL, we'd create an AuditLog table
        // For now, log to console with structured data
        this.logger.log(`[AUDIT] ${entry.action} by ${entry.userEmail || entry.userId} on ${entry.entityType}:${entry.entityId}`, JSON.stringify({
          userId: entry.userId,
          userEmail: entry.userEmail,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress,
          timestamp: entry.timestamp || new Date().toISOString(),
        }));
      }
    } catch (error) {
      this.logger.error('Failed to write audit log', error);
    }
  }

  /**
   * Log user authentication
   */
  async logAuth(userId: string, userEmail: string, action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED', metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      entityType: 'AUTH',
      metadata,
    });
  }

  /**
   * Log task action
   */
  async logTask(userId: string, userEmail: string, action: string, taskId: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      entityType: 'TASK',
      entityId: taskId,
      metadata,
    });
  }

  /**
   * Log email action
   */
  async logEmail(userId: string, userEmail: string, action: string, emailId: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      entityType: 'EMAIL',
      entityId: emailId,
      metadata,
    });
  }

  /**
   * Log report generation
   */
  async logReport(userId: string, userEmail: string, reportType: string, filters: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: 'GENERATE_REPORT',
      entityType: 'REPORT',
      metadata: { reportType, filters },
    });
  }

  /**
   * Log KPI recalculation
   */
  async logRecalculate(userId: string, userEmail: string, dateRange: { from: string; to: string }, caseCount: number): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: 'RECALCULATE_KPI',
      entityType: 'REPORT',
      metadata: { dateRange, caseCount },
    });
  }

  /**
   * Log ERP import
   */
  async logErpImport(userId: string, userEmail: string, batchId: string, rowCount: number, successCount: number, errorCount: number): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: 'ERP_IMPORT',
      entityType: 'ERP_BATCH',
      entityId: batchId,
      metadata: { rowCount, successCount, errorCount },
    });
  }

  /**
   * Log configuration change
   */
  async logConfig(userId: string, userEmail: string, configKey: string, oldValue: any, newValue: any): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: 'CONFIG_CHANGE',
      entityType: 'CONFIG',
      metadata: { configKey, oldValue, newValue },
    });
  }

  /**
   * Query audit logs (for admin review)
   */
  async queryLogs(filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    // In production, this would query the database
    // For now, return empty array (logs are console-only)
    return [];
  }
}