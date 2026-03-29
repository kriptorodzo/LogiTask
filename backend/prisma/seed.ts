import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Suppliers and locations for realistic data
const SUPPLIERS = [
  'Ероглу Доставка', 'ТекстилКом', 'Мебел Македонија', 'Електро Дистрибуција',
  'Храна Плус', 'Градежен Материјал', 'Авто Делови', 'Канцелариска Опрема',
  'Хемикалии ДОО', 'Пластика Индустри', 'Мetal Централ', 'Стекло Сервис',
  'Нафта ПЕТ', 'Логистика Вардар', 'Транспорт Југ', 'Пакет Експрес'
];

const LOCATIONS = [
  'Скопје', 'Битола', 'Прилеп', 'Куманово', 'Охрид', 'Штип', 'Велес',
  'Струга', 'Гостивар', 'Тетово', 'Кичево', 'Кавадарци', 'Кочани',
  'Пробищип', 'Неготино', 'Македонски Брод'
];

const SENDERS = [
  { name: 'Вработен на Скопје 1', email: 'skopje1@company.mk' },
  { name: 'Магацин Централа', email: 'magacin@company.mk' },
  { name: 'Клиент Битола', email: 'bitola@client.mk' },
  { name: 'Добавувач Ероглу', email: 'eroglu@delivery.mk' },
  { name: 'Трговски Дом Штип', email: 'trgovski@company.mk' },
  { name: 'Логистика Охрид', email: 'ohrid@logistics.mk' },
  { name: 'Градоначалник Прилеп', email: 'grad.prilep@mk' },
  { name: 'Хипермаркет Велес', email: 'hiper@market.mk' },
  { name: 'Фабрика Гостивар', email: 'fabrika@gost.mk' },
  { name: 'Транспорт Југ', email: 'transport@jugg.mk' },
];

const REQUEST_TYPES = [
  'INBOUND_RECEIPT', 'OUTBOUND_PREPARATION', 'OUTBOUND_DELIVERY', 'TRANSFER_DISTRIBUTION'
];

