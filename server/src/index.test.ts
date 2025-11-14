import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './index';
import { createTestFlightLog, createTestUser } from './test-factories';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FAKE_UUID = "10000000-1000-4000-8000-100000000000";
const TEST_LICENSE_NUMBER = '12345';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /flight_logs/:id', () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlightLog>>;

    beforeAll(async () => {
      cleanup = await createTestFlightLog();
    });

    afterAll(async () => {
      await cleanup();
    });

    it('should return a flight log by id', async () => {
      const testFlightLog = cleanup.flightLog;
      const response = await request(app)
        .get(`/flight_logs/${testFlightLog.id}`);

      expect(response.status).toBe(200);
      // NOTE: Everything must be a string
      // since we aren't reparsing it
      expect(response.body).toMatchObject({
        id: testFlightLog.id,
        userId: testFlightLog.userId,
        totalFlightTime: "1.5",
        crossCountryTime: "1.5",
      });
    });

    it('should 400 when the flight id is bad', async () => {
      const response = await request(app)
        .get(`/flight_logs/FAKE`);
      expect(response.status).toBe(400);
    });

    it('should 404 when the flight id is not found', async () => {
      const response = await request(app)
        .get(`/flight_logs/${FAKE_UUID}`);
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /flight_logs/:id', () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlightLog>>;

    beforeAll(async () => {
      cleanup = await createTestFlightLog();
    });

    afterAll(async () => {
      await cleanup();
    });

    it('should delete a flight log by id', async () => {
      const flightLog = cleanup.flightLog;

      const response = await request(app)
        .delete(`/flight_logs/${flightLog.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(flightLog.id);

      const getResponse = await request(app)
        .get(`/flight_logs/${flightLog.id}`);
      expect(getResponse.status).toBe(404);

      await cleanup();
    });

    it('should 400 when the flight id is bad', async () => {
      const response = await request(app)
        .delete(`/flight_logs/FAKE`);
      expect(response.status).toBe(400);
    });

    it('should 404 when the flight id is not found', async () => {
      const response = await request(app)
        .delete(`/flight_logs/${FAKE_UUID}`);
      expect(response.status).toBe(404);
    });
  });

  // AI Disclosure by Bolun Thompson:
  // I used Claude Code Sonnet 4.5 to generate this test, since it's largely repititive. Prompt as follows:
  // Add an anlogous user test. Make it short and to the point. Add a minimal test that its been stored in the DB.
  // I refactored it slightly afterwards.
  describe('POST /user/', () => {
    let createdUserId: string;
    beforeAll(async () => {
      // cleanup if other tests forgot to
      await prisma.user.deleteMany({ where: { licenseNumber: TEST_LICENSE_NUMBER } });
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => { });
    });

    it('should create a user and store in DB', async () => {
      const email = `test-${Date.now()}@example.com`;
      const user = { name: 'Test', email, licenseNumber: TEST_LICENSE_NUMBER };

      const response = await request(app)
        .post('/user/')
        .send(user);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(user);
      createdUserId = response.body.id;

      const dbUser = await prisma.user.findUnique({ where: { id: response.body.id } });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(email);
    });

    it('should 400 when body is invalid', async () => {
      const response = await request(app)
        .post('/user/')
        .send({ name: 'Test' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /flight_logs/', () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlightLog>>;

    beforeAll(async () => {
      cleanup = await createTestFlightLog();
    });

    afterAll(async () => {
      await cleanup();
    });

    it('should return flight logs filtered by userId', async () => {
      const { flightLog: { userId } } = cleanup;
      const response = await request(app)
        .get(`/flight_logs/`)
        .query({ userId });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].userId).toBe(userId);
    });

    it('should return empty array when no flight logs match', async () => {
      const response = await request(app)
        .get(`/flight_logs/`)
        .query({ flightId: FAKE_UUID });

      expect(response.status).toBe(201);
      expect(response.body).toEqual([]);
    });

    it('should 400 when userId is invalid', async () => {
      const response = await request(app)
        .get(`/flight_logs/`)
        .query({ userId: 'INVALID' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /logbook/', () => {
    let cleanup: Awaited<ReturnType<typeof createTestUser>>;

    beforeAll(async () => {
      cleanup = await createTestUser();
    });

    afterAll(async () => {
      await cleanup();
    });

    // TODO: This should fail once we do proper parsing, since the buffer is invalid
    it('should return a flight log with an id when passed a buffer', async () => {
      const response = await request(app)
        .post('/logbook/')
        .attach('image', Buffer.from('fake-image-data'), 'test.png')
        .field('userId', cleanup.user.id);

      expect(response.status).toBe(201);
      expect(response.body.data.id).toBeDefined();
    });

  });
});
