/**
 * seed.ts
 *
 * Prisma Database Seeding Script
 * Populates the database with mock data for development and testing
 *
 * Usage:
 *   npx prisma db seed
 *
 * Or add to package.json:
 *   "prisma": {
 *     "seed": "tsx prisma/seed.ts"
 *   }
 */

import { PrismaClient } from '@prisma/client';
import { mockCustomersData, mockServiceRecordsData } from './mockData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - be careful in production!)
  console.log('🧹 Cleaning existing data...');
  await prisma.reminder.deleteMany();
  await prisma.serviceRecord.deleteMany();
  await prisma.customer.deleteMany();
  console.log('✅ Existing data cleared');

  // Seed Customers
  console.log('\n👥 Seeding customers...');
  const customerIdMap: Record<number, number> = {}; // oldId -> newId mapping

  for (const customer of mockCustomersData) {
    const created = await prisma.customer.create({
      data: {
        companyName: customer.companyName,
        contactPerson: customer.contactPerson || null,
        phone: customer.phone || null,
        email: customer.email || null,
        address: customer.address || null,
        notes: customer.notes || null,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    });
    customerIdMap[customer.customerId] = created.customerId; // Store mapping
    console.log(`  ✅ Created: ${created.companyName} (Old ID: ${customer.customerId} -> New ID: ${created.customerId})`);
  }

  // Seed Service Records
  console.log('\n📋 Seeding service records...');
  for (const record of mockServiceRecordsData) {
    const newCustomerId = customerIdMap[record.customerId];
    if (!newCustomerId) {
      console.warn(`  ⚠️  Skipping service record - customer ID ${record.customerId} not found in mapping`);
      continue;
    }

    const created = await prisma.serviceRecord.create({
      data: {
        customerId: newCustomerId, // Use mapped ID
        serviceDate: record.serviceDate,
        serviceType: record.serviceType || null,
        serviceDescription: record.serviceDescription || null,
        amount: record.amount || null,
        status: record.status || 'completed',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    });
    console.log(`  ✅ Created: ${created.serviceType} for Customer ID ${created.customerId} (Record ID: ${created.recordId})`);
  }

  // Verify counts
  console.log('\n📊 Verifying seeded data...');
  const customerCount = await prisma.customer.count();
  const serviceRecordCount = await prisma.serviceRecord.count();
  const reminderCount = await prisma.reminder.count();

  console.log(`  👥 Customers: ${customerCount}`);
  console.log(`  📋 Service Records: ${serviceRecordCount}`);
  console.log(`  🔔 Reminders: ${reminderCount}`);

  console.log('\n✅ Database seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
