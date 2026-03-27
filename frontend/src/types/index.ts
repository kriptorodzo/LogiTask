export type Role = 
  | 'MANAGER'
  | 'RECEPTION_COORDINATOR'
  | 'DELIVERY_COORDINATOR'
  | 'DISTRIBUTION_COORDINATOR';

export type TaskStatus = 
  | 'PROPOSED'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED';

export const TASK_STATUS = {
  PROPOSED: 'PROPOSED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;

export type RequestType = 
  | 'INBOUND_RECEIPT'
  | 'OUTBOUND_PREPARATION'
  | 'OUTBOUND_DELIVERY'
  | 'TRANSFER_DISTRIBUTION'
  | 'UNCLASSIFIED';

export const REQUEST_TYPES = {
  INBOUND_RECEIPT: 'INBOUND_RECEIPT',
  OUTBOUND_PREPARATION: 'OUTBOUND_PREPARATION',
  OUTBOUND_DELIVERY: 'OUTBOUND_DELIVERY',
  TRANSFER_DISTRIBUTION: 'TRANSFER_DISTRIBUTION',
  UNCLASSIFIED: 'UNCLASSIFIED',
} as const;

export type EmailProcessingStatus = 
  | 'PENDING'
  | 'PROCESSED'
  | 'FAILED';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Mailbox {
  id: string;
  emailAddress: string;
  displayName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Email {
  id: string;
  mailboxId: string;
  microsoftGraphId?: string;
  subject: string;
  sender: string;
  senderEmail: string;
  body?: string;
  bodyPlainText?: string;
  receivedAt: string;
  processingStatus: EmailProcessingStatus;
  extractedSupplier?: string;
  extractedLocation?: string;
  extractedDeliveryDate?: string;
  extractedUrgency?: string;
  requestType?: RequestType;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
  mailbox?: Mailbox;
}

export interface Task {
  id: string;
  emailId: string;
  email?: Email;
  assigneeId?: string;
  assignee?: User;
  title: string;
  description?: string;
  status: TaskStatus;
  requestType: RequestType;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  dependencies?: TaskDependency[];
  dependents?: TaskDependency[];
  comments?: TaskComment[];
}

export interface TaskDependency {
  id: string;
  dependentId: string;
  dependent?: Task;
  dependencyId: string;
  dependency?: Task;
  offsetDays: number;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  requestType: RequestType;
  priority: number;
  conditions: Record<string, any>;
  assigneeRole: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  taskId?: string;
  task?: Task;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}
