import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskService } from './task.service';
import { REQUEST_TYPES, ROLES } from '../common/constants';

interface EmailData {
  id: string;
  extractedSupplier?: string;
  extractedLocation?: string;
  extractedDeliveryDate?: Date;
  extractedUrgency?: string;
  requestType?: string;
  subject: string;
  bodyPlainText?: string;
}

interface TaskProposal {
  title: string;
  description: string;
  requestType: string;
  dueDate?: string;
  assigneeRole: string;
}

@Injectable()
export class TaskOrchestratorService {
  constructor(
    private prisma: PrismaService,
    private taskService: TaskService,
  ) {}

  async processEmailAndCreateTasks(email: EmailData) {
    if (!email.requestType || email.requestType === 'UNCLASSIFIED') {
      await this.taskService.createTask({
        emailId: email.id,
        title: `Review: ${email.subject}`,
        description: `Email could not be automatically classified.\n\nSubject: ${email.subject}\n\nContent: ${email.bodyPlainText?.substring(0, 500)}`,
        requestType: 'UNCLASSIFIED',
      });
      return;
    }

    const proposals = this.generateTaskProposals(email);

    for (const proposal of proposals) {
      await this.taskService.createTask({
        emailId: email.id,
        title: proposal.title,
        description: proposal.description,
        requestType: proposal.requestType,
        dueDate: proposal.dueDate ? new Date(proposal.dueDate) : undefined,
      });
    }
  }

  private generateTaskProposals(email: EmailData): TaskProposal[] {
    const proposals: TaskProposal[] = [];
    const requestType = email.requestType || 'UNCLASSIFIED';
    const description = this.buildDescription(email);

    switch (requestType) {
      case 'INBOUND_RECEIPT':
        proposals.push({
          title: `Inbound Receipt: ${email.extractedSupplier || 'Unknown Supplier'}`,
          description: description + '\n\nAction: Coordinate receipt and inspection of incoming goods.',
          requestType: 'INBOUND_RECEIPT',
          dueDate: email.extractedDeliveryDate?.toISOString(),
          assigneeRole: ROLES.RECEPTION_COORDINATOR,
        });
        break;

      case 'OUTBOUND_PREPARATION':
        proposals.push({
          title: `Outbound Preparation: ${email.extractedLocation || 'Shipment'}`,
          description: description + '\n\nAction: Pick and pack items for shipment.',
          requestType: 'OUTBOUND_PREPARATION',
          dueDate: email.extractedDeliveryDate ? this.calculateDueDate(email.extractedDeliveryDate, -1)?.toISOString() : undefined,
          assigneeRole: ROLES.DELIVERY_COORDINATOR,
        });
        break;

      case 'OUTBOUND_DELIVERY':
        proposals.push({
          title: `Outbound Delivery: ${email.extractedLocation || 'Customer'}`,
          description: description + '\n\nAction: Dispatch and track delivery to customer.',
          requestType: 'OUTBOUND_DELIVERY',
          dueDate: email.extractedDeliveryDate?.toISOString(),
          assigneeRole: ROLES.DELIVERY_COORDINATOR,
        });
        break;

      case 'TRANSFER_DISTRIBUTION':
        proposals.push({
          title: `Transfer/Distribution: ${email.extractedLocation || 'Internal'}`,
          description: description + '\n\nAction: Coordinate internal transfer or redistribution.',
          requestType: 'TRANSFER_DISTRIBUTION',
          dueDate: email.extractedDeliveryDate?.toISOString(),
          assigneeRole: ROLES.DISTRIBUTION_COORDINATOR,
        });
        break;

      default:
        proposals.push({
          title: `Manual Review: ${email.subject}`,
          description: description + '\n\nAction: Requires manual classification and assignment.',
          requestType: 'UNCLASSIFIED',
          assigneeRole: ROLES.MANAGER,
        });
    }

    return proposals;
  }

  private buildDescription(email: EmailData): string {
    const parts: string[] = [];

    if (email.extractedSupplier) parts.push(`Supplier: ${email.extractedSupplier}`);
    if (email.extractedLocation) parts.push(`Location: ${email.extractedLocation}`);
    if (email.extractedDeliveryDate) parts.push(`Delivery Date: ${email.extractedDeliveryDate.toISOString().split('T')[0]}`);
    if (email.extractedUrgency) parts.push(`Urgency: ${email.extractedUrgency}`);

    return parts.length > 0 ? parts.join('\n') : 'No additional details extracted.';
  }

  private calculateDueDate(deliveryDate: Date | undefined, offsetDays: number): Date | undefined {
    if (!deliveryDate) return undefined;
    
    const date = new Date(deliveryDate);
    date.setDate(date.getDate() + offsetDays);
    return date;
  }

  async createDependentTasks(
    emailId: string,
    primaryTaskId: string,
    dependentType: string,
    offsetDays: number,
  ) {
    const primaryTask = await this.taskService.getTaskById(primaryTaskId);
    
    const dependentDueDate = primaryTask.dueDate 
      ? this.calculateDueDate(primaryTask.dueDate, offsetDays)
      : undefined;

    const dependentTask = await this.taskService.createTask({
      emailId,
      title: `Dependent Task for: ${primaryTask.title}`,
      description: `This task depends on task ${primaryTaskId}`,
      requestType: dependentType,
      dueDate: dependentDueDate,
    });

    await this.prisma.taskDependency.create({
      data: {
        dependentId: dependentTask.id,
        dependencyId: primaryTaskId,
        offsetDays,
      },
    });

    return dependentTask;
  }
}
