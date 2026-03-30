/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                      AI PROPOSAL SCHEMA DEFINITIONS                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  AI Role: Proposal/Copilot layer (NOT auto-execution)                         ║
 * ║  ─────────────────────────────────────────────────────                         ║
 * ║  - READS: InboundItem, Email, ERP data                                      ║
 * ║  - GENERATES: proposal for classification, role, tasks                         ║
 * ║  - PROVIDES: confidence score                                               ║
 * ║  - FLAGS: missing/ambiguous data                                            ║
 * ║                                                                              ║
 * ║  Manager remains FINAL decision-maker.                                     ║
 * ║  AI does NOT auto-approve, auto-delegate, or auto-complete.                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { IsString, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Request Type classifications
 */
export enum RequestType {
  INBOUND_RECEIPT = 'INBOUND_RECEIPT',
  OUTBOUND_DELIVERY = 'OUTBOUND_DELIVERY',
  OUTBOUND_PREPARATION = 'OUTBOUND_PREPARATION',
  TRANSFER_DISTRIBUTION = 'TRANSFER_DISTRIBUTION',
  OTHER = 'OTHER',
}

/**
 * Priority levels
 */
export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * Coordinator types
 */
export enum CoordinatorType {
  RECEPTION = 'RECEPTION_COORDINATOR',
  DELIVERY = 'DELIVERY_COORDINATOR',
  DISTRIBUTION = 'DISTRIBUTION_COORDINATOR',
}

/**
 * Data quality flags
 */
export enum DataQualityFlag {
  MISSING_SUPPLIER = 'MISSING_SUPPLIER',
  MISSING_LOCATION = 'MISSING_LOCATION',
  MISSING_DUE_DATE = 'MISSING_DUE_DATE',
  AMBIGUOUS_CONTENT = 'AMBIGUOUS_CONTENT',
  DUPLICATE_DETECTED = 'DUPLICATE_DETECTED',
  HIGH_VALUE_ORDER = 'HIGH_VALUE_ORDER',
  RUSH_ORDER = 'RUSH_ORDER',
}

/**
 * Confidence level based on score
 */
export enum ConfidenceLevel {
  HIGH = 'HIGH',      // 0.8-1.0
  MEDIUM = 'MEDIUM',  // 0.5-0.79
  LOW = 'LOW',       // 0.0-0.49
}

/**
 * AI-generated proposal for an InboundItem
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */
export class AiProposalDto {
  /** Unique proposal ID */
  id: string;

  /** Linked InboundItem ID */
  inboundItemId: string;

  /** AI model/reasoning source */
  modelName: string;

  /** Generated at */
  generatedAt: string;

  // ─── PROPOSED VALUES ────────────────────────────────────────────────────────

  /** Suggested request type classification */
  @IsEnum(RequestType)
  @IsOptional()
  suggestedRequestType?: RequestType;

  /** Confidence score (0.0 - 1.0) */
  @IsNumber()
  @Min(0)
  @Max(1)
  requestTypeConfidence: number;

  /** Suggested priority */
  @IsEnum(Priority)
  @IsOptional()
  suggestedPriority?: Priority;

  /** Confidence score (0.0 - 1.0) */
  @IsNumber()
  @Min(0)
  @Max(1)
  priorityConfidence: number;

  /** Suggested supplier name (if detected) */
  @IsString()
  @IsOptional()
  suggestedSupplierName?: string;

  /** Suggested location/destination */
  @IsString()
  @IsOptional()
  suggestedLocation?: string;

  /** Suggested due date */
  @IsString()
  @IsOptional()
  suggestedDueDate?: string;

  // ─── COORDINATOR ASSIGNMENT ────────────────────────────────────────────────────────

  /** Suggested coordinator type */
  @IsEnum(CoordinatorType)
  suggestedCoordinatorType: CoordinatorType;

  /** Confidence score */
  @IsNumber()
  @Min(0)
  @Max(1)
  coordinatorConfidence: number;

  /** List of matching coordinators with scores (for selection UI) */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoordinatorSuggestion)
  coordinatorSuggestions: CoordinatorSuggestion[];

  // ─── TASK PROPOSALS ────────────────────────────────────────────────────────────

  /** Number of tasks to create */
  @IsNumber()
  @Min(1)
  @Max(10)
  suggestedTaskCount: number;

  /** Individual task proposals */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskProposal)
  taskProposals: TaskProposal[];

  // ─── DATA QUALITY ────────────────────────────────────────────────────────────────

  /** Flags for missing/ambiguous data */
  @IsArray()
  @IsEnum(DataQualityFlag, { each: true })
  dataQualityFlags: DataQualityFlag[];

  /** Overall confidence level */
  @IsEnum(ConfidenceLevel)
  overallConfidence: ConfidenceLevel;

  /** Human-readable summary */
  @IsString()
  summary: string;

  /** Reasoning/explanation */
  @IsString()
  reasoning: string;
}

/**
 * Coordinator suggestion with score
 */
export class CoordinatorSuggestion {
  @IsString()
  coordinatorId: string;

  @IsString()
  email: string;

  @IsString()
  displayName: string;

  @IsEnum(CoordinatorType)
  role: CoordinatorType;

  @IsNumber()
  @Min(0)
  @Max(1)
  matchScore: number;

  @IsString()
  @IsOptional()
  rationale?: string;
}

/**
 * Task proposal
 */
export class TaskProposal {
  @IsNumber()
  taskIndex: number;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(RequestType)
  requestType: RequestType;

  @IsEnum(CoordinatorType)
  suggestedRole: CoordinatorType;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Request to generate AI proposal
 */
export class GenerateProposalRequest {
  @IsString()
  inboundItemId: string;

  /** Optional: include coordinator workload in decision */
  @IsString()
  @IsOptional()
  excludeCoordinatorId?: string;
}

/**
 * Manager feedback on AI proposal
 */
export class ProposalFeedback {
  @IsString()
  proposalId: string;

  /** What the manager changed */
  @IsEnum(RequestType)
  @IsOptional()
  actualRequestType?: RequestType;

  @IsEnum(Priority)
  @IsOptional()
  actualPriority?: Priority;

  @IsString()
  @IsOptional()
  actualSupplierName?: string;

  @IsString()
  @IsOptional()
  actualLocation?: string;

  @IsString()
  @IsOptional()
  actualCoordinatorId?: string;

  /** Quality of AI suggestion */
  @IsEnum(ConfidenceLevel)
  @IsOptional()
  suggestionQuality?: ConfidenceLevel;

  /** Optional feedback text */
  @IsString()
  @IsOptional()
  feedback?: string;
}

/**
 * AI Service interface
 * ═══════════════════════════════════════════════════════════════════════════════════
 */
export interface IAiService {
  /**
   * Generate proposal for an inbound item
   */
  generateProposal(inboundItemId: string): Promise<AiProposalDto>;

  /**
   * Generate proposals for multiple items
   */
  generateBatchProposals(inboundItemIds: string[]): Promise<AiProposalDto[]>;

  /**
   * Record manager feedback for learning
   */
  recordFeedback(feedback: ProposalFeedback): Promise<void>;

  /**
   * Get proposal statistics
   */
  getProposalStats(): Promise<ProposalStats>;
}

/**
 * Proposal statistics
 */
export class ProposalStats {
  totalProposals: number;
  averageConfidence: number;
  acceptanceRate: number;
  topRejectedReasons: { reason: string; count: number }[];
  coordinatorAccuracy: { coordinatorId: string; accuracy: number }[];
}