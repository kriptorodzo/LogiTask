/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                          AI PROPOSAL SERVICE - Full Contract Implementation                             ║
 * ║                                                                                               ║
 * ║  Rules-first, AI-second approach for logistics proposal generation                                  ║
 * ║  AI does NOT auto-execute - manager is final decision-maker                                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AiProposalContract,
  RequestType,
  Priority,
  CoordinatorType,
  TaskType,
  TaskDependencyType,
  DataQualityFlagCode,
  ConfidenceLevel,
  ManagerRecommendation,
  GenerateProposalRequest,
  ProposalFeedbackRequest,
  RequestInterpretation,
  SuggestedPriority,
  CoordinatorRouting,
  ExtractedFields,
  TaskProposal,
  DataQualityFlag,
  DecisionHints,
  ModelMeta,
} from './ai-proposal.types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LOGISTIC RULES - Deterministic rules first
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

// ERP source type to request type mapping
const ERP_RULES: Record<string, RequestType> = {
  ERP_PO: RequestType.INBOUND_RECEIPT,        // Purchase Order → receipt
  ERP_SO: RequestType.TRANSFER_DISTRIBUTION, // Sales Order → distribution
  ERP_GR: RequestType.INBOUND_RECEIPT,        // Goods Receipt → receipt
  ERP_SHIP: RequestType.OUTBOUND_DELIVERY,   // Shipment → delivery
};

// Keywords for request type classification
const REQUEST_KEYWORDS: Record<RequestType, string[]> = {
  [RequestType.INBOUND_RECEIPT]: ['потврда', 'нарачка', 'пристигнува', 'добивање', 'набавка', 'goods receipt', 'прием'],
  [RequestType.OUTBOUND_DELIVERY]: ['испорака', 'достава', 'курир', 'клиент', 'спратка', 'delivery', '-extern'],
  [RequestType.OUTBOUND_PREPARATION]: ['подготовка', 'пакување', 'сортирање', 'етикета', 'prep', 'спреми'],
  [RequestType.TRANSFER_DISTRIBUTION]: ['трансфер', 'преместување', 'подигнување', 'пренос', 'земи', 'transfer'],
  [RequestType.UNCLASSIFIED]: [],
  [RequestType.OTHER]: [],
};

// Priority keywords
const PRIORITY_KEYWORDS: Record<Priority, string[]> = {
  [Priority.HIGH]: ['urgent', 'хит', 'итно', 'rush', 'asap', 'брзо', 'денес', 'утре', 'скоре'],
  [Priority.MEDIUM]: ['нормално', 'обично', 'standard', 'недела'],
  [Priority.LOW]: ['кога мож', 'кога сака', 'без грижи'],
};

// Coordinator type mapping
const COORDINATOR_FOR_TYPE: Record<RequestType, CoordinatorType> = {
  [RequestType.INBOUND_RECEIPT]: CoordinatorType.RECEPTION,
  [RequestType.OUTBOUND_PREPARATION]: CoordinatorType.DELIVERY,
  [RequestType.OUTBOUND_DELIVERY]: CoordinatorType.DELIVERY,
  [RequestType.TRANSFER_DISTRIBUTION]: CoordinatorType.DISTRIBUTION,
  [RequestType.UNCLASSIFIED]: CoordinatorType.RECEPTION,
  [RequestType.OTHER]: CoordinatorType.RECEPTION,
};

// Secondary coordinators for multi-step operations
const SECONDARY_COORDINATORS: Record<RequestType, CoordinatorType[]> = {
  [RequestType.INBOUND_RECEIPT]: [],
  [RequestType.OUTBOUND_PREPARATION]: [],
  [RequestType.OUTBOUND_DELIVERY]: [CoordinatorType.RECEPTION],
  [RequestType.TRANSFER_DISTRIBUTION]: [CoordinatorType.RECEPTION],
  [RequestType.UNCLASSIFIED]: [],
  [RequestType.OTHER]: [],
};

