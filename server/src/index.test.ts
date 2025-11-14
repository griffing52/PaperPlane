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
