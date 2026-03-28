import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with demo data...');

  // Create default routing rules
  const routingRules = [
    {
      name: 'Inbound Receipt to Reception Coordinator',
      requestType: 'INBOUND_RECEIPT',
      priority: 1,
      conditions: JSON.stringify({ requestType: 'INBOUND_RECEIPT' }),
      assigneeRole: 'RECEPTION_COORDINATOR',
      isActive: true,
    },
    {
      name: 'Outbound Preparation to Delivery Coordinator',
      requestType: 'OUTBOUND_PREPARATION',
      priority: 1,
      conditions: JSON.stringify({ requestType: 'OUTBOUND_PREPARATION' }),
      assigneeRole: 'DELIVERY_COORDINATOR',
      isActive: true,
    },
    {
      name: 'Outbound Delivery to Delivery Coordinator',
      requestType: 'OUTBOUND_DELIVERY',
      priority: 1,
      conditions: JSON.stringify({ requestType: 'OUTBOUND_DELIVERY' }),
      assigneeRole: 'DELIVERY_COORDINATOR',
      isActive: true,
    },
    {
      name: 'Transfer Distribution to Distribution Coordinator',
      requestType: 'TRANSFER_DISTRIBUTION',
      priority: 1,
      conditions: JSON.stringify({ requestType: 'TRANSFER_DISTRIBUTION' }),
      assigneeRole: 'DISTRIBUTION_COORDINATOR',
      isActive: true,
    },
  ];

  for (const rule of routingRules) {
    await prisma.routingRule.upsert({
      where: { name: rule.name },
      update: {},
      create: rule,
    });
  }

  // Create a default mailbox
  const mailbox = await prisma.mailbox.upsert({
    where: { emailAddress: 'logistics@company.com' },
    update: {},
    create: {
      emailAddress: 'logistics@company.com',
      displayName: 'Logistics Inbox',
    },
  });

  // Create users
  const users = {
    manager: await prisma.user.upsert({
      where: { email: 'manager@company.com' },
      update: {},
      create: { email: 'manager@company.com', displayName: 'Manager', role: 'MANAGER' },
    }),
    reception: await prisma.user.upsert({
      where: { email: 'reception@company.com' },
      update: {},
      create: { email: 'reception@company.com', displayName: 'Reception Coordinator', role: 'RECEPTION_COORDINATOR' },
    }),
    delivery: await prisma.user.upsert({
      where: { email: 'delivery@company.com' },
      update: {},
      create: { email: 'delivery@company.com', displayName: 'Delivery Coordinator', role: 'DELIVERY_COORDINATOR' },
    }),
    distribution: await prisma.user.upsert({
      where: { email: 'distribution@company.com' },
      update: {},
      create: { email: 'distribution@company.com', displayName: 'Distribution Coordinator', role: 'DISTRIBUTION_COORDINATOR' },
    }),
  };

  // Demo emails based on the 10 examples from backlog
  const demoEmails = [
    {
      subject: 'Итна роба од Ероглу',
      sender: 'Ероглу Доставка',
      senderEmail: 'eroglu@delivery.mk',
      body: 'Хитна е робата од добавувач Ероглу. Да се прими веднаш по пристигнување.',
      receivedAt: new Date('2026-03-28T08:00:00'),
      processingStatus: 'PROCESSED',
      extractedSupplier: 'Eroglu',
      extractedUrgency: 'HIGH',
      requestType: 'INBOUND_RECEIPT',
      extractedLocation: null,
      extractedDeliveryDate: null,
    },
    {
      subject: 'Подготовка и испорака за Штип во среда',
      sender: 'Трговски Дом',
      senderEmail: 'trgovski@company.mk',
      body: 'Да се спреми роба за Штип и да се испорача во среда.',
      receivedAt: new Date('2026-03-27T10:30:00'),
      processingStatus: 'PROCESSED',
      extractedSupplier: null,
      extractedLocation: 'Stip',
      extractedDeliveryDate: new Date('2026-03-25'), // Wednesday
      extractedUrgency: null,
      requestType: 'OUTBOUND_DELIVERY',
    },
    {
      subject: 'Носење роба до Битола утре',
      sender: 'Градоначалник Битола',
      senderEmail: 'grad.bitola@mk',
      body: 'Ве молам робата да се однесе до Битола утре до 12 часот.',
      receivedAt: new Date('2026-03-27T14:00:00'),
      processingStatus: 'PROCESSED',
      extractedSupplier: null,
      extractedLocation: 'Bitola',
      extractedDeliveryDate: new Date('2026-03-28'), // tomorrow
      extractedUrgency: 'HIGH',
      requestType: 'TRANSFER_DISTRIBUTION',
    },
    {
      subject: 'Прием на пратка од добавувач ТекстилКом',
      sender: 'ТекстилКом',
      senderEmail: 'tekstilkom@mk',
      body: 'Денес пристигнува пратка од ТекстилКом. Да се организира прием.',
      receivedAt: new Date('2026-03-28T07:00:00'),
      processingStatus: 'PROCESSED',
      extractedSupplier: 'ТекстилКом',
      extractedUrgency: null,
      requestType: 'INBOUND_RECEIPT',
    },
    {
      subject: 'Испорака за Охрид во петок',
      sender: 'Охрид Травел',
      senderEmail: 'ohrid@travel.mk',
      body: 'Да се спреми и испорача роба за Охрид во петок.',
      receivedAt: new Date('2026-03-26T09:00:00'),
      processingStatus: 'PROCESSED',
      extractedSupplier: null,
      extractedLocation: 'Ohrid',
      extractedDeliveryDate: new Date('2026-03-27'), // Friday
      extractedUrgency: null,
      requestType: 'OUTBOUND_DELIVERY',
    },
    {
      subject: 'Внатрешен трансфер до магацин Скопје 2',
      sender: 'Магацин Скопје',
      senderEmail: 'warehouse2@company.mk',
      body: 'Потребен е трансфер на палети до магацин Скопје 2 до крај на ден.',
      receivedAt: new Date('2026-03-28T11:00:00'),
      processingStatus: 'PROCESSED',
      extractedSupplier: null,
      extractedLocation: 'Skopje Warehouse 2',
      extractedDeliveryDate: new Date('2026-03-28'), // today end of day
      extractedUrgency: 'HIGH',
      requestType: 'TRANSFER_DISTRIBUTION',
    },
    {
      subject: 'Итна подготовка за испорака',
      sender: 'Вработен',
      senderEmail: 'vraboten@company.mk',
      body: 'Итно да се спреми роба за клиентот. Испораката е утре сабајле.',
      receivedAt: new Date('2026-03-28T12:00:00'),
      processingStatus: 'PROCESSED',
      extractedSupplier: null,
      extractedLocation: null,
      extractedDeliveryDate: new Date('2026-03-29'), // tomorrow morning
      extractedUrgency: 'HIGH',
      requestType: 'OUTBOUND_DELIVERY',
    },
    {
      subject: 'Недостигаат детали за испорака',
      sender: 'Клиент',
      senderEmail: 'client@company.mk',
      body: 'Да се спреми пратката и да се испрати како што договоривме.',
      receivedAt: new Date('2026-03-28T09:30:00'),
      processingStatus: 'PENDING',
      extractedSupplier: null,
      extractedLocation: null,
      extractedDeliveryDate: null,
      extractedUrgency: null,
      requestType: 'UNCLASSIFIED',
    },
    {
      subject: 'Прием и последователна дистрибуција',
      sender: 'Ероглу Доставка',
      senderEmail: 'eroglu@delivery.mk',
      body: 'Утре пристигнува роба од Ероглу, а во четврток треба да се испорача до Куманово.',
      receivedAt: new Date('2026-03-26T16:00:00'),
      processingStatus: 'PROCESSED',
      extractedSupplier: 'Eroglu',
      extractedLocation: 'Kumanovo',
      extractedDeliveryDate: new Date('2026-03-26'), // Thursday
      extractedUrgency: null,
      requestType: 'OUTBOUND_DELIVERY',
    },
    {
      subject: 'Проблем со адреса за достава',
      sender: 'Проблем',
      senderEmail: 'problem@company.mk',
      body: 'Да се испорача роба утре, но адресата ќе ја потврдиме дополнително.',
      receivedAt: new Date('2026-03-28T10:00:00'),
      processingStatus: 'PENDING',
      extractedSupplier: null,
      extractedLocation: null,
      extractedDeliveryDate: new Date('2026-03-29'), // tomorrow
      extractedUrgency: null,
      requestType: 'UNCLASSIFIED',
    },
  ];

  // Create emails and tasks
  const createdEmails: string[] = [];
  
  for (const emailData of demoEmails) {
    const email = await prisma.email.create({
      data: {
        ...emailData,
        mailboxId: mailbox.id,
        bodyPlainText: emailData.body,
      },
    });
    createdEmails.push(email.id);

    // Create email case
    await prisma.emailCase.create({
      data: {
        emailId: email.id,
        classification: emailData.requestType !== 'UNCLASSIFIED' ? emailData.requestType : null,
        priority: emailData.extractedUrgency as any,
        supplierName: emailData.extractedSupplier,
        locationName: emailData.extractedLocation,
        deliveryDueAt: emailData.extractedDeliveryDate,
        caseDueAt: emailData.extractedDeliveryDate,
      },
    });

    // Create tasks for processed emails
    if (emailData.processingStatus === 'PROCESSED' && emailData.requestType !== 'UNCLASSIFIED') {
      const tasks = getTasksForEmail(email.id, emailData);
      for (const task of tasks) {
        await prisma.task.create({ data: task });
      }
    }
  }

  console.log(`Created ${createdEmails.length} demo emails`);

  // Create some additional historical data for reports
  await createHistoricalData(prisma, users, mailbox);

  console.log('Seeding completed.');
}

