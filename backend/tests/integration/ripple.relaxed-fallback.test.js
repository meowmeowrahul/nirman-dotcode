const request = require("supertest");
const User = require("../../src/models/User");
const app = require("../../src/app");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Ripple Integration - Listed Contributors Only", () => {
  beforeAll(async () => {
    await setupTestDb();
    await User.syncIndexes();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(async () => {
    await clearDb();
  });

  test("does not return nearby contributor when listing status is UNLISTED", async () => {
    await User.create({
      role: "CONTRIBUTOR",
      phone: "+910000000044",
      password: "hashed-password-placeholder",
      kyc: { status: "PENDING", omc_id: "SV900044" },
      contributor_listing: { status: "UNLISTED" },
      location: { type: "Point", coordinates: [73.1623, 18.9319] },
    });

    const response = await request(app).post("/api/search/ripple").send({
      lat: 18.9318,
      lng: 73.1622,
      urgency_score: 5,
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });
});
