/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                            AI CONTROLLER                                              ║
 * ║                                                                                  ║
 * ║  REST endpoints for AI proposal operations                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════╝
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import {
  AiProposalDto,
  GenerateProposalRequest,
  ProposalFeedback,
} from './ai-proposal.types';

// Mock auth guard - in production use proper JWT guard
const MockAuthGuard = (target: any) => target;

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private aiService: AiService) {}

  /**
   * GET /ai/proposal/:inboundItemId
   * Get proposal for a specific inbound item
   */
  @Get('proposal/:inboundItemId')
  @HttpCode(HttpStatus.OK)
  async getProposal(
    @Param('inboundItemId') inboundItemId: string
  ): Promise<AiProposalDto> {
    this.logger.log(`GET /ai/proposal/${inboundItemId}`);
    return this.aiService.generateProposal(inboundItemId);
  }

  /**
   * POST /ai/proposal
   * Generate a new proposal for an inbound item
   */
  @Post('proposal')
  @HttpCode(HttpStatus.CREATED)
  async createProposal(
    @Body() request: GenerateProposalRequest
  ): Promise<AiProposalDto> {
    this.logger.log(`POST /ai/proposal for ${request.inboundItemId}`);
    return this.aiService.generateProposal(request.inboundItemId);
  }

  /**
   * POST /ai/proposals/batch
   * Generate proposals for multiple inbound items
   */
  @Post('proposals/batch')
  @HttpCode(HttpStatus.OK)
  async createBatchProposals(
    @Body() body: { inboundItemIds: string[] }
  ): Promise<AiProposalDto[]> {
    this.logger.log(`POST /ai/proposals/batch for ${body.inboundItemIds.length} items`);

    const proposals = await Promise.all(
      body.inboundItemIds.map((id) => this.aiService.generateProposal(id))
    );

    return proposals;
  }

  /**
   * POST /ai/feedback
   * Record manager feedback on a proposal
   * Note: This is a placeholder - full implementation would store feedback
   */
  @Post('feedback')
  @HttpCode(HttpStatus.CREATED)
  async recordFeedback(
    @Body() feedback: ProposalFeedback
  ): Promise<{ accepted: boolean }> {
    this.logger.log(`POST /ai/feedback for proposal ${feedback.proposalId}`);

    // In full implementation, store feedback to database
    // For now, just acknowledge receipt
    return { accepted: true };
  }

  /**
   * GET /ai/stats
   * Get AI proposal statistics
   * Note: Placeholder - full implementation would query stored stats
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats(): Promise<{
    totalProposals: number;
    averageConfidence: number;
    acceptanceRate: number;
  }> {
    this.logger.log('GET /ai/stats');

    // Placeholder - in production, query from database
    return {
      totalProposals: 0,
      averageConfidence: 0,
      acceptanceRate: 0,
    };
  }

  /**
   * GET /ai/health
   * Health check endpoint
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<{ status: string; service: string }> {
    return {
      status: 'ok',
      service: 'ai-proposal-v1',
    };
  }
}