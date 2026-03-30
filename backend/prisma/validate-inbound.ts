/**
 * Validation Script for InboundItem Integration
 * Run: npx ts-node prisma/validate-inbound.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateInboundIntegration() {
  console.log('\n🔍 VALIDATION: InboundItem Integration Check\n');
  console.log('='.repeat(60));

  let errors = 0;
  let warnings = 0;

  // 1. Check for emails without InboundItem
  console.log('\n📧 1. Emails without InboundItem:');
  const emailsWithoutInbound = await prisma.email.findMany({
    where: { inboundItemId: null },
    select: { id: true, subject: true, processingStatus: true },
  });
  
  if (emailsWithoutInbound.length > 0) {
    console.log(`   ❌ Found ${emailsWithoutInbound.length} emails without InboundItem`);
    errors += emailsWithoutInbound.length;
  } else {
    console.log(`   ✅ All emails have InboundItem`);
  }

  // 2. Check for ERP documents without InboundItem
  console.log('\n📦 2. ERP Documents without InboundItem:');
  const erpDocsWithoutInbound = await prisma.erpDocument.findMany({
    where: { inboundItemId: null },
    select: { id: true, documentNumber: true, documentType: true },
  });
  
  if (erpDocsWithoutInbound.length > 0) {
    console.log(`   ❌ Found ${erpDocsWithoutInbound.length} ERP documents without InboundItem`);
    errors += erpDocsWithoutInbound.length;
  } else {
    console.log(`   ✅ All ERP documents have InboundItem`);
  }

  // 3. Check for tasks without InboundItem (excluding legacy)
  console.log('\n📋 3. Tasks without InboundItem (legacy check):');
  const tasksWithoutInbound = await prisma.task.findMany({
    where: {
      inboundItemId: null,
      emailId: null,
      erpDocumentId: null,
    },
    select: { id: true, title: true, status: true },
  });
  
  if (tasksWithoutInbound.length > 0) {
    console.log(`   ⚠️ Found ${tasksWithoutInbound.length} orphan tasks (no inbound, email, or erp link)`);
    warnings += tasksWithoutInbound.length;
  } else {
    console.log(`   ✅ All tasks have at least one source link`);
  }

  // 4. Check InboundItem processing status
  console.log('\n📊 4. InboundItem Status Distribution:');
  const inboundStats = await prisma.inboundItem.groupBy({
    by: ['processingStatus'],
    _count: true,
  });
  
  for (const stat of inboundStats) {
    console.log(`   - ${stat.processingStatus}: ${stat._count}`);
  }

  // 5. Check source type distribution
  console.log('\n📊 5. Source Type Distribution:');
  const sourceStats = await prisma.inboundItem.groupBy({
    by: ['sourceType'],
    _count: true,
  });
  
  for (const stat of sourceStats) {
    console.log(`   - ${stat.sourceType}: ${stat._count}`);
  }

  // 6. Check for InboundItems without sourceId
  console.log('\n🔗 6. InboundItems without sourceId:');
  const inboundWithoutSource = await prisma.inboundItem.findMany({
    where: { sourceId: null },
    select: { id: true, subject: true, sourceType: true },
  });
  
  if (inboundWithoutSource.length > 0) {
    console.log(`   ⚠️ Found ${inboundWithoutSource.length} InboundItems without external reference`);
    warnings += inboundWithoutSource.length;
  } else {
    console.log(`   ✅ All InboundItems have external references`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 SUMMARY:');
  console.log(`   Errors: ${errors}`);
  console.log(`   Warnings: ${warnings}`);

  if (errors === 0 && warnings === 0) {
    console.log('\n   ✅ VALIDATION PASSED - All data properly linked!\n');
  } else if (errors === 0) {
    console.log('\n   ⚠️ VALIDATION PASSED with warnings\n');
  } else {
    console.log('\n   ❌ VALIDATION FAILED - Fix errors before proceeding\n');
  }

  // Show sample query for Manager Inbox
  console.log('\n📝 Example Manager Inbox Query:');
  console.log('='.repeat(60));
  console.log(`
const pendingInbound = await prisma.inboundItem.findMany({
  where: {
    processingStatus: 'RECLAIMED',  // New items to process
  },
  include: {
    email: true,           // Original email
    erpDocument: true,    // Original ERP doc
    case: true,           // Linked case
    tasks: true,          // Generated tasks
  },
  orderBy: { receivedAt: 'desc' },
});
`);

  await prisma.$disconnect();
}

validateInboundIntegration()
  .catch(console.error)
  .finally(() => process.exit());