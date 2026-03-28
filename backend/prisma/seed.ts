import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

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
  await prisma.mailbox.upsert({
    where: { emailAddress: 'logistics@company.com' },
    update: {},
    create: {
      emailAddress: 'logistics@company.com',
      displayName: 'Logistics Inbox',
    },
  });

  // Create pilot users (for testing without Azure AD)
  const pilotUsers = [
    {
      email: 'manager@company.com',
      displayName: 'Pilot Manager',
      role: 'MANAGER',
    },
    {
      email: 'reception@company.com',
      displayName: 'Reception Coordinator',
      role: 'RECEPTION_COORDINATOR',
    },
    {
      email: 'delivery@company.com',
      displayName: 'Delivery Coordinator',
      role: 'DELIVERY_COORDINATOR',
    },
    {
      email: 'distribution@company.com',
      displayName: 'Distribution Coordinator',
      role: 'DISTRIBUTION_COORDINATOR',
    },
  ];

  for (const user of pilotUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });