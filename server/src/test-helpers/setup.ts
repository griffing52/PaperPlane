import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Use a separate test database
const TEST_DATABASE_URL = 'file:./test.db';
process.env.DATABASE_URL = TEST_DATABASE_URL;

// Create a new Prisma client for tests
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL,
    },
  },
});

// Setup: Run migrations and prepare the test database
beforeAll(async () => {
  // Remove old test database if it exists
  const dbPath = path.join(process.cwd(), '..', 'prisma', 'test.db');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  // Run migrations to create the schema
  execSync('npx prisma migrate deploy --schema=../prisma/schema.prisma', {
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
    },
    stdio: 'inherit',
  });

  // Connect to the database
  await testPrisma.$connect();
});

// Cleanup: Clear data between tests
beforeEach(async () => {
  // Delete all records in reverse order to respect foreign key constraints
  await testPrisma.flightEntry.deleteMany();
  await testPrisma.logbookUpload.deleteMany();
  await testPrisma.pilot.deleteMany();
  await testPrisma.user.deleteMany();
});

// Teardown: Disconnect from the database
afterAll(async () => {
  await testPrisma.$disconnect();

  // Optionally remove the test database after tests
  const dbPath = path.join(process.cwd(), '..', 'prisma', 'test.db');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
});
