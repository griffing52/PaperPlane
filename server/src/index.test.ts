import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './index';
import { createTestFlightLog } from './test-factories';

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
  });
});