const STATUSES = ['PROPOSED', 'APPROVED', 'IN_PROGRESS', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

async function main() {
  console.log('Clearing existing data...');
  await prisma.task.deleteMany();
  await prisma.emailCase.deleteMany();
  await prisma.email.deleteMany();
  await prisma.routingRule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mailbox.deleteMany();

  console.log('Seeding database with comprehensive demo data...');

  // Create mailbox
  const mailbox = await prisma.mailbox.create({
    data: {
      emailAddress: 'logistics@company.com',
      displayName: 'Logistics Inbox',
    },
  });

  // Create users (coordinators + manager)
  const users = await Promise.all([
    prisma.user.create({ data: { email: 'manager@company.com', displayName: 'Иван Петровски', role: 'MANAGER' } }),
    prisma.user.create({ data: { email: 'reception@company.com', displayName: 'Марија Станкова', role: 'RECEPTION_COORDINATOR' } }),
    prisma.user.create({ data: { email: 'delivery@company.com', displayName: 'Стојан Димитровски', role: 'DELIVERY_COORDINATOR' } }),
    prisma.user.create({ data: { email: 'distribution@company.com', displayName: 'Елена Наумова', role: 'DISTRIBUTION_COORDINATOR' } }),
  ]);

  const [manager, reception, delivery, distribution] = users;

  // Create routing rules
  const routingRules = [
    { name: 'Inbound to Reception', requestType: 'INBOUND_RECEIPT', assigneeRole: 'RECEPTION_COORDINATOR' },
    { name: 'Outbound Prep to Delivery', requestType: 'OUTBOUND_PREPARATION', assigneeRole: 'DELIVERY_COORDINATOR' },
    { name: 'Outbound Delivery to Delivery', requestType: 'OUTBOUND_DELIVERY', assigneeRole: 'DELIVERY_COORDINATOR' },
    { name: 'Transfer to Distribution', requestType: 'TRANSFER_DISTRIBUTION', assigneeRole: 'DISTRIBUTION_COORDINATOR' },
  ];

  for (const rule of routingRules) {
    await prisma.routingRule.create({
      data: {
        name: rule.name,
        requestType: rule.requestType,
        priority: 1,
        conditions: JSON.stringify({ requestType: rule.requestType }),
        assigneeRole: rule.assigneeRole,
        isActive: true,
      },
    });
  }

  // Generate 7 days of data (current week)
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

  console.log(`Generating data from ${startOfWeek.toISOString()} for 7 days...`);

  let emailCount = 0;
  let taskCount = 0;

  // Daily template for emails per coordinator
  const coordinatorEmails = {
    reception: [
      'Прием на пратка од {supplier}',
      'Итна приемка - {supplier}',
      'Проверка на квалитет - {supplier}',
      'Раздолжување на возило',
      'Внесување во магацин',
      'Документација за прием',
      'Најава на добавувач',
      'Проверка на количини',
      'Складирање на артикли',
      'Потврда за прием',
    ],
    delivery: [
      'Подготовка на возило за {location}',
      'Утоварување на роба',
      'Планирање на рута до {location}',
      'Пријава за испорака',
      'Проверка на пратката',
      'Потврда за клиент',
      'Документација за испорака',
      'Враќање на возило',
      'Пополнување на извештај',
      'Завршна проверка',
    ],
    distribution: [
      'Дистрибуција до {location}',
      'Планирање на пакети',
      'Рута за {location}',
      'Координација со магацин',
      'Испорака на пратки',
      'Потврда за примач',
      'Ажурирање на статус',
      'Финална дистрибуција',
      'Затворање на налог',
      'Извештај за денот',
    ],
  };

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + dayOffset);
    
    const dayName = ['Понеделник', 'Вторник', 'Среда', 'Четврток', 'Петок', 'Сабота', 'Недела'][dayOffset];

    console.log(`Creating data for ${dayName} (${currentDate.toISOString().split('T')[0]})...`);

    // Create 10 emails per day
    for (let i = 0; i < 10; i++) {
      const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const sender = SENDERS[Math.floor(Math.random() * SENDERS.length)];
      const requestType = REQUEST_TYPES[Math.floor(Math.random() * REQUEST_TYPES.length)];
      const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
      
      // Random hour between 6:00 and 18:00
      const hour = 6 + Math.floor(Math.random() * 12);
      const emailTime = new Date(currentDate);
      emailTime.setHours(hour, Math.floor(Math.random() * 60), 0);

      const email = await prisma.email.create({
        data: {
          subject: `Логистика ${dayName} - ${supplier}`,
          sender: sender.name,
          senderEmail: sender.email,
          body: `Бараж за ${requestType.split('_')[1]}.\n\nПартнер: ${supplier}\nЛокација: ${location}\nПриоритет: ${priority}\n\nОчекувано време на пристигнување: ${emailTime.toISOString()}`,
          receivedAt: emailTime,
          processingStatus: 'PROCESSED',
          mailboxId: mailbox.id,
          bodyPlainText: `Бараж за ${requestType.split('_')[1]}. Партнер: ${supplier}, Локација: ${location}`,
          extractedSupplier: supplier,
          extractedLocation: location,
          extractedDeliveryDate: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
          extractedUrgency: priority,
          requestType: requestType,
        },
      });
      emailCount++;

      // Create email case
      const emailCase = await prisma.emailCase.create({
        data: {
          emailId: email.id,
          classification: requestType,
          priority: priority,
          supplierName: supplier,
          locationName: location,
          deliveryDueAt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
          caseDueAt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      // Create tasks for each coordinator (2 tasks per email)
      const coordinators = [
        { user: reception, types: ['INBOUND_RECEIPT'] },
        { user: delivery, types: ['OUTBOUND_PREPARATION', 'OUTBOUND_DELIVERY'] },
        { user: distribution, types: ['TRANSFER_DISTRIBUTION'] },
      ];

      // Only create tasks for relevant coordinators based on request type
      const relevantCoordinators = coordinators.filter(c => 
        c.types.some(t => requestType.includes(t))
      );

      // Add all coordinators for demo purposes
      for (const coord of coordinators) {
        const taskStatuses = dayOffset < 4 
          ? ['APPROVED', 'IN_PROGRESS', 'DONE'] // Past days have completed tasks
          : ['PROPOSED', 'APPROVED', 'IN_PROGRESS']; // Recent days have active tasks

        const taskStatus = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
        
        // Task due time varies by coordinator
        const taskHour = 8 + Math.floor(Math.random() * 8);
        const taskTime = new Date(currentDate);
        taskTime.setHours(taskHour, 0, 0);

        const task = await prisma.task.create({
          data: {
            emailId: email.id,
            title: `Задача ${coord.user.displayName} - ${dayName}`,
            requestType: requestType,
            status: taskStatus,
            dueDate: taskTime,
            isRequiredForCase: true,
            assignedAt: taskStatus !== 'PROPOSED' ? taskTime : null,
            startedAt: taskStatus === 'IN_PROGRESS' || taskStatus === 'DONE' 
              ? new Date(taskTime.getTime() + 30 * 60 * 1000) : null,
            completedAt: taskStatus === 'DONE' 
              ? new Date(taskTime.getTime() + 60 * 60 * 1000 * (2 + Math.random() * 2)) : null,
            completionResult: taskStatus === 'DONE' ? (Math.random() > 0.1 ? 'FULL' : 'PARTIAL') : null,
          },
        });
        taskCount++;
      }

      // Create historical OTIF data for reports (for past 3 days)
      if (dayOffset < 4 && Math.random() > 0.5) {
        await prisma.emailCase.update({
          where: { id: emailCase.id },
          data: {
            approvedAt: new Date(currentDate.getTime() + 2 * 60 * 60 * 1000),
            completedAt: new Date(currentDate.getTime() + 20 * 60 * 60 * 1000),
            isOnTime: Math.random() > 0.2,
            isInFull: Math.random() > 0.1,
            isOtif: Math.random() > 0.3,
            approvalLeadMinutes: Math.floor(Math.random() * 120) + 30,
            executionLeadMinutes: Math.floor(Math.random() * 180) + 60,
            totalTasks: 2 + Math.floor(Math.random() * 3),
            completedTasks: 2 + Math.floor(Math.random() * 3),
          },
        });
      }
    }
  }

  console.log(`\n✅ Seeding completed!`);
  console.log(`   - Created ${emailCount} emails`);
  console.log(`   - Created ${taskCount} tasks`);
  console.log(`   - Created ${users.length} users`);
  console.log(`   - Created ${routingRules.length} routing rules`);
  console.log(`\nUsers:`);
  console.log(`   - Manager: manager@company.com`);
  console.log(`   - Reception: reception@company.com`);
  console.log(`   - Delivery: delivery@company.com`);
  console.log(`   - Distribution: distribution@company.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });