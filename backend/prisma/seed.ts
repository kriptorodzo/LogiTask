/**
 * LogiTask - Comprehensive Test Data Simulation Layer
 * 
 * Populates database with realistic scenarios for testing:
 * - Email → Case → Task logic
 * - ERP → Task logic  
 * - Coordinator workboard
 * - Reports/KPI accuracy
 * - Role-specific behavior
 * 
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (daysAgo: number, daysAhead: number = 0): Date => {
  const now = new Date();
  const offset = randomInt(-daysAgo, daysAhead);
  return new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
};
const uuid = () => crypto.randomUUID();

// Realistic Macedonian data
const SUPPLIERS = [
  'Макпетрол АД Скопје',
  'Еурокоп АД Битола',
  'Витаминка АД Струмица',
  'Алкалоид АД Скопје',
  'Табако АД Прилеп',
  'Млекара АД Тетово',
  'ЖИТО АД Скопје',
  'Колово АД Гевгелија',
  'Барда АД Скопје',
  'Текса АД Куманово',
  'Медика АД Скопје',
  'Фармак АД Куманово',
  'Роуглас АД Струга',
  'Каменица АД Крушево',
  'Битолка АД Битола',
];

const LOCATIONS = [
  'Скопје - Центар',
  'Скопје - Карпош',
  'Скопје - Аеродром',
  'Битола',
  'Прилеп',
  'Охрид',
  'Струмица',
  'Гевгелија',
  'Тетово',
  'Куманово',
  'Штип',
  'Кичево',
  'Крушево',
  'Гостивар',
  'Велес',
];

const SUBJECTS = {
  INBOUND_RECEIPT: [
    'Нарачка за набавка - МП ПЕТРОЛ',
    'Прием на стока - Витаминка',
    'Испорака на суровини - Еурокоп',
    'Нарачка бр. 2024-0892',
    'ДОСТАВА - Алкалоид АД',
    'Прием на материјали',
    'Набавка бр. ПО-2024-1234',
    'Испорака од добавувач',
  ],
  OUTBOUND_PREPARATION: [
    'Подготовка на нарачка за клиент',
    'Палетизација - ЛИБЕРА',
    'Комплетирање на нарачка бр. 5678',
    'Подготовка за испорака - Маркет',
    'Pick & Pack - НАКОВ',
    'Подготовка на стока за дистрибуција',
    'Комплетирање на коментарна нарачка',
    'Палетизација и етикетирање',
  ],
  OUTBOUND_DELIVERY: [
    'Испорака до Скопје Центар',
    'ДОСТАВА - ТЦ Битола',
    'Испорака на готова стока',
    'Достава до малопродажен обект',
    'Испорака бр. Д-2024-5678',
    'Рута Б2 - Скопје регион',
    'Испорака до дистрибутивен центар',
    'Достава до краен корисник',
  ],
  TRANSFER_DISTRIBUTION: [
    'Интерна трансферција',
    'Дистрибуција до регионални центри',
    'Пренос на стока - Куманово',
    'Распределба по маркети',
    'Интернално движење на залихи',
    'Дистрибуција - Североисточен регион',
    'Трансфер до магацин Ц',
    'Прераспределба на стока',
  ],
};

const REQUEST_TYPES = [
  'INBOUND_RECEIPT',
  'OUTBOUND_PREPARATION',
  'OUTBOUND_DELIVERY',
  'TRANSFER_DISTRIBUTION',
  'UNCLASSIFIED',
];

const TASK_STATUSES = ['PROPOSED', 'APPROVED', 'IN_PROGRESS', 'DONE', 'REJECTED'];
const CASE_STATUSES = ['NEW', 'PROPOSED', 'APPROVED', 'IN_PROGRESS', 'DONE', 'PARTIAL', 'FAILED'];

const ROLE_MAP: Record<string, string> = {
  'INBOUND_RECEIPT': 'RECEPTION_COORDINATOR',
  'OUTBOUND_PREPARATION': 'DELIVERY_COORDINATOR',
  'OUTBOUND_DELIVERY': 'DELIVERY_COORDINATOR',
  'TRANSFER_DISTRIBUTION': 'DISTRIBUTION_COORDINATOR',
};

async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  await prisma.taskStatusHistory.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.emailCase.deleteMany();
  await prisma.email.deleteMany();
  await prisma.mailbox.deleteMany();
  await prisma.erpDocument.deleteMany();
  await prisma.erpImportBatch.deleteMany();
  await prisma.routePlan.deleteMany();
  await prisma.coordinatorKPI.deleteMany();
  await prisma.kpiSnapshot.deleteMany();
  await prisma.routingRule.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleaned\n');
}

async function createUsers() {
  console.log('👥 Creating users...');
  
  const users = [
    { email: 'admin@logitask.mk', name: 'Администратор', role: 'ADMIN' },
    { email: 'manager@logitask.mk', name: 'Менаџер Логистика', role: 'MANAGER' },
    { email: 'reception@logitask.mk', name: 'Мирко Ристески', role: 'RECEPTION_COORDINATOR' },
    { email: 'delivery@logitask.mk', name: 'Горан Петровски', role: 'DELIVERY_COORDINATOR' },
    { email: 'distribution@logitask.mk', name: 'Сашо Димитровски', role: 'DISTRIBUTION_COORDINATOR' },
    { email: 'reception2@logitask.mk', name: 'Елена Андреевска', role: 'RECEPTION_COORDINATOR' },
    { email: 'delivery2@logitask.mk', name: 'Ненад Стојановски', role: 'DELIVERY_COORDINATOR' },
    { email: 'distribution2@logitask.mk', name: 'Весна Трајковска', role: 'DISTRIBUTION_COORDINATOR' },
    { email: 'coordinator3@logitask.mk', name: 'Зоран Илиевски', role: 'RECEPTION_COORDINATOR' },
    { email: 'coordinator4@logitask.mk', name: 'Марија Николовска', role: 'DELIVERY_COORDINATOR' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: uuid(),
        email: u.email,
        displayName: u.name,
        role: u.role,
        isActive: true,
      },
    });
  }
  
  console.log(`✅ Created ${users.length} users\n`);
  return users;
}

async function createMailboxes() {
  console.log('📬 Creating mailboxes...');
  
  const mailboxes = [
    'logistics@company.mk',
    'warehouse@company.mk',
    'delivery@company.mk',
    'admin@company.mk',
  ];

  for (const email of mailboxes) {
    await prisma.mailbox.upsert({
      where: { emailAddress: email },
      update: {},
      create: {
        id: uuid(),
        emailAddress: email,
        displayName: email.split('@')[0],
        isActive: true,
      },
    });
  }
  
  console.log(`✅ Created ${mailboxes.length} mailboxes\n`);
}

async function createRoutePlans() {
  console.log('🗺️ Creating route plans...');
  
  const routes = [
    { code: 'SK-CENTAR', name: 'Скопје Центар', day: 'MONDAY', offset: 1 },
    { code: 'SK-KARP', name: 'Скопје Карпош', day: 'TUESDAY', offset: 1 },
    { code: 'SK-AERO', name: 'Скопје Аеродром', day: 'WEDNESDAY', offset: 1 },
    { code: 'BITOLA', name: 'Битола', day: 'THURSDAY', offset: 2 },
    { code: 'PRILEP', name: 'Прилеп', day: 'FRIDAY', offset: 2 },
    { code: 'OHRID', name: 'Охрид', day: 'MONDAY', offset: 2 },
    { code: 'STRUMICA', name: 'Струмица', day: 'WEDNESDAY', offset: 2 },
    { code: 'TETOVO', name: 'Тетово', day: 'TUESDAY', offset: 1 },
    { code: 'KUMANOVO', name: 'Куманово', day: 'THURSDAY', offset: 1 },
    { code: 'STIP', name: 'Штип', day: 'FRIDAY', offset: 2 },
  ];

  for (const r of routes) {
    await prisma.routePlan.upsert({
      where: { destinationCode: r.code },
      update: {},
      create: {
        id: uuid(),
        destinationCode: r.code,
        destinationName: r.name,
        routeDay: r.day,
        prepOffsetDays: r.offset,
        active: true,
      },
    });
  }
  
  console.log(`✅ Created ${routes.length} route plans\n`);
}

async function createEmails(users: any[]) {
  console.log('📧 Creating emails with various scenarios...\n');
  
  const scenarios = [
    // SCENARIO 1: Normal email with single task (PENDING)
    {
      subject: 'Нарачка за набавка - МП ПЕТРОЛ',
      sender: 'noreply@mppetrol.mk',
      supplier: 'Макпетрол АД Скопје',
      location: 'Скопје - Центар',
      status: 'PENDING',
      requestType: 'UNCLASSIFIED',
      daysAgo: 0,
    },
    // SCENARIO 2: Email with proposed task (needs approval)
    {
      subject: 'Прием на стока - Витаминка',
      sender: 'warehouse@vitamininka.mk',
      supplier: 'Витаминка АД Струмица',
      location: 'Битола',
      status: 'PROCESSED',
      requestType: 'INBOUND_RECEIPT',
      daysAgo: 1,
      taskStatus: 'PROPOSED',
    },
    // SCENARIO 3: Email with approved task (assigned to coordinator)
    {
      subject: 'Испорака на суровини - Еурокоп',
      sender: 'logistics@eurokop.mk',
      supplier: 'Еурокоп АД Битола',
      location: 'Струмица',
      status: 'PROCESSED',
      requestType: 'INBOUND_RECEIPT',
      daysAgo: 2,
      taskStatus: 'APPROVED',
      assigneeRole: 'RECEPTION_COORDINATOR',
    },
    // SCENARIO 4: Email with in-progress task
    {
      subject: 'Подготовка на нарачка за клиент',
      sender: 'orders@alkaloid.mk',
      supplier: 'Алкалоид АД Скопје',
      location: 'Скопје - Карпош',
      status: 'PROCESSED',
      requestType: 'OUTBOUND_PREPARATION',
      daysAgo: 1,
      taskStatus: 'IN_PROGRESS',
      assigneeRole: 'DELIVERY_COORDINATOR',
    },
    // SCENARIO 5: Multi-task email (2 tasks, different types)
    {
      subject: 'Комплетирање на нарачка - интегрална логистика',
      sender: 'ops@medika.mk',
      supplier: 'Медика АД Скопје',
      location: 'Тетово',
      status: 'PROCESSED',
      requestType: 'OUTBOUND_PREPARATION',
      daysAgo: 0,
      taskCount: 2,
      taskStatuses: ['PROPOSED', 'PROPOSED'],
      taskTypes: ['OUTBOUND_PREPARATION', 'OUTBOUND_DELIVERY'],
    },
    // SCENARIO 6: Problematic - Unclassified email
    {
      subject: 'Проблематичен имејл без јасна содржина',
      sender: 'unknown@suspicious.mk',
      supplier: null,
      location: null,
      status: 'PROCESSED',
      requestType: 'UNCLASSIFIED',
      daysAgo: 3,
    },
    // SCENARIO 7: Overdue case
    {
      subject: 'Доцнење на испорака - итна нарачка',
      sender: 'urgent@farma.mk',
      supplier: 'Фармак АД Куманово',
      location: 'Куманово',
      status: 'PROCESSED',
      requestType: 'OUTBOUND_DELIVERY',
      daysAgo: 5,
      taskStatus: 'IN_PROGRESS',
      assigneeRole: 'DELIVERY_COORDINATOR',
      overdue: true,
    },
    // SCENARIO 8: Email with no tasks (just info)
    {
      subject: 'Известување за промена на цени',
      sender: 'finance@company.mk',
      supplier: null,
      location: null,
      status: 'PROCESSED',
      requestType: 'OTHER',
      daysAgo: 2,
      noTask: true,
    },
    // SCENARIO 9: Distribution case
    {
      subject: 'Дистрибуција до регионални центри',
      sender: 'ops@zito.mk',
      supplier: 'ЖИТО АД Скопје',
      location: 'Велес',
      status: 'PROCESSED',
      requestType: 'TRANSFER_DISTRIBUTION',
      daysAgo: 1,
      taskStatus: 'DONE',
      assigneeRole: 'DISTRIBUTION_COORDINATOR',
    },
    // SCENARIO 10: Partial completion case
    {
      subject: 'Испорака со делумни залихи',
      sender: 'warehouse@makpetrol.mk',
      supplier: 'Макпетрол АД Скопје',
      location: 'Гостивар',
      status: 'PROCESSED',
      requestType: 'INBOUND_RECEIPT',
      daysAgo: 4,
      caseStatus: 'PARTIAL',
      taskStatus: 'DONE',
      assigneeRole: 'RECEPTION_COORDINATOR',
      completionResult: 'PARTIAL',
    },
    // More scenarios for thorough testing
    ...generateMoreEmails(15),
  ];

  const mailbox = await prisma.mailbox.findFirst();
  if (!mailbox) throw new Error('No mailbox found');

  for (const scenario of scenarios) {
    await createEmailScenario(mailbox.id, users, scenario);
  }

  console.log(`✅ Created ${scenarios.length} emails\n`);
}

function generateMoreEmails(count: number): any[] {
  const scenarios: any[] = [];
  for (let i = 0; i < count; i++) {
    const requestType = randomElement(REQUEST_TYPES.filter(t => t !== 'UNCLASSIFIED'));
    scenarios.push({
      subject: randomElement(SUBJECTS[requestType as keyof typeof SUBJECTS] || SUBJECTS.INBOUND_RECEIPT),
      sender: `logistics${i}@company.mk`,
      supplier: randomElement(SUPPLIERS),
      location: randomElement(LOCATIONS),
      status: randomElement(['PENDING', 'PROCESSED']),
      requestType: requestType,
      daysAgo: randomInt(0, 7),
      taskStatus: randomElement(TASK_STATUSES),
      assigneeRole: ROLE_MAP[requestType],
    });
  }
  return scenarios;
}

async function createEmailScenario(
  mailboxId: string,
  users: any[],
  scenario: any
) {
  const now = new Date();
  const receivedAt = new Date(now.getTime() - scenario.daysAgo * 24 * 60 * 60 * 1000);

  // Step 1: Create InboundItem (Master Inbox)
  const inboundItem = await prisma.inboundItem.create({
    data: {
      id: uuid(),
      sourceType: 'EMAIL',
      sourceSubType: 'EMAIL_SEED',
      sourceId: null, // Will be updated after email is created
      subject: scenario.subject,
      supplierName: scenario.supplier,
      locationName: scenario.location,
      requestedDate: scenario.location ? randomDate(1, 5) : null,
      priority: scenario.overdue ? 'HIGH' : 'MEDIUM',
      requestType: scenario.requestType || 'UNCLASSIFIED',
      processingStatus: scenario.status === 'PENDING' ? 'RECLAIMED' : 'PROCESSED',
      receivedAt,
      ingestedAt: now,
    },
  });

  const email = await prisma.email.create({
    data: {
      id: uuid(),
      mailboxId,
      subject: scenario.subject,
      sender: scenario.sender,
      senderEmail: scenario.sender,
      body: `Тело на имејл за: ${scenario.subject}`,
      bodyPlainText: `Тело на имејл за: ${scenario.subject}`,
      receivedAt,
      processingStatus: scenario.status,
      extractedSupplier: scenario.supplier,
      extractedLocation: scenario.location,
      extractedDeliveryDate: scenario.location ? randomDate(1, 5) : null,
      extractedUrgency: scenario.overdue ? 'HIGH' : 'MEDIUM',
      requestType: scenario.requestType || 'UNCLASSIFIED',
      // Link to InboundItem
      inboundItemId: inboundItem.id,
    },
  });

  // Update InboundItem with source ID
  await prisma.inboundItem.update({
    where: { id: inboundItem.id },
    data: { sourceId: email.id },
  });

  // Create case if processed
  if (scenario.status === 'PROCESSED' && !scenario.noTask) {
    const caseStatus = scenario.caseStatus || (
      scenario.taskStatus === 'DONE' ? 'DONE' :
      scenario.taskStatus === 'IN_PROGRESS' ? 'IN_PROGRESS' :
      scenario.taskStatus === 'APPROVED' ? 'APPROVED' : 'PROPOSED'
    );

    const emailCase = await prisma.emailCase.create({
      data: {
        id: uuid(),
        emailId: email.id,
        caseStatus,
        classification: scenario.requestType !== 'UNCLASSIFIED' ? scenario.requestType : null,
        priority: scenario.overdue ? 'HIGH' : 'MEDIUM',
        supplierName: scenario.supplier,
        locationName: scenario.location,
        deliveryDueAt: scenario.location ? randomDate(-2, 3) : null,
        caseDueAt: randomDate(-1, 5),
        approvedAt: scenario.taskStatus !== 'PROPOSED' && scenario.taskStatus !== 'NEW' ? 
          new Date(receivedAt.getTime() + 30 * 60 * 1000) : null,
        completedAt: scenario.taskStatus === 'DONE' ? 
          new Date(receivedAt.getTime() + 2 * 60 * 60 * 1000) : null,
        isOnTime: scenario.completionResult !== 'PARTIAL' ? true : false,
        isInFull: scenario.completionResult === 'PARTIAL' ? false : true,
        isOtif: scenario.completionResult !== 'PARTIAL' ? true : false,
        totalTasks: scenario.taskCount || 1,
        completedTasks: scenario.taskStatus === 'DONE' ? (scenario.taskCount || 1) : 0,
        partialTasks: scenario.completionResult === 'PARTIAL' ? 1 : 0,
      },
    });

    // Create tasks
    const taskCount = scenario.taskCount || 1;
    const taskStatuses = scenario.taskStatuses || [scenario.taskStatus || 'PROPOSED'];
    const taskTypes = scenario.taskTypes || [scenario.requestType];

    for (let i = 0; i < taskCount; i++) {
      const taskStatus = taskStatuses[i] || taskStatuses[0];
      const assignee = scenario.assigneeRole ? 
        users.find(u => u.role === scenario.assigneeRole) : null;

      const dueDate = new Date(receivedAt.getTime() + (scenario.overdue ? -24 : 24) * 60 * 60 * 1000);

      const task = await prisma.task.create({
        data: {
          id: uuid(),
          emailId: email.id,
          inboundItemId: inboundItem.id,  // Link to Master Inbox
          title: scenario.subject,
          description: `Задача ${i + 1} од случај: ${scenario.subject}`,
          status: taskStatus,
          requestType: taskTypes[i] || taskTypes[0],
          dueDate,
          isRequiredForCase: true,
          assignedAt: assignee && taskStatus !== 'PROPOSED' ? 
            new Date(receivedAt.getTime() + 30 * 60 * 1000) : null,
          startedAt: taskStatus === 'IN_PROGRESS' || taskStatus === 'DONE' ?
            new Date(receivedAt.getTime() + 45 * 60 * 1000) : null,
          completedAt: taskStatus === 'DONE' ?
            new Date(receivedAt.getTime() + 2 * 60 * 60 * 1000) : null,
          completionResult: scenario.completionResult || 
            (taskStatus === 'DONE' ? 'FULL' : null),
          delayReasonCode: scenario.completionResult === 'PARTIAL' ? 'PARTIAL_STOCK' : null,
          delayReasonText: scenario.completionResult === 'PARTIAL' ? 
            'Делумна испорака поради недостиг на стока' : null,
          onTimeDelivery: taskStatus === 'DONE' ? !scenario.overdue : null,
          delayMinutes: scenario.overdue ? randomInt(30, 120) : 0,
        },
      });

      // Assign task if needed
      if (assignee && taskStatus !== 'PROPOSED') {
        await prisma.task.update({
          where: { id: task.id },
          data: { assigneeId: assignee.id },
        });
      }

      // Create status history
      await createStatusHistory(task.id, taskStatus, users[1]?.id);
    }
  }

  return email;
}

async function createStatusHistory(taskId: string, finalStatus: string, userId?: string) {
  const history = [
    { status: 'PROPOSED', delay: 0 },
    { status: 'APPROVED', delay: 30 },
  ];

  if (finalStatus === 'IN_PROGRESS' || finalStatus === 'DONE') {
    history.push({ status: 'IN_PROGRESS', delay: 45 });
  }
  if (finalStatus === 'DONE') {
    history.push({ status: 'DONE', delay: 120 });
  }

  for (const h of history) {
    await prisma.taskStatusHistory.create({
      data: {
        id: uuid(),
        taskId,
        fromStatus: history.indexOf(h) > 0 ? history[history.indexOf(h) - 1].status : null,
        toStatus: h.status,
        changedByUserId: userId,
        changedAt: new Date(Date.now() + h.delay * 60 * 1000),
      },
    });
  }
}

async function createErpDocuments() {
  console.log('📦 Creating ERP documents...\n');
  
  const documents = [
    // PURCHASE_ORDER - creates INBOUND_RECEIPT task
    {
      type: 'PURCHASE_ORDER',
      number: 'PO-2024-001',
      partner: 'Макпетрол АД Скопје',
      destination: 'Магацин Прием',
      plannedDate: randomDate(0, 3),
    },
    {
      type: 'PURCHASE_ORDER',
      number: 'PO-2024-002',
      partner: 'Витаминка АД Струмица',
      destination: 'Магацин Прием',
      plannedDate: randomDate(0, 2),
    },
    // GOODS_RECEIPT - completes reception
    {
      type: 'GOODS_RECEIPT',
      number: 'GR-2024-001',
      partner: 'Еурокоп АД Битола',
      destination: 'Магацин Битола',
      plannedDate: randomDate(-1, 1),
    },
    {
      type: 'GOODS_RECEIPT',
      number: 'GR-2024-002',
      partner: 'Алкалоид АД Скопје',
      destination: 'Магацин Центар',
      plannedDate: randomDate(-2, 0),
    },
    // SALES_ORDER - creates OUTBOUND tasks
    {
      type: 'SALES_ORDER',
      number: 'SO-2024-001',
      partner: 'Малопродажба АД',
      destination: 'ТЦ Битола',
      plannedDate: randomDate(0, 5),
    },
    {
      type: 'SALES_ORDER',
      number: 'SO-2024-002',
      partner: 'Хотели АД',
      destination: 'Охрид',
      plannedDate: randomDate(1, 4),
    },
    // SHIPMENT_ORDER - creates DISTRIBUTION tasks
    {
      type: 'SHIPMENT_ORDER',
      number: 'SHIP-2024-001',
      partner: 'Дистрибуција АД',
      destination: 'Скопје Регион',
      plannedDate: randomDate(0, 2),
    },
    {
      type: 'SHIPMENT_ORDER',
      number: 'SHIP-2024-002',
      partner: 'Логистика ООО',
      destination: 'Куманово',
      plannedDate: randomDate(0, 1),
    },
  ];

  for (const doc of documents) {
    await prisma.erpDocument.create({
      data: {
        id: uuid(),
        sourceType: 'ERP_IMPORT',
        documentType: doc.type,
        documentNumber: doc.number,
        partnerName: doc.partner,
        destinationName: doc.destination,
        plannedDate: doc.plannedDate,
        lineCount: randomInt(1, 10),
        totalQuantity: randomInt(10, 500),
      },
    });
  }

  console.log(`✅ Created ${documents.length} ERP documents\n`);
}

async function createKpiSnapshots() {
  console.log('📊 Creating KPI snapshots...\n');
  
  // Generate last 14 days of KPI data
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const periodStart = new Date(date);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(date);
    periodEnd.setHours(23, 59, 59, 999);

    // Overall metrics
    const totalCases = randomInt(20, 50);
    const otifCases = Math.floor(totalCases * (0.85 + Math.random() * 0.12));
    const onTimeCases = Math.floor(totalCases * (0.88 + Math.random() * 0.10));
    const inFullCases = Math.floor(totalCases * (0.90 + Math.random() * 0.08));
    const overdueCases = randomInt(0, 5);

    await prisma.kpiSnapshot.create({
      data: {
        id: uuid(),
        periodType: 'DAY',
        periodStart,
        periodEnd,
        totalCases,
        otifCases,
        onTimeCases,
        inFullCases,
        overdueCases,
        otifRate: (otifCases / totalCases) * 100,
        onTimeRate: (onTimeCases / totalCases) * 100,
        inFullRate: (inFullCases / totalCases) * 100,
        avgApprovalMinutes: randomInt(15, 45),
        avgExecutionMinutes: randomInt(60, 180),
      },
    });

    // Role-specific snapshots
    const roles = ['RECEPTION_COORDINATOR', 'DELIVERY_COORDINATOR', 'DISTRIBUTION_COORDINATOR'];
    for (const role of roles) {
      await prisma.kpiSnapshot.create({
        data: {
          id: uuid(),
          periodType: 'DAY',
          periodStart,
          periodEnd,
          roleCode: role,
          totalCases: randomInt(5, 15),
          otifCases: randomInt(4, 14),
          onTimeCases: randomInt(5, 14),
          inFullCases: randomInt(5, 14),
          overdueCases: randomInt(0, 2),
          otifRate: 80 + Math.random() * 18,
          onTimeRate: 85 + Math.random() * 13,
          inFullRate: 88 + Math.random() * 10,
        },
      });
    }
  }

  console.log('✅ Created 14 days of KPI snapshots\n');
}

async function createCoordinatorKpi() {
  console.log('🎯 Creating Coordinator KPI records...\n');
  
  const users = await prisma.user.findMany({
    where: { role: { in: ['RECEPTION_COORDINATOR', 'DELIVERY_COORDINATOR', 'DISTRIBUTION_COORDINATOR'] } },
  });

  const now = new Date();
  for (const user of users) {
    const tasks = await prisma.task.findMany({ where: { assigneeId: user.id } });
    const tasksTotal = tasks.length;
    const tasksDone = tasks.filter(t => t.status === 'DONE').length;
    const tasksPartial = tasks.filter(t => t.completionResult === 'PARTIAL').length;
    const tasksFailed = tasks.filter(t => t.completionResult === 'FAILED').length;
    const tasksOverdue = tasks.filter(t => t.status === 'IN_PROGRESS' && t.dueDate && new Date(t.dueDate) < now).length;
    const tasksOnTime = tasks.filter(t => t.onTimeDelivery === true).length;

    const accuracy = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : null;
    const otif = tasksTotal > 0 ? Math.round(((tasksDone - tasksOverdue) / tasksTotal) * 100) : null;

    await prisma.coordinatorKPI.create({
      data: {
        id: uuid(),
        userId: user.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        tasksTotal,
        tasksDone,
        tasksPartial,
        tasksFailed,
        tasksOverdue,
        tasksOnTime,
        accuracy,
        otif,
        prepOnTime: user.role === 'RECEPTION_COORDINATOR' || user.role === 'DELIVERY_COORDINATOR' ? 
          75 + Math.floor(Math.random() * 20) : null,
        deliveryOnTime: user.role === 'DELIVERY_COORDINATOR' ? 
          70 + Math.floor(Math.random() * 25) : null,
        activeRole: user.role,
        totalScore: 70 + Math.floor(Math.random() * 25),
        bonusPercent: randomElement([0, 40, 70, 100]),
      },
    });
  }

  console.log(`✅ Created KPI records for ${users.length} coordinators\n`);
}

async function createRoutingRules() {
  console.log('🔀 Creating routing rules...\n');
  
  const rules = [
    { name: 'Inbound Receipt → Reception', type: 'INBOUND_RECEIPT', role: 'RECEPTION_COORDINATOR' },
    { name: 'Outbound Prep → Delivery', type: 'OUTBOUND_PREPARATION', role: 'DELIVERY_COORDINATOR' },
    { name: 'Outbound Delivery → Delivery', type: 'OUTBOUND_DELIVERY', role: 'DELIVERY_COORDINATOR' },
    { name: 'Distribution → Distribution', type: 'TRANSFER_DISTRIBUTION', role: 'DISTRIBUTION_COORDINATOR' },
  ];

  for (const rule of rules) {
    await prisma.routingRule.upsert({
      where: { name: rule.name },
      update: {},
      create: {
        id: uuid(),
        name: rule.name,
        requestType: rule.type,
        priority: 1,
        assigneeRole: rule.role,
        isActive: true,
        conditions: JSON.stringify({ type: rule.type }),
      },
    });
  }

  console.log(`✅ Created ${rules.length} routing rules\n`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎲 LogiTask Test Data Simulation Layer');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await cleanDatabase();
    
    const users = await createUsers();
    await createMailboxes();
    await createRoutePlans();
    await createRoutingRules();
    await createEmails(users);
    await createErpDocuments();
    await createKpiSnapshots();
    await createCoordinatorKpi();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TEST DATA SIMULATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📋 Summary:');
    console.log('- Users: 10 (Manager, Admin, 7 Coordinators)');
    console.log('- Route Plans: 10');
    console.log('- Emails: 25+ (various scenarios)');
    console.log('- ERP Documents: 8');
    console.log('- KPI Snapshots: 14 days × (1 overall + 3 role-specific)');
    console.log('- Coordinator KPI: Current month');
    console.log('\n🎯 Test scenarios covered:');
    console.log('- PENDING emails (needs classification)');
    console.log('- PROPOSED tasks (needs approval)');
    console.log('- APPROVED tasks (assigned, ready to start)');
    console.log('- IN_PROGRESS tasks (in execution)');
    console.log('- DONE tasks (completed)');
    console.log('- OVERDUE cases (late)');
    console.log('- PARTIAL completion');
    console.log('- UNCLASSIFIED emails');
    console.log('- Multi-task emails');
    console.log('\n🔗 Login credentials:');
    console.log('  Manager: manager@logitask.mk');
    console.log('  Coordinator: reception@logitask.mk, delivery@logitask.mk, distribution@logitask.mk');
    console.log('  Admin: admin@logitask.mk');
    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();