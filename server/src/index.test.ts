import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "./index";
import {
  createTestFlightEntry,
  createTestFlightEntryForMichaelSmith,
  createTestUser,
  createTestFlight,
  getOrCreateMichaelSmithUser,
} from "./test-factories";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FAKE_UUID = "10000000-1000-4000-8000-100000000000";
const TEST_LICENSE_NUMBER = "12345";

// NOTE: All the tests that require authentication use the Michael Smith user
// When we implement auth correctly, we should add some setup that stubs in 
// Michael Smith's user object and emailHash.

describe("API Endpoints", () => {
  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/v1/health");
      expect(response.status).toBe(200);
    });
  });

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
          .catch(() => {});
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

  // AI Disclosure by Bolun Thompson:
  // I used Claude Code Sonnet 4.5 to generate this test, since it's largely repititive. Prompt as follows:
  // Add an anlogous user test. Make it short and to the point. Add a minimal test that its been stored in the DB.
  // I refactored it slightly afterwards.
  describe("POST /api/v1/user/", () => {
    let createdUserId: string;
    beforeEach(async () => {
      // cleanup if other tests forgot to
      await prisma.user.deleteMany({
        where: { licenseNumber: TEST_LICENSE_NUMBER },
      });
    });

    afterEach(async () => {
      await prisma.user
        .delete({ where: { id: createdUserId } })
        .catch(() => {});
    });

    it("should create a user and store in DB", async () => {
      const email = `test-${Date.now()}@example.com`;
      const emailHash = "123";
      const user = {
        name: "Test",
        email,
        emailHash,
        licenseNumber: TEST_LICENSE_NUMBER,
      };

      const response = await request(app).post("/api/v1/user/").send(user);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(user);
      createdUserId = response.body.id;

      const dbUser = await prisma.user.findUnique({
        where: { id: response.body.id },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(email);
    });

    it("should 400 when body is invalid", async () => {
      const response = await request(app)
        .post("/api/v1/user/")
        .send({ name: "Test" });

      expect(response.status).toBe(400);
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

  describe("POST /api/v1/ocr/", () => {
    let cleanup: Awaited<ReturnType<typeof createTestUser>>;

    beforeEach(async () => {
      cleanup = await createTestUser();
    });

    afterEach(async () => {
      await cleanup();
    });

    it("should return an OCR result when passed a buffer", async () => {
      const response = await request(app)
        .post("/api/v1/ocr/")
        .attach("image", Buffer.from("fake-image-data"), "test.png");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        tailNumber: expect.any(String),
        aircraftModel: expect.any(String),
      });
    });
  });

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
