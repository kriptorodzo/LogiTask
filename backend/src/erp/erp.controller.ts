import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ErpImportService, ErpImportRow } from './erp-import.service';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ERP_DOCUMENT_TYPES } from './erp.constants';

@Controller('erp')
@UseGuards(RolesGuard)
@Roles('MANAGER', 'ADMIN')
export class ErpController {
  constructor(
    private erpImportService: ErpImportService,
    private prisma: PrismaService,
  ) {}

  /**
   * POST /api/erp/import
   * Upload and import ERP documents from CSV/Excel
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @UploadedFile() file: any,
    @Body('rows') rowsJson: string,
  ) {
    if (!file && !rowsJson) {
      throw new BadRequestException('Either file or rows JSON is required');
    }

    let rows: ErpImportRow[] = [];

    // Parse rows from JSON body
    if (rowsJson) {
      try {
        rows = JSON.parse(rowsJson);
      } catch {
        throw new BadRequestException('Invalid rows JSON');
      }
    }

    // If file uploaded, parse it (basic CSV parsing)
    if (file) {
      rows = this.parseFile(file);
    }

    if (rows.length === 0) {
      throw new BadRequestException('No rows to import');
    }

    const result = await this.erpImportService.importDocuments(
      rows,
      file?.originalname || 'json-upload',
    );

    return result;
  }

  /**
   * GET /api/erp/batch/:id
   * Get import batch status
   */
  @Get('batch/:id')
  async getBatchStatus(@Param('id') id: string) {
    const batch = await this.erpImportService.getBatchStatus(id);
    if (!batch) {
      throw new BadRequestException('Batch not found');
    }
    return batch;
  }

  /**
   * GET /api/erp/batches
   * List all import batches
   */
  @Get('batches')
  async getBatches(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const batches = await this.prisma.erpImportBatch.findMany({
      orderBy: { importedAt: 'desc' },
      take: parseInt(pageSize),
      skip: (parseInt(page) - 1) * parseInt(pageSize),
    });

    const total = await this.prisma.erpImportBatch.count();

    return {
      batches,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };
  }

  /**
   * GET /api/erp/documents
   * List ERP documents with filters
   */
  @Get('documents')
  async getDocuments(
    @Query('documentType') documentType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const where: any = {};

    if (documentType) {
      where.documentType = documentType;
    }

    if (from || to) {
      where.plannedDate = {};
      if (from) where.plannedDate.gte = new Date(from);
      if (to) where.plannedDate.lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const [documents, total] = await Promise.all([
      this.prisma.erpDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(pageSize),
      }),
      this.prisma.erpDocument.count({ where }),
    ]);

    return {
      documents,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize)),
    };
  }

  /**
   * GET /api/erp/route-plans
   * List all route plans
   */
  @Get('route-plans')
  async getRoutePlans(@Query('active') active?: string) {
    const routePlans = await this.erpImportService.getRoutePlans(
      active !== 'false',
    );
    return { routePlans };
  }

  /**
   * POST /api/erp/route-plans
   * Create or update route plan
   */
  @Post('route-plans')
  async upsertRoutePlan(@Body() body: {
    destinationCode: string;
    destinationName: string;
    routeDay: string;
    prepOffsetDays?: number;
    active?: boolean;
  }) {
    const routePlan = await this.erpImportService.upsertRoutePlan(body);
    return { routePlan };
  }

  /**
   * POST /api/erp/event
   * Simulate ERP event (SALES_ORDER_CREATED, SHIPMENT_CREATED, etc.)
   * For testing workflow logic
   */
  @Post('event')
  async handleErpEvent(@Body() body: {
    event: string;
    documentType: string;
    documentNumber: string;
    partnerName?: string;
    destinationName?: string;
    destinationCode?: string;
    lineCount?: number;
    totalQuantity?: number;
    plannedDate?: string;
    relatedDocumentNumber?: string;
  }) {
    const result = await this.erpImportService.handleErpEvent(body.event, body);
    return result;
  }

  /**
   * GET /api/erp/document/:id
   * Get document with all its tasks
   */
  @Get('document/:id')
  async getDocument(@Param('id') id: string) {
    const document = await this.erpImportService.getDocumentWithTasks(id);
    if (!document) {
      throw new BadRequestException('Document not found');
    }
    return document;
  }

  /**
   * Simple CSV/JSON parser from file
   */
  private parseFile(file: any): ErpImportRow[] {
    const content = file.buffer.toString('utf-8');
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      return this.parseCsv(content);
    }

    if (extension === 'json') {
      return this.parseJson(content);
    }

    throw new BadRequestException('Unsupported file type. Use CSV or JSON.');
  }

  private parseCsv(content: string): ErpImportRow[] {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have header and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: ErpImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        switch (header) {
          case 'documenttype':
            row.documentType = value;
            break;
          case 'documentnumber':
            row.documentNumber = value;
            break;
          case 'partnername':
          case 'partner':
            row.partnerName = value;
            break;
          case 'partnercode':
            row.partnerCode = value;
            break;
          case 'destinationname':
          case 'destination':
            row.destinationName = value;
            break;
          case 'destinationcode':
            row.destinationCode = value;
            break;
          case 'linecount':
          case 'lines':
            row.lineCount = parseInt(value) || 0;
            break;
          case 'totalquantity':
          case 'quantity':
            row.totalQuantity = parseInt(value) || 0;
            break;
          case 'planneddate':
          case 'date':
            row.plannedDate = value;
            break;
        }
      });

      if (row.documentType && row.documentNumber) {
        rows.push(row);
      }
    }

    return rows;
  }

  private parseJson(content: string): ErpImportRow[] {
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        return data;
      }
      if (data.rows || data.documents) {
        return data.rows || data.documents;
      }
      return [data];
    } catch {
      throw new BadRequestException('Invalid JSON format');
    }
  }
}