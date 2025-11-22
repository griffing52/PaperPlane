import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './index';
import { createTestFlightEntry, createTestUser, createTestFlight } from './test-factories';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FAKE_UUID = "10000000-1000-4000-8000-100000000000";
const TEST_LICENSE_NUMBER = '12345';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/flight_entries/:id', () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlightEntry>>;

    beforeAll(async () => {
      cleanup = await createTestFlightEntry();
    });

    afterAll(async () => {
      await cleanup();
    });

    it('should return a flight entry by id', async () => {
      const testFlightEntry = cleanup.flightEntry;
      const response = await request(app)
        .get(`/api/v1/flight_entries/${testFlightEntry.id}`);

      expect(response.status).toBe(200);
      // NOTE: Everything must be a string
      // since we aren't reparsing it
      expect(response.body).toMatchObject({
        id: testFlightEntry.id,
        userId: testFlightEntry.userId,
        totalFlightTime: "1.5",
        crossCountryTime: "1.5",
      });
    });

    it('should 400 when the flight entry id is bad', async () => {
      const response = await request(app)
        .get(`/api/v1/flight_entries/FAKE`);
      expect(response.status).toBe(400);
    });

    it('should 404 when the flight entry id is not found', async () => {
      const response = await request(app)
        .get(`/api/v1/flight_entries/${FAKE_UUID}`);
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/flight_entries/:id', () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlightEntry>>;

    beforeAll(async () => {
      cleanup = await createTestFlightEntry();
    });

    afterAll(async () => {
      await cleanup();
    });

    it('should delete a flight entry by id', async () => {
      const flightEntry = cleanup.flightEntry;

      const response = await request(app)
        .delete(`/api/v1/flight_entries/${flightEntry.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(flightEntry.id);

      const getResponse = await request(app)
        .get(`/flight_entries/${flightEntry.id}`);
      expect(getResponse.status).toBe(404);

      await cleanup();
    });

    it('should 400 when the flight entry id is bad', async () => {
      const response = await request(app)
        .delete(`/api/v1/flight_entries/FAKE`);
      expect(response.status).toBe(400);
    });

    it('should 404 when the flight entry id is not found', async () => {
      const response = await request(app)
        .delete(`/api/v1/flight_entries/${FAKE_UUID}`);
      expect(response.status).toBe(404);
    });
  });

  // AI Disclosure by Bolun Thompson:
  // I used Claude Code Sonnet 4.5 to generate this test, since it's largely repititive. Prompt as follows:
  // Add an anlogous user test. Make it short and to the point. Add a minimal test that its been stored in the DB.
  // I refactored it slightly afterwards.
  describe('POST /api/v1/user/', () => {
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
        .post('/api/v1/user/')
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
        .post('/api/v1/user/')
        .send({ name: 'Test' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/flight_entries/', () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlightEntry>>;

    beforeAll(async () => {
      cleanup = await createTestFlightEntry();
    });

    afterAll(async () => {
      await cleanup();
    });

    it('should return flight entries filtered by userId', async () => {
      const { flightEntry: { userId } } = cleanup;
      const response = await request(app)
        .get(`/api/v1/flight_entries/`)
        .query({ userId });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].userId).toBe(userId);
    });

    it('should return empty array when no flight entries match', async () => {
      const response = await request(app)
        .get(`/api/v1/flight_entries/`)
        .query({ flightId: FAKE_UUID });

      expect(response.status).toBe(201);
      expect(response.body).toEqual([]);
    });

    it('should 400 when userId is invalid', async () => {
      const response = await request(app)
        .get(`/api/v1/flight_entries/`)
        .query({ userId: 'INVALID' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/ocr/', () => {
    let cleanup: Awaited<ReturnType<typeof createTestUser>>;

    beforeAll(async () => {
      cleanup = await createTestUser();
    });

    afterAll(async () => {
      await cleanup();
    });

    it('should return an OCR result when passed a buffer', async () => {
      const response = await request(app)
        .post('/api/v1/ocr/')
        .attach('image', Buffer.from('fake-image-data'), 'test.png');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        tailNumber: expect.any(String),
        aircraftModel: expect.any(String),
      });
    });

  });

  describe('POST /api/v1/verify/', () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlight>>;

    beforeAll(async () => {
      cleanup = await createTestFlight();
    });

    afterAll(async () => {
      await cleanup();
    });

    it('should return a flight when it matches', async () => {
      const { flight } = cleanup;
      const response = await request(app)
        .post('/api/v1/verify/')
        .send({
          // AI Disclosure by Bolun Thompson:
          // Windsurf autocomplete makes long objects for testing
          // much easier to write
          tailNumber: flight.tailNumber,
          aircraftModel: flight.aircraftModel,
          manufacturer: flight.manufacturer,
          originAirportIcao: flight.originAirportIcao,
          destinationAirportIcao: flight.destinationAirportIcao,
          departureTime: flight.departureTime.toISOString(),
          arrivalTime: flight.arrivalTime.toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(flight.id);
    });

    it('should return null when flight not found', async () => {
      const response = await request(app)
        .post('/api/v1/verify/')
        .send({
          tailNumber: 'N00000',
       });

      expect(response.body).toBeNull();
      expect(response.status).toBe(200);
    });

    it('should return a flight when sent an empty object', async () => {
      const response = await request(app)
        .post('/api/v1/verify/')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).not.toBeNull();
    });

  });
});
