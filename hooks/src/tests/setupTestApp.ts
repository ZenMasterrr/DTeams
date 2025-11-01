import express from 'express';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { TEST_CONFIG } from './config';

// Initialize Prisma client for test database operations
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_CONFIG.DATABASE_URL,
    },
  },
});

// Define test app interface
interface TestApp {
  app: express.Express;
  prisma: PrismaClient;
}

// Initialize test Express app
export const createTestApp = async (): Promise<TestApp> => {
  const app = express();
  
  // Apply middleware
  app.use(express.json());
  
  // Import routes
  const { default: apiRouter } = await import('../routes');
  app.use('/api', apiRouter);
  
  return { app, prisma: testPrisma };
};

// Reset test database
export const resetTestDatabase = async () => {
  try {
    // Disable foreign key checks
    await testPrisma.$executeRaw`SET session_replication_role = 'replica'`;
    
    // Get all table names
    const tables = await testPrisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    
    // Truncate all tables
    for (const { tablename } of tables) {
      if (tablename !== '_prisma_migrations') {
        await testPrisma.$executeRawUnsafe(
          `TRUNCATE TABLE \"public\".\"${tablename}\" CASCADE;`
        );
      }
    }
    
    // Re-enable foreign key checks
    await testPrisma.$executeRaw`SET session_replication_role = 'origin'`;
    
    // Run migrations
    execSync('npx prisma migrate deploy', { 
      env: { ...process.env, DATABASE_URL: TEST_CONFIG.DATABASE_URL },
      stdio: 'ignore'
    });
    
  } catch (error) {
    console.error('Error resetting test database:', error);
    throw error;
  }
};

// Test user utilities
export const createTestUser = async (userData = {}) => {
  return testPrisma.user.create({
    data: {
      email: TEST_CONFIG.TEST_USER.email,
      address: TEST_CONFIG.TEST_USER.address,
      ...userData,
    },
  });
};

export const getTestAuthToken = async (userId: number) => {
  // In a real implementation, generate a JWT token
  return `test-token-${userId}`;
};