// Task templates
const TASK_TEMPLATES: Record<RequestType, { title: string; description: string }[]> = {
  [RequestType.INBOUND_RECEIPT]: [
    { title: 'Приеми и евидентирај документи', description: 'Провери и евидентирај ги пристигнатите документи' },
    { title: 'Потврди прием', description: 'Потврди успешен прием на стоката' },
  ],
  [RequestType.OUTBOUND_DELIVERY]: [
    { title: 'Подготови испорака', description: 'Подготови стока за испорака до клиент' },
    { title: 'Организирај транспорт', description: 'Organize delivery transport' },
  ],
  [RequestType.OUTBOUND_PREPARATION]: [
    { title: 'Подготови пратка', description: 'Подготови и спакувај ја пратката' },
    { title: 'Аплицирај етикети', description: 'Стави етикети и документација' },
  ],
  [RequestType.TRANSFER_DISTRIBUTION]: [
    { title: 'Подготови трансфер', description: 'Подготови стока за трансфер' },
    { title: 'Организирај подигнување', description: 'Координирај подигнување со друга локација' },
  ],
  [RequestType.UNCLASSIFIED]: [
    { title: 'Прегледај барање', description: 'Прегледај го барањето и определи акција' },
  ],
  [RequestType.OTHER]: [
    { title: 'Прегледај барање', description: 'Прегледај го барањето и определи акција' },
  ],
};

@Injectable()
export class AiProposalService {
  private readonly logger = new Logger(AiProposalService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Main method: Generate proposal for an inbound item
   * Uses rules-first, AI-second approach
   */
  async generateProposal(inboundItemId: string, regenerate = false): Promise<AiProposalContract> {
    this.logger.log(`Generating proposal for ${inboundItemId}`);

    // Check if proposal already exists
    if (!regenerate) {
      const existing = await this.prisma.aiProposal.findUnique({
        where: { inboundItemId },
      });
      if (existing) {
        this.logger.log(`Using existing proposal for ${inboundItemId}`);
        return this.dbToContract(existing);
      }
    }

    // Load inbound item
    const inbound = await this.prisma.inboundItem.findUnique({
      where: { id: inboundItemId },
      include: {
        emails: true,
        erpDocuments: true,
      },
    });

    if (!inbound) {
      throw new NotFoundException(`Inbound item not found: ${inboundItemId}`);
    }

    // Step 1: Apply deterministic rules first
    let requestType = this.applyRules(inbound);

    // Step 2: Analyze priority
    const priority = this.analyzePriority(inbound);

    // Step 3: Extract fields
    const extractedFields = this.extractFields(inbound);

    // Step 4: Generate data quality flags
    const flags = this.generateFlags(inbound, extractedFields);

    // Step 5: Determine coordinator routing
    const coordinatorRouting = this.determineCoordinatorRouting(requestType);

    // Step 6: Generate task proposals
    const tasks = this.generateTasks(requestType, inbound, coordinatorRouting);

    // Step 7: Calculate overall confidence
    const overallConfidence = this.calculateConfidence(requestType, flags);

    // Step 8: Build decision hints
    const decisionHints = this.buildDecisionHints(requestType, flags, overallConfidence);

    // Generate summary
    const summary = this.buildSummary(inbound, requestType, tasks);

    // Build final contract
    const contract: AiProposalContract = {
      proposalVersion: '1.0',
      inboundItemId: inbound.id,
      sourceType: inbound.sourceType || 'UNKNOWN',
      sourceSubType: inbound.sourceSubType || undefined,
      summary,
      managerRecommendation: decisionHints.shouldBlockUntilManagerReview
        ? ManagerRecommendation.NEEDS_REVIEW
        : ManagerRecommendation.SAFE_TO_APPROVE,
      overallConfidence,
      requestInterpretation: {
        suggestedRequestType: requestType,
        requestTypeConfidence: overallConfidence === ConfidenceLevel.HIGH ? 0.9 : overallConfidence === ConfidenceLevel.MEDIUM ? 0.7 : 0.4,
        businessMeaning: this.getBusinessMeaning(requestType),
        requiresManagerClarification: flags.some(f => f.code === DataQualityFlagCode.REQUIRES_MANAGER_REVIEW),
      },
      suggestedPriority: priority,
      suggestedCoordinatorRouting: coordinatorRouting,
      extractedFields,
      proposedTasks: tasks,
      dataQualityFlags: flags,
      decisionHints,
      rawReasoningSummary: this.buildRawReasoning(requestType, priority, flags),
      modelMeta: {
        modelName: 'logitask-v1-rules',
        temperature: 0.2,
        generatedAt: new Date().toISOString(),
      },
    };

    // Save to database
    await this.saveProposal(contract);

    return contract;
  }

  /**
   * Apply deterministic logistics rules
   */
  private applyRules(inbound: any): RequestType {
    // Rule 1: ERP source type mapping
    if (inbound.sourceType === 'ERP' && inbound.sourceSubType) {
      const mapped = ERP_RULES[inbound.sourceSubType];
      if (mapped) {
        this.logger.log(`Rule match: ERP ${inbound.sourceSubType} → ${mapped}`);
        return mapped;
      }
    }

    // Rule 2: Existing request type
    if (inbound.requestType && inbound.requestType !== 'UNCLASSIFIED') {
      const mapped = this.normalizeRequestType(inbound.requestType);
      if (mapped) {
        this.logger.log(`Rule match: existing requestType → ${mapped}`);
        return mapped;
      }
    }

    // Rule 3: Keyword analysis
    const content = this.buildContent(inbound);
    return this.classifyByKeywords(content);
  }

  /**
   * Build content string for analysis
   */
  private buildContent(inbound: any): string {
    const parts: string[] = [];
    if (inbound.subject) parts.push(inbound.subject);
    if (inbound.requestType) parts.push(inbound.requestType);
    if (inbound.supplierName) parts.push(inbound.supplierName);
    if (inbound.locationName) parts.push(inbound.locationName);

    for (const email of inbound.emails || []) {
      if (email.subject) parts.push(email.subject);
      if (email.body) parts.push(email.body);
    }

    return parts.join(' ').toLowerCase();
  }

  /**
   * Classify by keywords
   */
  private classifyByKeywords(content: string): RequestType {
    const scores: Record<RequestType, number> = {
      [RequestType.INBOUND_RECEIPT]: 0,
      [RequestType.OUTBOUND_DELIVERY]: 0,
      [RequestType.OUTBOUND_PREPARATION]: 0,
      [RequestType.TRANSFER_DISTRIBUTION]: 0,
      [RequestType.UNCLASSIFIED]: 0,
      [RequestType.OTHER]: 0,
    };

    for (const [type, keywords] of Object.entries(REQUEST_KEYWORDS)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          scores[type as RequestType] += keyword.length;
        }
      }
    }

