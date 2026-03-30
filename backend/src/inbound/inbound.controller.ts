import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { InboundService } from './inbound.service';

@Controller('inbound')
export class InboundController {
  constructor(private inboundService: InboundService) {}

  /**
   * GET /inbound - List all inbound items
   */
  @Get()
  async getInboundItems(
    @Query('sourceType') sourceType?: string,
    @Query('processingStatus') processingStatus?: string,
    @Query('requestType') requestType?: string,
    @Query('priority') priority?: string,
  ) {
    return this.inboundService.getInboundItems({
      sourceType,
      processingStatus,
      requestType,
      priority,
    });
  }

  /**
   * GET /inbound/summary - Manager dashboard summary
   */
  @Get('summary')
  async getManagerSummary() {
    return this.inboundService.getManagerSummary();
  }

  /**
   * GET /inbound/coordinator/:userId - Coordinator workboard
   */
  @Get('coordinator/:userId')
  async getCoordinatorSummary(@Param('userId') userId: string) {
    return this.inboundService.getCoordinatorSummary(userId);
  }

  /**
   * GET /inbound/:id - Get single inbound item
   */
  @Get(':id')
  async getInboundItem(@Param('id') id: string) {
    return this.inboundService.getInboundItemById(id);
  }

  /**
   * PATCH /inbound/:id/process - Process inbound item
   */
  @Patch(':id/process')
  async processInboundItem(
    @Param('id') id: string,
    @Body() data: {
      requestType?: string;
      priority?: string;
      supplierName?: string;
      locationName?: string;
      dueDate?: string;
    },
  ) {
    return this.inboundService.processInboundItem(id, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
  }
}