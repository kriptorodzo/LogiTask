import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailParserService } from './email-parser.service';
import { Client } from '@microsoft/microsoft-graph-client';

interface MicrosoftGraphEmail {
  id: string;
  subject: string;
  from: { emailAddress: { address: string; name: string } };
  body: { contentType: string; content: string };
  receivedDateTime: string;
}

@Injectable()
export class EmailService {
  private graphClient: Client;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private emailParser: EmailParserService,
  ) {
    // Initialize Graph client with access token
    this.graphClient = Client.init({
      authProvider: async (done) => {
        // In production, this would fetch token from cache or use managed identity
        const token = await this.getAccessToken();
        done(null, token);
      },
    });
  }

  /**
   * Execute a function with exponential backoff retry
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES,
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);
        
        if (attempt < maxRetries) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  private async getAccessToken(): Promise<string> {
    // TODO: Implement token acquisition via managed identity or app-only token
    return process.env.MS_GRAPH_ACCESS_TOKEN || '';
  }

  async createMailbox(emailAddress: string, displayName?: string) {
    return this.prisma.mailbox.create({
      data: { emailAddress, displayName },
    });
  }

  async getMailboxes() {
    return this.prisma.mailbox.findMany({ where: { isActive: true } });
  }

  async fetchEmailFromGraph(mailboxId: string, emailMicrosoftId: string) {
    const mailbox = await this.prisma.mailbox.findUnique({ where: { id: mailboxId } });
    if (!mailbox) throw new Error('Mailbox not found');

    try {
      // Fetch email from Microsoft Graph
      const email: MicrosoftGraphEmail = await this.graphClient
        .api(`/me/messages/${emailMicrosoftId}`)
        .get();

      return this.processEmail(mailboxId, email);
    } catch (error) {
      console.error('Failed to fetch email from Graph:', error);
      throw error;
    }
  }

  async processEmail(mailboxId: string, graphEmail: MicrosoftGraphEmail) {
    // Extract plain text from body
    const plainText = this.emailParser.extractPlainText(
      graphEmail.body.content,
      graphEmail.body.contentType,
    );

    // Parse and extract entities
    const extracted = this.emailParser.extractEntities(plainText);

    // Classify request type
    const requestType = this.emailParser.classifyRequest(
      graphEmail.subject,
      plainText,
    );

    // Store email in database
    const email = await this.prisma.email.create({
      data: {
        mailboxId,
        microsoftGraphId: graphEmail.id,
        subject: graphEmail.subject,
        sender: graphEmail.from.emailAddress.name || graphEmail.from.emailAddress.address,
        senderEmail: graphEmail.from.emailAddress.address,
        body: graphEmail.body.content,
        bodyPlainText: plainText,
        receivedAt: new Date(graphEmail.receivedDateTime),
        processingStatus: 'PROCESSED',
        extractedSupplier: extracted.supplier,
        extractedLocation: extracted.location,
        extractedDeliveryDate: extracted.deliveryDate,
        extractedUrgency: extracted.urgency,
        requestType,
      },
    });

    return email;
  }

  async getEmails(filters?: { processingStatus?: string; requestType?: string }) {
    const where: any = {};
    if (filters?.processingStatus) where.processingStatus = filters.processingStatus;
    if (filters?.requestType) where.requestType = filters.requestType;

    return this.prisma.email.findMany({
      where,
      include: { mailbox: true, tasks: true },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async getEmailById(id: string) {
    return this.prisma.email.findUnique({
      where: { id },
      include: { mailbox: true, tasks: { include: { assignee: true } } },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.email.update({
      where: { id },
      data: { processingStatus: status },
    });
  }

  async classifyEmail(id: string, requestType: string) {
    // First update the email with the classification
    const email = await this.prisma.email.update({
      where: { id },
      data: { 
        requestType,
        processingStatus: 'PROCESSED',
      },
    });

    // Generate tasks based on the request type
    await this.generateTasksForEmail(email);

    // Return the updated email with tasks
    return this.getEmailById(id);
  }

  private async generateTasksForEmail(email: any) {
    const tasks: Array<{title: string; requestType: string; dueDate: Date}> = [];

    // Generate tasks based on request type
    switch (email.requestType) {
      case 'INBOUND_RECEIPT':
        tasks.push({
          title: `Прием на роба од ${email.extractedSupplier || 'добавувач'}`,
          requestType: 'INBOUND_RECEIPT',
          dueDate: email.extractedDeliveryDate || new Date(),
        });
        break;
      case 'OUTBOUND_PREPARATION':
        tasks.push({
          title: 'Подготовка на роба',
          requestType: 'OUTBOUND_PREPARATION',
          dueDate: email.extractedDeliveryDate || new Date(),
        });
        break;
      case 'OUTBOUND_DELIVERY':
        tasks.push({
          title: `Испорака до ${email.extractedLocation || 'клиент'}`,
          requestType: 'OUTBOUND_DELIVERY',
          dueDate: email.extractedDeliveryDate || new Date(),
        });
        break;
      case 'TRANSFER_DISTRIBUTION':
        tasks.push({
          title: `Дистрибуција до ${email.extractedLocation || 'локација'}`,
          requestType: 'TRANSFER_DISTRIBUTION',
          dueDate: email.extractedDeliveryDate || new Date(),
        });
        break;
    }

    // Create tasks in database
    for (const task of tasks) {
      await this.prisma.task.create({
        data: {
          emailId: email.id,
          title: task.title,
          requestType: task.requestType,
          status: 'PROPOSED',
          dueDate: task.dueDate,
          isRequiredForCase: true,
        },
      });
    }
  }

  // Webhook endpoint for new email notifications
  async handleWebhook(notification: any) {
    // Microsoft Graph sends webhook notifications
    const changes = notification.value || [];
    
    for (const change of changes) {
      if (change.notificationType === 'created') {
        const emailId = change.resourceData?.id;
        if (emailId) {
          // Get the default mailbox or first active mailbox
          const mailbox = await this.prisma.mailbox.findFirst({ where: { isActive: true } });
          if (mailbox) {
            await this.fetchEmailFromGraph(mailbox.id, emailId);
          }
        }
      }
    }
  }
}