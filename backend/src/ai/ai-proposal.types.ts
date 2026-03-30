/**
 * AI Proposal Types - Plain interfaces
 */

export enum RequestType {
  INBOUND_RECEIPT = 'INBOUND_RECEIPT',
  OUTBOUND_PREPARATION = 'OUTBOUND_PREPARATION',
  OUTBOUND_DELIVERY = 'OUTBOUND_DELIVERY',
  TRANSFER_DISTRIBUTION = 'TRANSFER_DISTRIBUTION',
  UNCLASSIFIED = 'UNCLASSIFIED',
  OTHER = 'OTHER',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum CoordinatorType {
  RECEPTION = 'RECEPTION_COORDINATOR',
  DELIVERY = 'DELIVERY_COORDINATOR',
  DISTRIBUTION = 'DISTRIBUTION_COORDINATOR',
}

export enum TaskDependencyType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  NOTIFICATION = 'NOTIFICATION',
  OPTIONAL = 'OPTIONAL',
}

export enum DataQualityFlagCode {
  MISSING_SUPPLIER = 'MISSING_SUPPLIER',
  MISSING_CLIENT = 'MISSING_CLIENT',
  MISSING_LOCATION = 'MISSING_LOCATION',
  MISSING_REQUESTED_DATE = 'MISSING_REQUESTED_DATE',
  MISSING_REFERENCE = 'MISSING_REFERENCE',
  AMBIGUOUS_REQUEST = 'AMBIGUOUS_REQUEST',
  MULTI_STEP_OPERATION = 'MULTI_STEP_OPERATION',
  POSSIBLE_DUPLICATE = 'POSSIBLE_DUPLICATE',
  CONFLICTING_INSTRUCTIONS = 'CONFLICTING_INSTRUCTIONS',
  REQUIRES_MANAGER_REVIEW = 'REQUIRES_MANAGER_REVIEW',
}

export enum TaskType {
  INBOUND_RECEIPT = 'INBOUND_RECEIPT',
  OUTBOUND_PREPARATION = 'OUTBOUND_PREPARATION',
  OUTBOUND_DELIVERY = 'OUTBOUND_DELIVERY',
  TRANSFER_DISTRIBUTION = 'TRANSFER_DISTRIBUTION',
  NOTIFICATION = 'NOTIFICATION',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum ManagerRecommendation {
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  SAFE_TO_APPROVE = 'SAFE_TO_APPROVE',
  NEEDS_CLARIFICATION = 'NEEDS_CLARIFICATION',
  REJECT_OR_IGNORE = 'REJECT_OR_IGNORE',
}

export enum ProposalStatus {
  GENERATED = 'GENERATED',
  ACCEPTED = 'ACCEPTED',
  EDITED = 'EDITED',
  REJECTED = 'REJECTED',
}

export enum FeedbackType {
  ACCEPTED = 'ACCEPTED',
  CORRECTED = 'CORRECTED',
  REJECTED = 'REJECTED',
}

export enum QualityRating {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  POOR = 'POOR',
}

export interface AiProposalContract {
  proposalVersion: string;
  inboundItemId: string;
  sourceType: string;
  sourceSubType?: string;
  summary: string;
  managerRecommendation: ManagerRecommendation;
  overallConfidence: ConfidenceLevel;
  requestInterpretation: RequestInterpretation;
  suggestedPriority: SuggestedPriority;
  suggestedCoordinatorRouting: CoordinatorRouting;
  extractedFields?: ExtractedFields;
  proposedTasks: TaskProposal[];
  dataQualityFlags: DataQualityFlag[];
  decisionHints: DecisionHints;
  rawReasoningSummary?: string;
  modelMeta: ModelMeta;
}

export interface RequestInterpretation {
  suggestedRequestType?: RequestType;
  requestTypeConfidence: number;
  businessMeaning?: string;
  requiresManagerClarification: boolean;
}

export interface SuggestedPriority {
  value: Priority;
  reason: string;
}

export interface CoordinatorRouting {
  primaryCoordinatorType: CoordinatorType;
  secondaryCoordinatorTypes: CoordinatorType[];
  routingReason: string;
}

export interface ExtractedFields {
  supplierName?: string;
  clientName?: string;
  locationName?: string;
  destinationName?: string;
  requestedDate?: string;
  referenceNumber?: string;
  urgencyText?: string;
  goodsDescription?: string;
}

export interface TaskProposal {
  sequence: number;
  taskType: TaskType;
  title: string;
  description: string;
  suggestedCoordinatorType: CoordinatorType;
  priority: Priority;
  required: boolean;
  dependencyType: TaskDependencyType;
  dueDate?: string;
  reason: string;
}

export interface DataQualityFlag {
  code: DataQualityFlagCode;
  severity: string;
  message: string;
}

export interface DecisionHints {
  canAutoProceed: boolean;
  shouldCreateCase: boolean;
  shouldCreateTasks: boolean;
  shouldBlockUntilManagerReview: boolean;
}

export interface ModelMeta {
  modelName: string;
  temperature: number;
  generatedAt: string;
}

export interface GenerateProposalRequest {
  inboundItemId: string;
  regenerate?: boolean;
}

export interface ProposalFeedbackRequest {
  proposalId: string;
  feedbackType: FeedbackType;
  finalRequestType?: string;
  finalPriority?: string;
  finalCoordinatorId?: string;
  qualityRating?: QualityRating;
  feedbackText?: string;
  createdBy?: string;
}