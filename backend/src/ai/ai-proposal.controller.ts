/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                            AI PROPOSAL CONTROLLER                                              ║
 * ║                                                                                               ║
 * ║  REST endpoints for full AI proposal operations                                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════╝
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
} from '@nestjs/common';
import { AiProposalService } from './ai-proposal.service';
import {
  AiProposalContract,
  GenerateProposalRequest,
  ProposalFeedbackRequest,
} from './ai-proposal.types';

@Controller('ai-proposals')
export class AiProposalController {
  private readonly logger = new Logger(AiProposalController.name);

  constructor(private aiService: AiProposalService) {}

  /**
   * POST /ai-proposals/generate/:inboundItemId
   * Generate a new proposal for an inbound item
   */
  @Post('generate/:inboundItemId')
  @HttpCode(HttpStatus.CREATED)
  async generateProposal(
    @Param('inboundItemId') inboundItemId: string,
    @Body() body?: { regenerate?: boolean }
  ): Promise<AiProposalContract> {
    this.logger.log(`Generating proposal for ${inboundItemId}`);
    return this.aiService.generateProposal(inboundItemId, body?.regenerate);
  }

  /**
   * POST /ai-proposals/generate
   * Generate proposal (alternative endpoint)
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateProposalBody(
    @Body() request: GenerateProposalRequest
  ): Promise<AiProposalContract> {
    this.logger.log(`Generating proposal for ${request.inboundItemId}`);
    return this.aiService.generateProposal(request.inboundItemId, request.regenerate);
  }

  /**
   * GET /ai-proposals/:inboundItemId
   * Get existing proposal for an inbound item
   */
  @Get(':inboundItemId')
  @HttpCode(HttpStatus.OK)
  async getProposal(
    @Param('inboundItemId') inboundItemId: string
  ): Promise<AiProposalContract | null> {
    this.logger.log(`Getting proposal for ${inboundItemId}`);
    return this.aiService.getProposalByInboundItem(inboundItemId);
  }

  /**
   * POST /ai-proposals/:proposalId/feedback
   * Record manager feedback on a proposal
   */
  @Post(':proposalId/feedback')
  @HttpCode(HttpStatus.CREATED)
  async recordFeedback(
    @Param('proposalId') proposalId: string,
    @Body() feedback: ProposalFeedbackRequest
  ): Promise<{ accepted: boolean }> {
    this.logger.log(`Recording feedback for proposal ${proposalId}`);
    await this.aiService.saveFeedback({ ...feedback, proposalId });
    return { accepted: true };
  }

  /**
   * POST /ai-proposals/batch
   * Generate proposals for multiple items
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async batchGenerate(
    @Body() body: { inboundItemIds: string[] }
  ): Promise<AiProposalContract[]> {
    this.logger.log(`Batch generating ${body.inboundItemIds.length} proposals`);
    const proposals = await Promise.all(
      body.inboundItemIds.map(id => this.aiService.generateProposal(id))
    );
    return proposals;
  }

  /**
   * GET /ai-proposals/health
   * Health check
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<{ status: string; service: string }> {
    return {
      status: 'ok',
      service: 'ai-proposal-v1-full',
    };
  }
}