import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import { createTestUser, createTestFlight } from "../fixtures/factories";
import { prisma } from "../../src/config";
import * as auth from "../../src/middleware/auth";

const FAKE_UUID = "10000000-1000-4000-8000-100000000000";
const TEST_LICENSE_NUMBER = "12345";

describe("API Endpoints", () => {
  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/v1/health");
      expect(response.status).toBe(200);
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
        .catch(() => { });
    });

    it("should create a user and store in DB", async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`;
      const uniqueHash = `hash-${Date.now()}`;
      vi.spyOn(auth, "getAuthData").mockResolvedValueOnce({
        email: uniqueEmail,
        emailHash: uniqueHash,
      });

      const user = {
        name: "Test User",
        licenseNumber: TEST_LICENSE_NUMBER,
      };

      const response = await request(app)
        .post("/api/v1/user/")
        // this checks for auth tokens, but we stub it out to always return our unique stub
        .set("Authorization", "Bearer dummy")
        .send(user);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(user.name);
      expect(response.body.licenseNumber).toBe(user.licenseNumber);
      expect(response.body.email).toBe(uniqueEmail);
      expect(response.body.emailHash).toBe(uniqueHash);

      createdUserId = response.body.id;

      const dbUser = await prisma.user.findUnique({
        where: { id: response.body.id },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.name).toBe(user.name);
    });

    it("should 400 when body is invalid", async () => {
      const response = await request(app)
        .post("/api/v1/user/")
        .send({ name: "Test" });

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
