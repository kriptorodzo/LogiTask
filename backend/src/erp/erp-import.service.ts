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
  buildTaskDescription,
  ERP_TASK_ROLES,
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
  relatedDocumentNumber?: string;
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
    taskIds: string[];
  }>;
}

export interface ErpEventResult {
  event: string;
  documentId: string;
  tasks: Array<{
    id: string;
    title: string;
    assigneeRole: string;
    status: string;
    dueDate?: string;
  }>;
  autoCompletedTasks?: string[];
}

@Injectable()
export class ErpImportService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async importDocuments(
    rows: ErpImportRow[],
    fileName: string,
    importedBy?: string,
  ): Promise<ErpImportResult> {
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
            documents.push(doc);
          }
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

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

  private async processRow(row: ErpImportRow, batchId: string): Promise<ErpImportResult['documents'][0] | null> {
    if (!row.documentType || !row.documentNumber) {
      throw new Error('Missing documentType or documentNumber');
    }

    const docType = this.normalizeDocumentType(row.documentType);
    if (!docType) {
      throw new Error(`Invalid documentType: ${row.documentType}`);
    }

    let plannedDate: Date | undefined;
    if (row.plannedDate) {
      plannedDate = new Date(row.plannedDate);
      if (isNaN(plannedDate.getTime())) {
        throw new Error(`Invalid plannedDate: ${row.plannedDate}`);
      }
    }

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

    // Step 1: Create InboundItem (Master Inbox)
    const sourceSubType = docType === 'PURCHASE_ORDER' ? 'ERP_PO' 
      : docType === 'GOODS_RECEIPT' ? 'ERP_GR'
      : docType === 'SALES_ORDER' ? 'ERP_SO'
      : 'ERP_SHIPMENT';

    const inboundItem = await this.prisma.inboundItem.create({
      data: {
        sourceType: 'ERP',
        sourceSubType,
        sourceId: erpDocument.id,
        sourceData: JSON.stringify(row),
        subject: `${docType}: ${row.documentNumber}`,
        supplierName: row.partnerName,
        locationName: row.destinationName,
        referenceNumber: row.documentNumber,
        requestedDate: plannedDate,
        priority: 'MEDIUM',
        requestType: this.mapDocumentTypeToRequestType(docType),
        processingStatus: 'RECLAIMED',
        receivedAt: new Date(),
        ingestedAt: new Date(),
      },
    });

    // Link ErpDocument to InboundItem
    await this.prisma.erpDocument.update({
      where: { id: erpDocument.id },
      data: { inboundItemId: inboundItem.id },
    });

    const result = await this.createErpTasks(erpDocument, row.relatedDocumentNumber);

    return {
      id: erpDocument.id,
      documentNumber: erpDocument.documentNumber,
      documentType: erpDocument.documentType,
      taskIds: result.taskIds,
    };
  }

  async handleErpEvent(event: string, data: {
    documentType: string;
    documentNumber: string;
    partnerName?: string;
    destinationName?: string;
    destinationCode?: string;
    lineCount?: number;
    totalQuantity?: number;
    plannedDate?: string;
    relatedDocumentNumber?: string;
  }): Promise<ErpEventResult> {
    const docType = this.normalizeDocumentType(data.documentType);
    if (!docType) {
      throw new Error(`Invalid documentType: ${data.documentType}`);
    }

    let plannedDate: Date | undefined;
    if (data.plannedDate) {
      plannedDate = new Date(data.plannedDate);
    }

    let erpDocument = await this.prisma.erpDocument.findFirst({
      where: { documentNumber: data.documentNumber },
    });

    if (!erpDocument) {
      erpDocument = await this.prisma.erpDocument.create({
        data: {
          batchId: null,
          sourceType: ERP_SOURCE_TYPES.MANUAL,
          documentType: docType,
          documentNumber: data.documentNumber,
          partnerName: data.partnerName || null,
          partnerCode: null,
          destinationName: data.destinationName || null,
          destinationCode: data.destinationCode || null,
          lineCount: data.lineCount || 0,
          totalQuantity: data.totalQuantity || 0,
          plannedDate,
        } as any,
      });
    }

    const result = await this.createErpTasks(erpDocument, data.relatedDocumentNumber, true);

    return {
      event,
      documentId: erpDocument.id,
      tasks: result.tasks,
      autoCompletedTasks: result.autoCompleted,
    };
  }

  private async createErpTasks(
    erpDocument: any,
    relatedDocumentNumber?: string,
    isEvent = false,
  ): Promise<{ taskIds: string[]; tasks: any[]; autoCompleted: string[] }> {
    const docType = erpDocument.documentType;
    const templates = ERP_TASK_TEMPLATES[docType];

    if (!templates || templates.length === 0) {
      return { taskIds: [], tasks: [], autoCompleted: [] };
    }

    const taskIds: string[] = [];
    const tasks: any[] = [];
    const autoCompleted: string[] = [];

    let routePlan: any = null;
    if (erpDocument.destinationCode) {
      routePlan = await this.prisma.routePlan.findUnique({
        where: { destinationCode: erpDocument.destinationCode },
      });
    }

    // SHIPMENT_ORDER: auto-complete "Подготви" from related SALES_ORDER
    if (docType === ERP_DOCUMENT_TYPES.SHIPMENT_ORDER && relatedDocumentNumber) {
      const relatedDoc = await this.prisma.erpDocument.findFirst({
        where: { documentNumber: relatedDocumentNumber },
      });

      if (relatedDoc) {
        const prepareTask = await this.prisma.task.findFirst({
          where: {
            erpDocumentId: relatedDoc.id,
            title: 'Подготви',
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
          },
        });

        if (prepareTask) {
          await this.prisma.task.update({
            where: { id: prepareTask.id },
            data: {
              status: 'DONE',
              completedAt: new Date(),
              completionResult: 'FULL',
            },
          });
          autoCompleted.push(prepareTask.id);
        }
      }
    }

    for (const template of templates) {
      const assignee = await this.getAssigneeByRole(template.assigneeRole);
      
      let dueDate: Date | undefined;
      let description = buildTaskDescription(docType, {
        partnerName: erpDocument.partnerName,
        destinationName: erpDocument.destinationName,
        destinationCode: erpDocument.destinationCode,
        lineCount: erpDocument.lineCount,
        totalQuantity: erpDocument.totalQuantity,
        documentNumber: erpDocument.documentNumber,
        plannedDate: erpDocument.plannedDate,
        routeDay: routePlan?.routeDay,
      });

      if (docType === ERP_DOCUMENT_TYPES.SALES_ORDER) {
        if (routePlan && routePlan.active) {
          dueDate = getNextRouteDate(routePlan.routeDay, routePlan.prepOffsetDays);
        } else {
          dueDate = erpDocument.plannedDate || new Date();
        }
      } else if (docType === ERP_DOCUMENT_TYPES.SHIPMENT_ORDER) {
        if (routePlan && routePlan.active) {
          dueDate = getRouteDate(routePlan.routeDay);
        } else {
          dueDate = erpDocument.plannedDate || new Date();
        }
      } else {
        dueDate = erpDocument.plannedDate || new Date();
      }

      const task = await this.prisma.task.create({
        data: {
          title: template.title,
          description,
          status: 'ASSIGNED',
          requestType: template.requestType,
          assigneeId: assignee?.id,
          dueDate,
          erpDocumentId: erpDocument.id,
          inboundItemId: erpDocument.inboundItemId, // Link to InboundItem
          assignedAt: new Date(),
        },
      });

      taskIds.push(task.id);
      tasks.push({
        id: task.id,
        title: task.title,
        assigneeRole: template.assigneeRole,
        status: task.status,
        dueDate: task.dueDate?.toISOString(),
      });

      if (taskIds.length === 1) {
        await this.prisma.erpDocument.update({
          where: { id: erpDocument.id },
          data: { taskId: task.id },
        });
      }
    }

    return { taskIds, tasks, autoCompleted };
  }

  private async getAssigneeByRole(role: string): Promise<any> {
    const users = await this.userService.getCoordinatorsByRole(role);
    return users.length > 0 ? users[0] : null;
  }

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

  private mapDocumentTypeToRequestType(docType: string): string {
    const map: Record<string, string> = {
      'PURCHASE_ORDER': 'INBOUND_RECEIPT',
      'GOODS_RECEIPT': 'INBOUND_RECEIPT',
      'SALES_ORDER': 'OUTBOUND_PREPARATION',
      'SHIPMENT_ORDER': 'TRANSFER_DISTRIBUTION',
    };
    return map[docType] || 'INBOUND_RECEIPT';
  }

  async getBatchStatus(batchId: string) {
    const batch = await this.prisma.erpImportBatch.findUnique({
      where: { id: batchId },
      include: { erpDocuments: true },
    });

    if (!batch) return null;

    return {
      ...batch,
      documents: batch.erpDocuments,
      errors: batch.errors ? JSON.parse(batch.errors) : [],
    };
  }

  async getRoutePlans(activeOnly = true) {
    return this.prisma.routePlan.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { destinationName: 'asc' },
    });
  }

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

  async getDocumentWithTasks(documentId: string) {
    const document = await this.prisma.erpDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) return null;

    const tasks = await this.prisma.task.findMany({
      where: { erpDocumentId: documentId },
      include: { assignee: true },
    });

    return { ...document, tasks };
  }
}