/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                            AI MODULE                                            ║
 * ║                                                                                  ║
 * ║  NestJS module for AI proposal service                                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Module } from '@nestjs/common';
import { AiProposalController } from './ai-proposal.controller';
import { AiProposalService } from './ai-proposal.service';

@Module({
  controllers: [AiProposalController],
  providers: [AiProposalService],
  exports: [AiProposalService],
})
export class AiModule {}