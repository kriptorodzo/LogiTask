/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                            AI PROPOSAL SERVICE                                       ║
 * ║                                                                                  ║
 * ║  Role: Proposal/Copilot layer (NOT auto-execution)                                  ║
 * ║  Reads: InboundItem, Email, ERP data                                               ║
 * ║  Generates: proposal for classification, priority, coordinator                   ║
 * ║  Manager remains final decision-maker                                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AiProposalDto,
  CoordinatorSuggestion,
  TaskProposal,
  DataQualityFlag,
  ConfidenceLevel,
  RequestType,
  Priority,
  CoordinatorType,
} from './ai-proposal.types';

/**
 * Classification keywords by request type
 */
interface KeywordConfig {
  keywords: string[];
  coordinatorType: CoordinatorType;
}

const KEYWORDS: Record<string, KeywordConfig> = {
  INBOUND_RECEIPT: {
    keywords: ['потврда', 'нарачка', 'испорака', 'пристигнува', 'набавка', 'купување', 'добивање'],
    coordinatorType: CoordinatorType.RECEPTION,
  },
  OUTBOUND_DELIVERY: {
    keywords: ['испорака', 'достава', 'курир', 'extern', 'клиент', 'пратка'],
    coordinatorType: CoordinatorType.DELIVERY,
  },
  OUTBOUND_PREPARATION: {
    keywords: ['подготовка', 'пакување', 'сортирање', 'етикета'],
    coordinatorType: CoordinatorType.DELIVERY,
  },
  TRANSFER_DISTRIBUTION: {
    keywords: ['трансфер', 'преместување', 'подигнување', 'дистрибуција', 'пренос'],
    coordinatorType: CoordinatorType.DISTRIBUTION,
  },
  OTHER: {
    keywords: [],
    coordinatorType: CoordinatorType.RECEPTION,
  },
};

/**
 * Priority keywords
 */
