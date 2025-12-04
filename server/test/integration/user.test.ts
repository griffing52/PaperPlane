import { describe, it, expect, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import { prisma } from "../../src/config";
import * as auth from "../../src/middleware/auth";

// AI Disclosure by Bolun Thompson:
// I used Claude Code Sonnet 4.5 to generate this test, since it's largely repititive. Prompt as follows:
// Add an anlogous user test. Make it short and to the point. Add a minimal test that its been stored in the DB.
// I refactored it slightly afterwards.
describe("POST /api/v1/user/", () => {
  let createdUserId: string;
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
      name: "Test User"
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
      .send();

    expect(response.status).toBe(400);
  });
});