function getTasksForEmail(emailId: string, emailData: any): any[] {
  const tasks: any[] = [];
  const today = new Date();

  switch (emailData.subject) {
    case 'Итна роба од Ероглу':
      tasks.push({
        emailId,
        title: 'Прием на роба од Ероглу',
        requestType: 'INBOUND_RECEIPT',
        status: 'PROPOSED',
        dueDate: today,
        isRequiredForCase: true,
        assignedAt: null,
        startedAt: null,
        completedAt: null,
      });
      break;

    case 'Подготовка и испорака за Штип во среда':
      tasks.push({
        emailId,
        title: 'Подготовка на роба за Штип',
        requestType: 'OUTBOUND_PREPARATION',
        status: 'PROPOSED',
        dueDate: new Date('2026-03-24'),
        isRequiredForCase: true,
      });
      tasks.push({
        emailId,
        title: 'Испорака на роба до Штип',
        requestType: 'OUTBOUND_DELIVERY',
        status: 'PROPOSED',
        dueDate: new Date('2026-03-25'),
        isRequiredForCase: true,
      });
      break;

    case 'Носење роба до Битола утре':
      tasks.push({
        emailId,
        title: 'Дистрибуција до Битола',
        requestType: 'TRANSFER_DISTRIBUTION',
        status: 'PROPOSED',
        dueDate: new Date('2026-03-28T12:00:00'),
        isRequiredForCase: true,
      });
      break;

    case 'Прием на пратка од добавувач ТекстилКом':
      tasks.push({
        emailId,
        title: 'Прием на пратка од ТекстилКом',
        requestType: 'INBOUND_RECEIPT',
        status: 'PROPOSED',
        dueDate: today,
        isRequiredForCase: true,
      });
      break;

    case 'Испорака за Охрид во петок':
      tasks.push({
        emailId,
        title: 'Подготовка за Охрид',
        requestType: 'OUTBOUND_PREPARATION',
        status: 'PROPOSED',
        dueDate: new Date('2026-03-26'),
        isRequiredForCase: true,
      });
      tasks.push({
        emailId,
        title: 'Дистрибуција за Охрид',
        requestType: 'OUTBOUND_DELIVERY',
        status: 'PROPOSED',
        dueDate: new Date('2026-03-27'),
        isRequiredForCase: true,
      });
      break;

    case 'Внатрешен трансфер до магацин Скопје 2':
      tasks.push({
        emailId,
        title: 'Трансфер до магацин Скопје 2',
        requestType: 'TRANSFER_DISTRIBUTION',
        status: 'PROPOSED',
        dueDate: new Date('2026-03-28T18:00:00'),
        isRequiredForCase: true,
      });
      break;

    case 'Итна подготовка за испорака':
      tasks.push({
        emailId,
        title: 'Итна подготовка на роба',
        requestType: 'OUTBOUND_PREPARATION',
        status: 'PROPOSED',
        dueDate: today,
        isRequiredForCase: true,
      });
      tasks.push({
        emailId,
        title: 'Испорака до клиент',
        requestType: 'OUTBOUND_DELIVERY',
        status: 'PROPOSED',
        dueDate: new Date('2026-03-29T09:00:00'),
        isRequiredForCase: true,
      });
      break;

    case 'Прием и последователна дистрибуција':
      tasks.push({
        emailId,
        title: 'Прием на роба од Ероглу',
        requestType: 'INBOUND_RECEIPT',
        status: 'APPROVED',
        dueDate: new Date('2026-03-26'),
        isRequiredForCase: true,
      });
      tasks.push({
        emailId,
        title: 'Подготовка за Куманово',
        requestType: 'OUTBOUND_PREPARATION',
        status: 'APPROVED',
        dueDate: new Date('2026-03-25'),
        isRequiredForCase: true,
      });
      tasks.push({
        emailId,
        title: 'Дистрибуција до Куманово',
        requestType: 'OUTBOUND_DELIVERY',
        status: 'APPROVED',
        dueDate: new Date('2026-03-26'),
        isRequiredForCase: true,
      });
      break;
  }

  return tasks;
}

