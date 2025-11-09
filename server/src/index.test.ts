import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './index';
import { createTestPilot, createTestFlight, createTestLogbookUpload } from './test-helpers/factories';

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        message: 'Server is running',
      });
    });
  });

  describe('POST /api/flights', () => {
    it('should return 405 Method Not Allowed', async () => {
      const pilot = await createTestPilot();

      const flightData = {
        pilotId: pilot.userId,
        departureAirfield: 'KLAX',
        tailNumber: 'N54321',
        depDate: new Date('2025-01-15T10:00:00Z').toISOString(),
        hours: 3.5,
      };

      const response = await request(app)
        .post('/api/flights')
        .send(flightData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(405);
      expect(response.body.error).toBe('Creating flights manually is not allowed. Please submit a logbook instead.');
    });

    describe('GET /api/flights/:id', () => {
      it('should return a flight by ID', async () => {
        const pilot = await createTestPilot();
        const flightEntry = await createTestFlight(pilot.userId, {
          departureAirfield: 'KSFO',
          tailNumber: 'N77777',
          hours: 4.2,
        });

        const response = await request(app).get(`/api/flights/${flightEntry.id}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(flightEntry.id);
        expect(response.body.flight).toBeDefined();
        expect(response.body.flight.tailNumber).toBe('N77777');
        expect(response.body.flight.originAirportIcao).toBe('KSFO');
        expect(response.body.pilot).toBeDefined();
      });

      it('should return 404 for non-existent flight', async () => {
        const fakeId = '123e4567-e89b-12d3-a456-426614174000';
        const response = await request(app).get(`/api/flights/${fakeId}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Flight not found');
      });

    });

    describe('GET /api/flights', () => {
      it('should return all flights', async () => {
        const pilot1 = await createTestPilot();
        const pilot2 = await createTestPilot();

        await createTestFlight(pilot1.userId);
        await createTestFlight(pilot1.userId);
        await createTestFlight(pilot2.userId);

        const response = await request(app).get('/api/flights');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
        expect(response.body[0]).toHaveProperty('pilot');
      });

      it('should filter flights by pilotId', async () => {
        const pilot1 = await createTestPilot();
        const pilot2 = await createTestPilot();

        await createTestFlight(pilot1.userId, { departureAirfield: 'KJFK' });
        await createTestFlight(pilot1.userId, { departureAirfield: 'KLAX' });
        await createTestFlight(pilot2.userId, { departureAirfield: 'KSFO' });

        const response = await request(app).get(
          `/api/flights?pilotId=${pilot1.userId}`
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(response.body[0].pilotId).toBe(pilot1.userId);
        expect(response.body[1].pilotId).toBe(pilot1.userId);
      });

    });
  });

  describe('POST /api/logbooks', () => {
    it('should create a new logbook upload with valid data', async () => {
      const pilot = await createTestPilot();

      const logbookData = {
        pilotId: pilot.userId,
        filePath: '/uploads/logbook-test.pdf',
        source: 'MANUAL',
        status: 'PENDING',
      };

      const response = await request(app)
        .post('/api/logbooks')
        .send(logbookData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        pilotId: pilot.userId,
        filePath: '/uploads/logbook-test.pdf',
        source: 'MANUAL',
        status: 'PENDING',
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body.pilot).toBeDefined();
      expect(response.body.pilot.user.email).toBe(pilot.user.email);
    });

    it('should reject invalid pilotId format', async () => {
      const logbookData = {
        pilotId: 'invalid-uuid',
        filePath: '/uploads/logbook-test.pdf',
        source: 'MANUAL',
      };

      const response = await request(app)
        .post('/api/logbooks')
        .send(logbookData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].field).toBe('pilotId');
    });

    it('should reject invalid source', async () => {
      const pilot = await createTestPilot();

      const logbookData = {
        pilotId: pilot.userId,
        filePath: '/uploads/logbook-test.pdf',
        source: 'INVALID',
      };

      const response = await request(app)
        .post('/api/logbooks')
        .send(logbookData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/logbooks')
        .send({
          pilotId: '123e4567-e89b-12d3-a456-426614174000',
          // Missing required fields
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/logbooks/:id', () => {
    it('should return a logbook by ID', async () => {
      const pilot = await createTestPilot();
      const logbook = await createTestLogbookUpload(pilot.userId, {
        filePath: '/uploads/test-logbook.pdf',
        source: 'OCR',
        status: 'DONE',
      });

      const response = await request(app).get(`/api/logbooks/${logbook.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(logbook.id);
      expect(response.body.filePath).toBe('/uploads/test-logbook.pdf');
      expect(response.body.source).toBe('OCR');
      expect(response.body.status).toBe('DONE');
      expect(response.body.pilot).toBeDefined();
    });

    it('should return 404 for non-existent logbook', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app).get(`/api/logbooks/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Logbook not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app).get('/api/logbooks/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
}
);
