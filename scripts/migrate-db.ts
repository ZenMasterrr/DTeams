import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

export const prisma = new PrismaClient();

async function main() {
  console.log('Running database migrations...');
  
  // Apply migrations
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  // Seed initial data if needed
  await seedInitialData();
  
  console.log('Database migration completed successfully');
}

async function seedInitialData() {
  console.log('Seeding initial data...');
  
  // Add any initial data seeding here
  // Example:
  // await prisma.availableAction.upsert({
  //   where: { name: 'email' },
  //   update: {},
  //   create: {
  //     name: 'email',
  //     image: '/images/email-icon.png',
  //   },
  // });
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
