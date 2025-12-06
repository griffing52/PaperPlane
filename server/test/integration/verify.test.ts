import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import { prisma } from "../../src/config";
import { createTestFlight, createTestFlightEntry } from "../fixtures/factories";


describe("Verification Endpoints", () => {
  describe("POST /api/v1/verify/", () => {
    let flightCleanup: Awaited<ReturnType<typeof createTestFlight>>;
    let flightEntryCleanup: Awaited<ReturnType<typeof createTestFlightEntry>>;

    beforeEach(async () => {
      flightCleanup = await createTestFlight();
      flightEntryCleanup = await createTestFlightEntry();
    });

    afterEach(async () => {
      await flightCleanup();
      await flightEntryCleanup();
    });

    it("should return a flight when it matches and associate with with the flight entry", async () => {
      const { flight } = flightCleanup;
      const { flightEntry } = flightEntryCleanup;

      // to make sure the setup code gives us the sme src and dest
      expect(flight.originAirportIcao).toBe(flightEntry.srcIcao);
      expect(flight.destinationAirportIcao).toBe(flightEntry.destIcao);

      const response = await request(app).post("/api/v1/verify/").send({
        id: flightEntry.id,
        originAirportIcao: flightEntry.srcIcao,
        destinationAirportIcao: flightEntry.destIcao,
      });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(flight.id);
      const updatedEntry = await prisma.flightEntry.findUnique({
        where: { id: flightEntry.id },
      });
      expect(updatedEntry?.flightId).toBe(flight.id);

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
