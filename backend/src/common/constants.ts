// Constants for the application

// Roles
export const ROLES = {
  MANAGER: 'MANAGER',
  RECEPTION_COORDINATOR: 'RECEPTION_COORDINATOR',
  DELIVERY_COORDINATOR: 'DELIVERY_COORDINATOR',
  DISTRIBUTION_COORDINATOR: 'DISTRIBUTION_COORDINATOR',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

// Task Status
export const TASK_STATUS = {
  PROPOSED: 'PROPOSED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;

export type TaskStatusType = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// Request Types
export const REQUEST_TYPES = {
  INBOUND_RECEIPT: 'INBOUND_RECEIPT',
  OUTBOUND_PREPARATION: 'OUTBOUND_PREPARATION',
  OUTBOUND_DELIVERY: 'OUTBOUND_DELIVERY',
  TRANSFER_DISTRIBUTION: 'TRANSFER_DISTRIBUTION',
  UNCLASSIFIED: 'UNCLASSIFIED',
} as const;

export type RequestType = typeof REQUEST_TYPES[keyof typeof REQUEST_TYPES];

// Email Processing Status
export const EMAIL_STATUS = {
  PENDING: 'PENDING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
} as const;

export type EmailStatusType = typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];