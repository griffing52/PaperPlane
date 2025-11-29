import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../index";
import {
  createTestFlightEntry,
  createTestFlightEntryForMichaelSmith,
  getOrCreateMichaelSmithUser,
} from "../fixtures/factories";
import { prisma } from "../../config";

const FAKE_UUID = "10000000-1000-4000-8000-100000000000";

// NOTE: All the tests that require authentication use the Michael Smith user
// When we implement auth correctly, we should add some setup that stubs in 
// Michael Smith's user object and emailHash.

describe("API Endpoints", () => {
  describe("GET /api/v1/flight_entry/:id", () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlightEntryForMichaelSmith>>;

    beforeEach(async () => {
      cleanup = await createTestFlightEntryForMichaelSmith();
    });

    afterEach(async () => {
      await cleanup();
    });

    it("should return a flight entry by id for Michael Smith user", async () => {
      const testFlightEntry = cleanup.flightEntry;
      const response = await request(app).get(
        `/api/v1/flight_entry/${testFlightEntry.id}`,
      );

      expect(response.status).toBe(200);
      // NOTE: Everything must be a string
      // since we aren't reparsing it
      expect(response.body).toMatchObject({
        id: testFlightEntry.id,
        userId: testFlightEntry.userId,
        totalFlightTime: "1.5",
        crossCountry: true,
      });
    });

    it("should 403 when accessing another user's flight entry", async () => {
      // Create a flight entry for a different user
      const otherUserCleanup = await createTestFlightEntry();
      const response = await request(app).get(
        `/api/v1/flight_entry/${otherUserCleanup.flightEntry.id}`,
      );

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Forbidden");

      await otherUserCleanup();
    });

    it("should 400 when the flight entry id is bad", async () => {
      const response = await request(app).get(`/api/v1/flight_entry/FAKE`);
      expect(response.status).toBe(400);
    });

    it("should 404 when the flight entry id is not found", async () => {
      const response = await request(app).get(
        `/api/v1/flight_entry/${FAKE_UUID}`,
      );
      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/flight_entry/:id", () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlightEntryForMichaelSmith>>;

    beforeEach(async () => {
      cleanup = await createTestFlightEntryForMichaelSmith();
    });

    afterEach(async () => {
      await cleanup();
    });

    it("should delete a flight entry by id for Michael Smith user", async () => {
      const flightEntry = cleanup.flightEntry;

      const response = await request(app).delete(
        `/api/v1/flight_entry/${flightEntry.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(flightEntry.id);

      const getResponse = await request(app).get(
        `/api/v1/flight_entry/${flightEntry.id}`,
      );
      expect(getResponse.status).toBe(404);

      await cleanup();
    });

    it("should 403 when deleting another user's flight entry", async () => {
      // Create a flight entry for a different user
      const otherUserCleanup = await createTestFlightEntry();
      const response = await request(app).delete(
        `/api/v1/flight_entry/${otherUserCleanup.flightEntry.id}`,
      );

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Forbidden");

      await otherUserCleanup();
    });

    it("should 400 when the flight entry id is bad", async () => {
      const response = await request(app).delete(`/api/v1/flight_entry/FAKE`);
      expect(response.status).toBe(400);
    });

    it("should 404 when the flight entry id is not found", async () => {
      const response = await request(app).delete(
        `/api/v1/flight_entry/${FAKE_UUID}`,
      );
      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/v1/flight_entry/", () => {
    let userCleanup: Awaited<ReturnType<typeof getOrCreateMichaelSmithUser>>;
    let createdFlightEntryId: string;

    beforeEach(async () => {
      userCleanup = await getOrCreateMichaelSmithUser();
    });

    afterEach(async () => {
      if (createdFlightEntryId) {
        await prisma.flightEntry
          .delete({ where: { id: createdFlightEntryId } })
          .catch(() => { });
      }
      await userCleanup();
    });

    it("should create a flight entry with all fields and store in DB", async () => {
      const flightEntryData = {
        logbookUrl: "https://example.com/logbook.png",
        date: new Date("2025-01-01"),
        tailNumber: "N12345",
        srcIcao: "KLAX",
        destIcao: "KSFO",
        route: "KLAX KSMO KSFO",
        totalFlightTime: 2.5,
        picTime: 2.5,
        dualReceivedTime: 0,
        crossCountry: true,
        night: false,
        solo: false,
        instrumentTime: 1.0,
        dayLandings: 2,
        nightLandings: 0,
        remarks: "Test flight",
      };

      const response = await request(app)
        .post("/api/v1/flight_entry/")
        .send(flightEntryData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        userId: userCleanup.user.id,
        logbookURL: flightEntryData.logbookUrl,
        tailNumber: flightEntryData.tailNumber,
        srcIcao: flightEntryData.srcIcao,
        destIcao: flightEntryData.destIcao,
        totalFlightTime: "2.5",
        picTime: "2.5",
        dualReceivedTime: "0",
        crossCountry: true,
        night: false,
        solo: false,
        instrumentTime: "1",
        dayLandings: 2,
        nightLandings: 0,
      });
      // for cleanup
      createdFlightEntryId = response.body.id;

      const dbFlightEntry = await prisma.flightEntry.findUnique({
        where: { id: createdFlightEntryId },
      });
      expect(dbFlightEntry).not.toBeNull();
      expect(dbFlightEntry?.userId).toBe(userCleanup.user.id);
    });

    it("should create a flight entry with only required fields", async () => {
      const flightEntryData = {
        date: new Date("2025-01-01"),
        tailNumber: "N12345",
        srcIcao: "KLAX",
        destIcao: "KSFO",
      };

      const response = await request(app)
        .post("/api/v1/flight_entry/")
        .send(flightEntryData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        userId: userCleanup.user.id,
        tailNumber: flightEntryData.tailNumber,
        srcIcao: flightEntryData.srcIcao,
        destIcao: flightEntryData.destIcao,
        totalFlightTime: "0",
        picTime: "0",
        dualReceivedTime: "0",
        crossCountry: false,
        night: false,
        solo: false,
        instrumentTime: "0",
        dayLandings: 0,
        nightLandings: 0,
      });

      createdFlightEntryId = response.body.id;
    });

    it("should 400 when required fields are missing", async () => {
      const response = await request(app)
        .post("/api/v1/flight_entry/")
        .send({ totalFlightTime: 1.5 });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/v1/flight_entry/:id", () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlightEntryForMichaelSmith>>;

    beforeEach(async () => {
      cleanup = await createTestFlightEntryForMichaelSmith();
    });

    afterEach(async () => {
      await cleanup();
    });

    it("should update multiple fields", async () => {
      const flightEntry = cleanup.flightEntry;
      const updates = {
        tailNumber: "N99999",
        totalFlightTime: 5.5,
        remarks: "Multi-field update",
      };

      const response = await request(app)
        .patch(`/api/v1/flight_entry/${flightEntry.id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.tailNumber).toBe("N99999");
      expect(response.body.totalFlightTime).toBe("5.5");
      expect(response.body.remarks).toBe("Multi-field update");
    });

    it("should 403 when updating another user's flight entry", async () => {
      const otherUserCleanup = await createTestFlightEntry();
      const updates = {
        remarks: "Trying to update someone else's entry",
      };

      const response = await request(app)
        .patch(`/api/v1/flight_entry/${otherUserCleanup.flightEntry.id}`)
        .send(updates);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Forbidden");

      await otherUserCleanup();
    });

    it("should 404 when flight entry not found", async () => {
      const response = await request(app)
        .patch(`/api/v1/flight_entry/${FAKE_UUID}`)
        .send({ remarks: "test" });

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/flight_entry/", () => {
    let cleanup: Awaited<ReturnType<typeof createTestFlightEntryForMichaelSmith>>;

    beforeEach(async () => {
      cleanup = await createTestFlightEntryForMichaelSmith();
    });

    afterEach(async () => {
      await cleanup();
    });

    it("should return flight entries for Michael Smith user", async () => {
      const {
        flightEntry: { userId },
      } = cleanup;
      const response = await request(app).get(`/api/v1/flight_entry`);

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].userId).toBe(userId);
    });

    it("should return empty array when filtering by non-existent flightId", async () => {
      const response = await request(app)
        .get(`/api/v1/flight_entry`)
        .query({ flightId: FAKE_UUID });

      expect(response.status).toBe(201);
      expect(response.body).toEqual([]);
    });

    it("should 400 when flightId is invalid", async () => {
      const response = await request(app)
        .get(`/api/v1/flight_entry`)
        .query({ flightId: "INVALID" });

      expect(response.status).toBe(400);
    });
  });
});