async function createHistoricalData(prisma: PrismaClient, users: any, mailbox: any) {
  // Create some completed cases with OTIF data
  const historicalEmails = [
    {
      subject: 'Испорака до Велес - Завршена',
      sender: 'Клиент Велес',
      senderEmail: 'veles@client.mk',
      body: 'Робата беше испорачена успешно.',
      receivedAt: new Date('2026-03-20T08:00:00'),
      processingStatus: 'PROCESSED',
      requestType: 'OUTBOUND_DELIVERY',
      extractedLocation: 'Veles',
      extractedDeliveryDate: new Date('2026-03-22'),
    },
    {
      subject: 'Прием од Прилеп - Завршен',
      sender: 'Прилеп Индустри',
      senderEmail: 'prilep@industry.mk',
      body: 'Прием на роба од Прилеп.',
      receivedAt: new Date('2026-03-18T10:00:00'),
      processingStatus: 'PROCESSED',
      requestType: 'INBOUND_RECEIPT',
      extractedSupplier: 'Прилеп Индустри',
      extractedDeliveryDate: new Date('2026-03-18'),
    },
  ];

  for (const emailData of historicalEmails) {
    const email = await prisma.email.create({
      data: {
        ...emailData,
        mailboxId: mailbox.id,
        bodyPlainText: emailData.body,
      },
    });

    await prisma.emailCase.create({
      data: {
        emailId: email.id,
        classification: emailData.requestType,
        priority: 'MEDIUM',
        supplierName: emailData.extractedSupplier || null,
        locationName: emailData.extractedLocation || null,
        deliveryDueAt: emailData.extractedDeliveryDate,
        caseDueAt: emailData.extractedDeliveryDate,
        approvedAt: new Date('2026-03-19T10:00:00'),
        completedAt: new Date('2026-03-22T15:00:00'),
        isOnTime: true,
        isInFull: true,
        isOtif: true,
        approvalLeadMinutes: 60,
        executionLeadMinutes: 2880,
        totalTasks: 2,
        completedTasks: 2,
      },
    });

    // Create tasks for historical emails
    await prisma.task.create({
      data: {
        emailId: email.id,
        title: 'Историска задача 1',
        requestType: emailData.requestType,
        status: 'DONE',
        dueDate: emailData.extractedDeliveryDate,
        isRequiredForCase: true,
        assignedAt: new Date('2026-03-19T10:00:00'),
        startedAt: new Date('2026-03-19T11:00:00'),
        completedAt: new Date('2026-03-20T14:00:00'),
        completionResult: 'FULL',
      },
    });
  }

  console.log('Created historical data for reports');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });