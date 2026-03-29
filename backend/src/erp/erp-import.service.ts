import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ERP_DOCUMENT_TYPES,
  ERP_IMPORT_STATUS,
  ERP_SOURCE_TYPES,
  ERP_TASK_TEMPLATES,
  getNextRouteDate,
  getRouteDate,
  formatDate,
} from './erp.constants';
import { UserService } from '../user/user.service';

export interface ErpImportRow {
  documentType: string;
  documentNumber: string;
  partnerName?: string;
  partnerCode?: string;
  destinationName?: string;
  destinationCode?: string;
  lineCount?: number;
  totalQuantity?: number;
  plannedDate?: string;
}

export interface ErpImportResult {
  batchId: string;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  errors: string[];
  documents: Array<{
    id: string;
    documentNumber: string;
    documentType: string;
    taskId?: string;
  }>;
}

@Injectable()
export class ErpImportService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  /**
   * Import ERP documents from parsed rows
   */
  async importDocuments(
    rows: ErpImportRow[],
    fileName: string,
    importedBy?: string,
  ): Promise<ErpImportResult> {
    // Create batch record
    const batch = await this.prisma.erpImportBatch.create({
      data: {
        fileName,
        status: ERP_IMPORT_STATUS.PROCESSING,
        totalRows: rows.length,
        importedBy,
      },
    });

    const errors: string[] = [];
    const documents: ErpImportResult['documents'] = [];

    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const doc = await this.processRow(row, batch.id);
          if (doc) {
            documents.push({
              id: doc.id,
              documentNumber: doc.documentNumber,
              documentType: doc.documentType,
              taskId: doc.taskId || undefined,
            });
          }
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      // Update batch status
      await this.prisma.erpImportBatch.update({
        where: { id: batch.id },
        data: {
          status: errors.length === rows.length 
            ? ERP_IMPORT_STATUS.FAILED 
            : ERP_IMPORT_STATUS.COMPLETED,
          processedRows: rows.length - errors.length,
          errorRows: errors.length,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          completedAt: new Date(),
        },
      });

      return {
        batchId: batch.id,
        totalRows: rows.length,
        processedRows: rows.length - errors.length,
        errorRows: errors.length,
        errors,
        documents,
      };
    } catch (error: any) {
      // Update batch as failed
      await this.prisma.erpImportBatch.update({
        where: { id: batch.id },
        data: {
          status: ERP_IMPORT_STATUS.FAILED,
          errors: JSON.stringify([error.message]),
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Process a single row and create ERP document + task
   */
  private async processRow(row: ErpImportRow, batchId: string): Promise<{
    id: string;
    documentNumber: string;
    documentType: string;
    taskId?: string;
  } | null> {
    // Validate required fields
    if (!row.documentType || !row.documentNumber) {
      throw new Error('Missing documentType or documentNumber');
    }

    // Normalize document type
    const docType = this.normalizeDocumentType(row.documentType);
    if (!docType) {
      throw new Error(`Invalid documentType: ${row.documentType}`);
    }

    // Parse planned date if provided
    let plannedDate: Date | undefined;
    if (row.plannedDate) {
      plannedDate = new Date(row.plannedDate);
      if (isNaN(plannedDate.getTime())) {
        throw new Error(`Invalid plannedDate: ${row.plannedDate}`);
      }
    }

    // Create ERP document
    const erpDocument = await this.prisma.erpDocument.create({
      data: {
        batchId,
        sourceType: ERP_SOURCE_TYPES.ERP_IMPORT,
        documentType: docType,
        documentNumber: row.documentNumber,
        partnerName: row.partnerName,
        partnerCode: row.partnerCode,
        destinationName: row.destinationName,
        destinationCode: row.destinationCode,
        lineCount: row.lineCount || 0,
        totalQuantity: row.totalQuantity || 0,
        plannedDate,
        rawPayloadJson: JSON.stringify(row),
      },
    });

    // Create task based on document type
    const task = await this.createErpTask(erpDocument);

    if (task) {
      // Update document with task ID
      await this.prisma.erpDocument.update({
        where: { id: erpDocument.id },
        data: { taskId: task.id },
      });

      return {
        id: erpDocument.id,
        documentNumber: erpDocument.documentNumber,
        documentType: erpDocument.documentType,
        taskId: task.id,
      };
    }

    return {
      id: erpDocument.id,
      documentNumber: erpDocument.documentNumber,
      documentType: erpDocument.documentType,
    };
  }

  /**
   * Create task from ERP document
   */
  private async createErpTask(erpDocument: any): Promise<any> {
    const template = ERP_TASK_TEMPLATES[erpDocument.documentType as keyof typeof ERP_TASK_TEMPLATES];
    if (!template) {
      return null;
    }

    // Find user with the required role
    const users = await this.userService.getCoordinatorsByRole(template.assigneeRole);
    const assignee = users.length > 0 ? users[0] : null;
    if (!assignee) {
      console.warn(`No user found with role ${template.assigneeRole}`);
      return null;
    }

    // Calculate due date based on route plan
    let dueDate: Date | undefined;
    let description = '';

    // Add partner/destination info to description
    if (erpDocument.partnerName) {
      description += `Partner: ${erpDocument.partnerName}\n`;
    }
    if (erpDocument.destinationName) {
      description += `Destination: ${erpDocument.destinationName}\n`;
    }
    if (erpDocument.lineCount) {
      description += `Line items: ${erpDocument.lineCount}\n`;
    }
    if (erpDocument.totalQuantity) {
      description += `Total quantity: ${erpDocument.totalQuantity}\n`;
    }

    // Check for route plan if destination exists
    if (erpDocument.destinationCode) {
      const routePlan = await this.prisma.routePlan.findUnique({
        where: { destinationCode: erpDocument.destinationCode },
      });

      if (routePlan && routePlan.active) {
        if (erpDocument.documentType === ERP_DOCUMENT_TYPES.SALES_ORDER ||
            erpDocument.documentType === ERP_DOCUMENT_TYPES.SHIPMENT_ORDER) {
          // Distribution task - use route day
          dueDate = getRouteDate(routePlan.routeDay);
          description += `Route day: ${routePlan.routeDay}\n`;
        } else {
          // Receiving task - use prep offset
          dueDate = getNextRouteDate(routePlan.routeDay, routePlan.prepOffsetDays);
          description += `Prep offset: ${routePlan.prepOffsetDays} days before route`;
        }
      }
    }

    // If no route plan, use planned date or today
    if (!dueDate && erpDocument.plannedDate) {
      dueDate = erpDocument.plannedDate;
    } else if (!dueDate) {
      dueDate = new Date();
    }

    // Create task
    return this.prisma.task.create({
      data: {
        title: template.title,
        description: description.trim(),
        status: 'ASSIGNED', // No PROPOSED for ERP - goes directly to ASSIGNED
        requestType: template.requestType,
        assigneeId: assignee.id,
        dueDate,
        erpDocumentId: erpDocument.id,
        assignedAt: new Date(),
      },
    });
  }

  /**
   * Normalize document type string
   */
  private normalizeDocumentType(type: string): string | null {
    const normalized = type.toUpperCase().trim().replace(/[\s-]/g, '_');
    
    const typeMap: Record<string, string> = {
      'PO': ERP_DOCUMENT_TYPES.PURCHASE_ORDER,
      'PURCHASE_ORDER': ERP_DOCUMENT_TYPES.PURCHASE_ORDER,
      'GR': ERP_DOCUMENT_TYPES.GOODS_RECEIPT,
      'GOODS_RECEIPT': ERP_DOCUMENT_TYPES.GOODS_RECEIPT,
      'SO': ERP_DOCUMENT_TYPES.SALES_ORDER,
      'SALES_ORDER': ERP_DOCUMENT_TYPES.SALES_ORDER,
      'SHIP': ERP_DOCUMENT_TYPES.SHIPMENT_ORDER,
      'SHIPMENT_ORDER': ERP_DOCUMENT_TYPES.SHIPMENT_ORDER,
    };

    return typeMap[normalized] || null;
  }

  /**
   * Get import batch status
   */
  async getBatchStatus(batchId: string) {
    const batch = await this.prisma.erpImportBatch.findUnique({
      where: { id: batchId },
      include: {
        erpDocuments: {
          include: {
            // task: true, // No relation, query separately
          },
        },
      },
    });

    if (!batch) {
      return null;
    }

    return {
      ...batch,
      documents: batch.erpDocuments,
      errors: batch.errors ? JSON.parse(batch.errors) : [],
    };
  }

  /**
   * Get all route plans
   */
  async getRoutePlans(activeOnly = true) {
    return this.prisma.routePlan.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { destinationName: 'asc' },
    });
  }

  /**
   * Create or update route plan
   */
  async upsertRoutePlan(data: {
    destinationCode: string;
    destinationName: string;
    routeDay: string;
    prepOffsetDays?: number;
    active?: boolean;
  }) {
    return this.prisma.routePlan.upsert({
      where: { destinationCode: data.destinationCode },
      create: {
        destinationCode: data.destinationCode,
        destinationName: data.destinationName,
        routeDay: data.routeDay,
        prepOffsetDays: data.prepOffsetDays ?? 1,
        active: data.active ?? true,
      },
      update: {
        destinationName: data.destinationName,
        routeDay: data.routeDay,
        prepOffsetDays: data.prepOffsetDays ?? 1,
        active: data.active ?? true,
      },
    });
  }
}