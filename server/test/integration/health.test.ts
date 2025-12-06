import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/index";

describe("GET /health", () => {
  it("should return health status", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
  });
});

