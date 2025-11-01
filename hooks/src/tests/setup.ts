import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

// Reset the test database before each test
beforeEach(async () => {
  // Run migrations
  execSync('npx prisma migrate reset --force', { stdio: 'ignore' });
  
  // Clear all data
  await prisma.$executeRaw`TRUNCATE TABLE "User", "Zap", "Trigger", "Action", "ZapRun", "ActionRun" CASCADE;`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