    // Find best match
    let bestType = RequestType.OTHER;
    let bestScore = 0;
    for (const [type, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type as RequestType;
      }
    }

    return bestType;
  }

  /**
   * Normalize request type string to enum
   */
  private normalizeRequestType(rt: string): RequestType | null {
    const mapping: Record<string, RequestType> = {
      INBOUND_RECEIPT: RequestType.INBOUND_RECEIPT,
      OUTBOUND_DELIVERY: RequestType.OUTBOUND_DELIVERY,
      OUTBOUND_PREPARATION: RequestType.OUTBOUND_PREPARATION,
      TRANSFER_DISTRIBUTION: RequestType.TRANSFER_DISTRIBUTION,
    };
    return mapping[rt] || null;
  }

  /**
   * Analyze priority
   */
  private analyzePriority(inbound: any): SuggestedPriority {
    const content = this.buildContent(inbound);

    // Check existing priority first
    if (inbound.priority === 'HIGH') {
      return { value: Priority.HIGH, reason: 'П означено како HIGH приоритет' };
    }
    if (inbound.priority === 'LOW') {
      return { value: Priority.LOW, reason: 'П означено како LOW приоритет' };
    }

    // Keyword analysis
    for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          return {
            value: priority as Priority,
            reason: `Клучен збор "${keyword}" укажува на ${priority} приоритет`,
          };
        }
      }
    }

    return { value: Priority.MEDIUM, reason: 'Стандартен приоритет' };
  }

  /**
   * Extract fields from inbound
   */
  private extractFields(inbound: any): ExtractedFields {
    return {
      supplierName: inbound.supplierName || undefined,
      clientName: undefined,
      locationName: inbound.locationName || undefined,
      destinationName: inbound.locationName || undefined,
      requestedDate: inbound.requestedDate?.toISOString() || undefined,
      referenceNumber: inbound.referenceNumber || undefined,
      urgencyText: inbound.subject?.toLowerCase().includes('итно') ? 'Итно' : undefined,
      goodsDescription: undefined,
    };
  }

  /**
   * Generate data quality flags
   */
  private generateFlags(inbound: any, extractedFields: ExtractedFields): DataQualityFlag[] {
    const flags: DataQualityFlag[] = [];

    if (!extractedFields.supplierName) {
      flags.push({
        code: DataQualityFlagCode.MISSING_SUPPLIER,
        severity: 'MEDIUM',
        message: 'Не е идентификуван добавувач',
      });
    }

    if (!extractedFields.locationName && !extractedFields.destinationName) {
      flags.push({
        code: DataQualityFlagCode.MISSING_LOCATION,
        severity: 'MEDIUM',
        message: 'Не е наведена локација/дестинација',
      });
    }

    if (!extractedFields.requestedDate) {
      flags.push({
        code: DataQualityFlagCode.MISSING_REQUESTED_DATE,
        severity: 'HIGH',
        message: 'Не е наведен бара рок',
      });
    }

    // Check for ambiguous content
    const content = this.buildContent(inbound);
    if (content.includes('проблем') || content.includes('?') || content.includes('нејасно')) {
      flags.push({
        code: DataQualityFlagCode.AMBIGUOUS_REQUEST,
        severity: 'MEDIUM',
        message: 'Барањето е нејасно или има проблем',
      });
    }

    return flags;
  }

  /**
   * Determine coordinator routing
   */
  private determineCoordinatorRouting(requestType: RequestType): CoordinatorRouting {
    return {
      primaryCoordinatorType: COORDINATOR_FOR_TYPE[requestType],
      secondaryCoordinatorTypes: SECONDARY_COORDINATORS[requestType] || [],
      routingReason: this.getRoutingReason(requestType),
    };
  }

  /**
   * Get routing reason
   */
  private getRoutingReason(requestType: RequestType): string {
    const reasons: Record<RequestType, string> = {
      [RequestType.INBOUND_RECEIPT]: 'Потребен е прием и евиденција на стока',
      [RequestType.OUTBOUND_DELIVERY]: 'Потребна е испорака до клиент',
      [RequestType.OUTBOUND_PREPARATION]: 'Потребна е подготовка на пратка',
      [RequestType.TRANSFER_DISTRIBUTION]: 'Потребен е трансфер помеѓу локации',
      [RequestType.UNCLASSIFIED]: 'Барањето не е класифицирано',
      [RequestType.OTHER]: 'Потребна е дополнителна анализа',
    };
    return reasons[requestType];
  }

  /**
   * Generate task proposals
   */
  private generateTasks(
    requestType: RequestType,
    inbound: any,
    coordinatorRouting: CoordinatorRouting
  ): TaskProposal[] {
    const templates = TASK_TEMPLATES[requestType] || TASK_TEMPLATES[RequestType.OTHER];
    const priority = this.analyzePriority(inbound);

    const tasks: TaskProposal[] = templates.map((template, index) => ({
      sequence: index + 1,
      taskType: this.requestTypeToTaskType(requestType),
      title: template.title,
      description: `${template.description} - ${inbound.subject || 'Inbound item'}`,
      suggestedCoordinatorType: index === 0
        ? coordinatorRouting.primaryCoordinatorType
        : coordinatorRouting.secondaryCoordinatorTypes[0] || coordinatorRouting.primaryCoordinatorType,
      priority: priority.value,
      required: index === 0,
      dependencyType: index === 0 ? TaskDependencyType.PRIMARY : TaskDependencyType.NOTIFICATION,
      dueDate: inbound.requestedDate?.toISOString(),
      reason: index === 0 ? 'Примарна акција' : 'Секундарна/нотификациска акција',
    }));

    return tasks;
  }

  /**
   * Map request type to task type
   */
  private requestTypeToTaskType(requestType: RequestType): TaskType {
    const mapping: Record<RequestType, TaskType> = {
      [RequestType.INBOUND_RECEIPT]: TaskType.INBOUND_RECEIPT,
      [RequestType.OUTBOUND_DELIVERY]: TaskType.OUTBOUND_DELIVERY,
      [RequestType.OUTBOUND_PREPARATION]: TaskType.OUTBOUND_PREPARATION,
      [RequestType.TRANSFER_DISTRIBUTION]: TaskType.TRANSFER_DISTRIBUTION,
      [RequestType.UNCLASSIFIED]: TaskType.FOLLOW_UP,
      [RequestType.OTHER]: TaskType.FOLLOW_UP,
    };
    return mapping[requestType];
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(requestType: RequestType, flags: DataQualityFlag[]): ConfidenceLevel {
    // Base confidence by request type
    let confidence = 0.7;

    // Reduce for flags
    if (flags.some(f => f.code === DataQualityFlagCode.MISSING_REQUESTED_DATE)) {
      confidence -= 0.15;
    }
    if (flags.some(f => f.code === DataQualityFlagCode.MISSING_LOCATION)) {
      confidence -= 0.1;
    }
    if (flags.some(f => f.code === DataQualityFlagCode.MISSING_SUPPLIER)) {
      confidence -= 0.1;
    }
    if (flags.some(f => f.code === DataQualityFlagCode.AMBIGUOUS_REQUEST)) {
      confidence -= 0.2;
    }

    if (confidence >= 0.8) return ConfidenceLevel.HIGH;
    if (confidence >= 0.5) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }

  /**
   * Build decision hints
   */
  private buildDecisionHints(
    requestType: RequestType,
    flags: DataQualityFlag[],
    overallConfidence: ConfidenceLevel
  ): DecisionHints {
    const needsReview = flags.some(f =>
      f.code === DataQualityFlagCode.AMBIGUOUS_REQUEST ||
      f.code === DataQualityFlagCode.REQUIRES_MANAGER_REVIEW
    );

    return {
      canAutoProceed: false, // Always require manager review
      shouldCreateCase: true,
      shouldCreateTasks: true,
      shouldBlockUntilManagerReview: needsReview || overallConfidence === ConfidenceLevel.LOW,
    };
  }

  /**
   * Build summary
   */
  private buildSummary(inbound: any, requestType: RequestType, tasks: TaskProposal[]): string {
    const parts: string[] = [];
    parts.push(this.getBusinessMeaning(requestType));

    if (tasks.length > 1) {
      parts.push(`(${tasks.length} задачи)`);
    }

    return parts.join(' ');
  }

  /**
   * Get business meaning
   */
  private getBusinessMeaning(requestType: RequestType): string {
    const meanings: Record<RequestType, string> = {
      [RequestType.INBOUND_RECEIPT]: 'Барање за прием на стока/документи',
      [RequestType.OUTBOUND_DELIVERY]: 'Барање за испорака до клиент',
      [RequestType.OUTBOUND_PREPARATION]: 'Барање за подготовка на пратка',
      [RequestType.TRANSFER_DISTRIBUTION]: 'Барање за трансфер/пренос на стока',
      [RequestType.UNCLASSIFIED]: 'Некатегоризирано барање',
      [RequestType.OTHER]: 'Операција',
    };
    return meanings[requestType];
  }

  /**
   * Build raw reasoning
   */
  private buildRawReasoning(requestType: RequestType, priority: SuggestedPriority, flags: DataQualityFlag[]): string {
    const parts: string[] = [];
    parts.push(`Класифицирано како: ${requestType}`);
    parts.push(`Приоритет: ${priority.value}`);

    if (flags.length > 0) {
      parts.push(`Фласови: ${flags.map(f => f.code).join(', ')}`);
    }

    return parts.join('. ');
  }

  /**
   * Save proposal to database
   */
  private async saveProposal(contract: AiProposalContract): Promise<void> {
    await this.prisma.aiProposal.upsert({
      where: { inboundItemId: contract.inboundItemId },
      create: {
        inboundItemId: contract.inboundItemId,
        proposalVersion: contract.proposalVersion,
        status: 'GENERATED',
        summary: contract.summary,
        managerRecommendation: contract.managerRecommendation,
        overallConfidence: contract.overallConfidence,
        suggestedRequestType: contract.requestInterpretation.suggestedRequestType,
        requestTypeConfidence: contract.requestInterpretation.requestTypeConfidence,
        requestTypeBusinessMeaning: contract.requestInterpretation.businessMeaning,
        requiresManagerClarification: contract.requestInterpretation.requiresManagerClarification,
        suggestedPriority: contract.suggestedPriority.value,
        priorityReason: contract.suggestedPriority.reason,
        primaryCoordinatorType: contract.suggestedCoordinatorRouting.primaryCoordinatorType,
        secondaryCoordinatorTypes: JSON.stringify(contract.suggestedCoordinatorRouting.secondaryCoordinatorTypes),
        routingReason: contract.suggestedCoordinatorRouting.routingReason,
        extractedFieldsJson: JSON.stringify(contract.extractedFields),
        proposedTasksJson: JSON.stringify(contract.proposedTasks),
        dataQualityFlagsJson: JSON.stringify(contract.dataQualityFlags),
        decisionHintsJson: JSON.stringify(contract.decisionHints),
        rawReasoningSummary: contract.rawReasoningSummary,
        rawModelResponseJson: JSON.stringify(contract),
        modelName: contract.modelMeta.modelName,
        temperature: contract.modelMeta.temperature,
      },
      update: {
        proposalVersion: contract.proposalVersion,
        status: 'GENERATED',
        summary: contract.summary,
        managerRecommendation: contract.managerRecommendation,
        overallConfidence: contract.overallConfidence,
        suggestedRequestType: contract.requestInterpretation.suggestedRequestType,
        requestTypeConfidence: contract.requestInterpretation.requestTypeConfidence,
        requestTypeBusinessMeaning: contract.requestInterpretation.businessMeaning,
        requiresManagerClarification: contract.requestInterpretation.requiresManagerClarification,
        suggestedPriority: contract.suggestedPriority.value,
        priorityReason: contract.suggestedPriority.reason,
        primaryCoordinatorType: contract.suggestedCoordinatorRouting.primaryCoordinatorType,
        secondaryCoordinatorTypes: JSON.stringify(contract.suggestedCoordinatorRouting.secondaryCoordinatorTypes),
        routingReason: contract.suggestedCoordinatorRouting.routingReason,
        extractedFieldsJson: JSON.stringify(contract.extractedFields),
        proposedTasksJson: JSON.stringify(contract.proposedTasks),
        dataQualityFlagsJson: JSON.stringify(contract.dataQualityFlags),
        decisionHintsJson: JSON.stringify(contract.decisionHints),
        rawReasoningSummary: contract.rawReasoningSummary,
        rawModelResponseJson: JSON.stringify(contract),
        modelName: contract.modelMeta.modelName,
        temperature: contract.modelMeta.temperature,
      },
    });
  }

  /**
   * Convert database record to contract
   */
  private dbToContract(db: any): AiProposalContract {
    return {
      proposalVersion: db.proposalVersion,
      inboundItemId: db.inboundItemId,
      sourceType: 'UNKNOWN',
      summary: db.summary || '',
      managerRecommendation: db.managerRecommendation as ManagerRecommendation,
      overallConfidence: db.overallConfidence as ConfidenceLevel,
      requestInterpretation: {
        suggestedRequestType: db.suggestedRequestType as RequestType,
        requestTypeConfidence: db.requestTypeConfidence,
        businessMeaning: db.requestTypeBusinessMeaning,
        requiresManagerClarification: db.requiresManagerClarification,
      },
      suggestedPriority: {
        value: db.suggestedPriority as Priority,
        reason: db.priorityReason,
      },
      suggestedCoordinatorRouting: {
        primaryCoordinatorType: db.primaryCoordinatorType as CoordinatorType,
        secondaryCoordinatorTypes: db.secondaryCoordinatorTypes ? JSON.parse(db.secondaryCoordinatorTypes) : [],
        routingReason: db.routingReason,
      },
      extractedFields: db.extractedFieldsJson ? JSON.parse(db.extractedFieldsJson) : undefined,
      proposedTasks: db.proposedTasksJson ? JSON.parse(db.proposedTasksJson) : [],
      dataQualityFlags: db.dataQualityFlagsJson ? JSON.parse(db.dataQualityFlagsJson) : [],
      decisionHints: db.decisionHintsJson ? JSON.parse(db.decisionHintsJson) : { canAutoProceed: false, shouldCreateCase: true, shouldCreateTasks: true, shouldBlockUntilManagerReview: true },
      rawReasoningSummary: db.rawReasoningSummary,
      modelMeta: {
        modelName: db.modelName,
        temperature: db.temperature,
        generatedAt: db.createdAt.toISOString(),
      },
    };
  }

  /**
   * Get proposal by inbound item ID
   */
  async getProposalByInboundItem(inboundItemId: string): Promise<AiProposalContract | null> {
    const db = await this.prisma.aiProposal.findUnique({
      where: { inboundItemId },
    });
    if (!db) return null;
    return this.dbToContract(db);
  }

  /**
   * Save manager feedback
   */
  async saveFeedback(feedback: ProposalFeedbackRequest): Promise<void> {
    // Get existing proposal
    const proposal = await this.prisma.aiProposal.findUnique({
      where: { id: feedback.proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal not found: ${feedback.proposalId}`);
    }

    // Save feedback
    await this.prisma.aiFeedback.create({
      data: {
        aiProposalId: feedback.proposalId,
        inboundItemId: proposal.inboundItemId,
        feedbackType: feedback.feedbackType,
        originalProposalJson: proposal.rawModelResponseJson,
        finalDecisionJson: JSON.stringify({
          finalRequestType: feedback.finalRequestType,
          finalPriority: feedback.finalPriority,
          finalCoordinatorId: feedback.finalCoordinatorId,
        }),
        createdBy: feedback.createdBy,
        qualityRating: feedback.qualityRating,
        feedbackText: feedback.feedbackText,
      },
    });

    // Update proposal status
    await this.prisma.aiProposal.update({
      where: { id: feedback.proposalId },
      data: { status: feedback.feedbackType },
    });
  }
}