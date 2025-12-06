import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import { createTestFlight } from "../fixtures/factories";

describe("Verification Endpoints", () => {
  describe("POST /api/v1/verify/", () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlight>>;

    beforeEach(async () => {
      cleanup = await createTestFlight();
    });

    afterEach(async () => {
      await cleanup();
    });

    it("should return a flight when it matches", async () => {
      const { flight } = cleanup;
      const response = await request(app).post("/api/v1/verify/").send({
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

    it("should return null when flight not found", async () => {
      const response = await request(app).post("/api/v1/verify/").send({
        tailNumber: "N00000",
      });

      expect(response.body).toBeNull();
      expect(response.status).toBe(200);
    });

    it("should return a flight when sent an empty object", async () => {
      const response = await request(app).post("/api/v1/verify/").send({});

      expect(response.status).toBe(200);
      expect(response.body).not.toBeNull();
    });
  });
});
