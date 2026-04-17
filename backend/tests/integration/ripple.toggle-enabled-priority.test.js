const request = require("supertest");
const User = require("../../src/models/User");
const app = require("../../src/app");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Ripple Integration - Toggle Enabled Priority", () => {
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

  test("returns contributor when toggle_enabled is true even if status is stale UNLISTED", async () => {
    await User.create({
      role: "CONTRIBUTOR",
      phone: "+910000000777",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV900777" },
      contributor_listing: { status: "UNLISTED", toggle_enabled: true },
      city: "Pune",
      region_id: "Pune",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    const response = await request(app).post("/api/search/ripple").send({
      lat: 18.5204,
      lng: 73.8567,
      urgency_score: 5,
      city: "Pune",
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].phone).toBe("+910000000777");
  });
});