const PRIORITY_KEYWORDS: Record<Priority, string[]> = {
  [Priority.HIGH]: [' urgent', 'хит', 'итно', 'rush', 'asap', 'брзо', 'до утре', 'денес'],
  [Priority.MEDIUM]: ['нормално', 'обично', 'standard'],
  [Priority.LOW]: ['кога мож', 'кога сака', 'без грижи'],
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate proposal for an inbound item
   */
  async generateProposal(inboundItemId: string): Promise<AiProposalDto> {
    this.logger.log(`Generating proposal for ${inboundItemId}`);

    // Load inbound item with related data
    const inboundItem = await this.prisma.inboundItem.findUnique({
      where: { id: inboundItemId },
      include: {
        emails: true,
        erpDocuments: true,
        tasks: true,
        cases: true,
      },
    });

    if (!inboundItem) {
      throw new Error(`Inbound item not found: ${inboundItemId}`);
    }

    // Build content for analysis
    const content = this.buildContent(inboundItem);

    // Analyze for classification
    const { requestType, confidence: reqConfidence } = this.analyzeRequestType(content);
    const { priority, confidence: priConfidence } = this.analyzePriority(content);
    const { supplier, location, dueDate, flags } = this.analyzeContent(content);

    // Determine coordinator type
    const coordinatorType = KEYWORDS[requestType].coordinatorType;
    const coordinatorSuggestions = await this.suggestCoordinators(coordinatorType);

    // Generate task proposals
    const taskProposals = this.generateTaskProposals(
      requestType,
      inboundItem.subject || 'Inbound Item',
      coordinatorType
    );

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      reqConfidence,
      priConfidence,
      flags
    );

    return {
      id: `proposal-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      inboundItemId: inboundItem.id,
      modelName: 'logitask-v1-rules',
      generatedAt: new Date().toISOString(),
      suggestedRequestType: requestType,
      requestTypeConfidence: reqConfidence,
      suggestedPriority: priority,
      priorityConfidence: priConfidence,
      suggestedSupplierName: supplier,
      suggestedLocation: location,
      suggestedDueDate: dueDate,
      suggestedCoordinatorType: coordinatorType,
      coordinatorConfidence: 0.75,
      coordinatorSuggestions,
      suggestedTaskCount: taskProposals.length,
      taskProposals,
      dataQualityFlags: flags,
      overallConfidence,
      summary: this.generateSummary(requestType, priority, flags),
      reasoning: this.generateReasoning(requestType, priority, supplier, flags),
    };
  }

  /**
   * Build content string from inbound item
   */
  private buildContent(item: any): string {
    const parts: string[] = [];

    if (item.subject) parts.push(item.subject);
    if (item.requestType) parts.push(item.requestType);
    if (item.supplierName) parts.push(item.supplierName);
    if (item.locationName) parts.push(item.locationName);
    if (item.priority) parts.push(item.priority);

    for (const email of item.emails || []) {
      if (email.subject) parts.push(email.subject);
      if (email.body) parts.push(email.body);
      if (email.sender) parts.push(email.sender);
    }

    for (const doc of item.erpDocuments || []) {
      if (doc.documentNumber) parts.push(doc.documentNumber);
      if (doc.partnerName) parts.push(doc.partnerName);
    }

    return parts.join(' ').toLowerCase();
  }

  /**
   * Analyze content for request type
   */
  private analyzeRequestType(content: string): { requestType: RequestType; confidence: number } {
    const scores: { type: RequestType; score: number }[] = [];

    for (const [type, config] of Object.entries(KEYWORDS)) {
      let score = 0;
      for (const keyword of config.keywords) {
        if (content.includes(keyword)) {
          score += keyword.length; // Longer matches count more
        }
      }
      scores.push({ type: type as RequestType, score });
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    const confidence = best.score > 0 ? Math.min(0.5 + best.score / 100, 0.95) : 0.3;

    // Fall back to existing classification if available
    return {
      requestType: best.score > 0 ? best.type : RequestType.OTHER,
      confidence,
    };
  }

  /**
   * Analyze content for priority
   */
  private analyzePriority(content: string): { priority: Priority; confidence: number } {
    const scores: { type: Priority; score: number }[] = [];

    for (const [type, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          score += keyword.length;
        }
      }
      scores.push({ type: type as Priority, score });
    }

    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];
    const confidence = best.score > 0 ? Math.min(0.5 + best.score / 50, 0.95) : 0.3;

    return { priority: best.type, confidence };
  }

  /**
   * Analyze content for supplier, location, due date, and flags
   */
  private analyzeContent(content: string): {
    supplier?: string;
    location?: string;
    dueDate?: string;
    flags: DataQualityFlag[];
  } {
    const flags: DataQualityFlag[] = [];

    // Check for missing data
    // Note: In real implementation, this would query the inboundItem fields

    // Detect common patterns
    if (content.includes('проблем') || content.includes('issue')) {
      flags.push(DataQualityFlag.AMBIGUOUS_CONTENT);
    }

    if (content.includes('дупликат') || content.includes('duplicate')) {
      flags.push(DataQualityFlag.DUPLICATE_DETECTED);
    }

    return {
      supplier: undefined, // Would extract from fields
      location: undefined,
      dueDate: undefined,
      flags,
    };
  }

  /**
   * Suggest coordinators for a type
   */
  private async suggestCoordinators(
    coordinatorType: CoordinatorType
  ): Promise<CoordinatorSuggestion[]> {
    const role = this.coordinatorTypeToRole(coordinatorType);

    const coordinators = await this.prisma.user.findMany({
      where: { role, isActive: true },
      take: 5,
    });

    return coordinators.map((co, i) => ({
      coordinatorId: co.id,
      email: co.email,
      displayName: co.displayName || co.email,
      role: coordinatorType,
      matchScore: 1 - i * 0.15, // Decreasing score
      rationale: `Based on role match and workload`,
    }));
  }

  /**
   * Convert coordinator type to role string
   */
  private coordinatorTypeToRole(type: CoordinatorType): string {
    const roleMap: Record<CoordinatorType, string> = {
      [CoordinatorType.RECEPTION]: 'RECEPTION_COORDINATOR',
      [CoordinatorType.DELIVERY]: 'DELIVERY_COORDINATOR',
      [CoordinatorType.DISTRIBUTION]: 'DISTRIBUTION_COORDINATOR',
    };
    return roleMap[type];
  }

  /**
   * Generate task proposals
   */
  private generateTaskProposals(
    requestType: RequestType,
    subject: string,
    coordinatorType: CoordinatorType
  ): TaskProposal[] {
    const taskTemplates: Record<RequestType, string[]> = {
      [RequestType.INBOUND_RECEIPT]: [
        'Провери и евидентирај документите',
        'Потврди прием',
      ],
      [RequestType.OUTBOUND_DELIVERY]: [
        'Подготови испорака',
        'Organize delivery',
      ],
      [RequestType.OUTBOUND_PREPARATION]: [
        'Подготови пратка',
        'Apply labels',
      ],
      [RequestType.TRANSFER_DISTRIBUTION]: [
        'Подготови трансфер',
        'Coordinate pickup',
      ],
      [RequestType.OTHER]: [
        'Process request',
      ],
    };

    const titles = taskTemplates[requestType] || taskTemplates[RequestType.OTHER];

    return titles.map((title, i) => ({
      taskIndex: i + 1,
      title,
      description: `${title} - ${subject}`,
      requestType,
      suggestedRole: coordinatorType,
      confidence: 0.8 - i * 0.1,
      notes: undefined,
    }));
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(
    reqConf: number,
    priConf: number,
    flags: DataQualityFlag[]
  ): ConfidenceLevel {
    let avg = (reqConf + priConf) / 2;

    // Reduce confidence if there are flags
    if (flags.length > 0) {
      avg -= flags.length * 0.1;
    }

    if (avg >= 0.8) return ConfidenceLevel.HIGH;
    if (avg >= 0.5) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }

  /**
   * Generate summary
   */
  private generateSummary(
    requestType: RequestType,
    priority: Priority,
    flags: DataQualityFlag[]
  ): string {
    const parts: string[] = [];

    parts.push(`Type: ${requestType}`);
    parts.push(`Priority: ${priority}`);

    if (flags.length > 0) {
      parts.push(`Flags: ${flags.join(', ')}`);
    }

    return parts.join(' | ');
  }

  /**
   * Generate reasoning
   */
  private generateReasoning(
    requestType: RequestType,
    priority: Priority,
    supplier: string | undefined,
    flags: DataQualityFlag[]
  ): string {
    const reasons: string[] = [];

    reasons.push(`Classified as ${requestType} based on content analysis`);

    if (priority === Priority.HIGH) {
      reasons.push('Marked HIGH priority due to urgent keywords');
    }

    if (supplier) {
      reasons.push(`Supplier detected: ${supplier}`);
    }

    if (flags.length > 0) {
      reasons.push(`${flags.length} data quality flags identified`);
    }

    return reasons.join('. ');
  }
}