import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './index';
import { createTestPilot, createTestFlight, createTestLogbookUpload } from './test-helpers/factories';

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
    });
  });
});
