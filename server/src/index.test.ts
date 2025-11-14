import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './index';
import { createTestFlightLog } from './test-factories';

const FAKE_UUID = "10000000-1000-4000-8000-100000000000";

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
});
