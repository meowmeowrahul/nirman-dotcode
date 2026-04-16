const request = require("supertest");
const User = require("../../src/models/User");
const app = require("../../src/app");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Ripple Integration - Listed Lender Roles", () => {
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

  test("returns listed lender even when role is BENEFICIARY", async () => {
    await User.create({
      role: "BENEFICIARY",
      phone: "+910000000099",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV900099" },
      contributor_listing: { status: "LISTED", toggle_enabled: true },
      city: "Mumbai",
      region_id: "Mumbai",
      location: { type: "Point", coordinates: [72.8777, 19.076] },
    });

    const response = await request(app).post("/api/search/ripple").send({
      lat: 19.0762,
      lng: 72.878,
      urgency_score: 5,
      city: "Mumbai",
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].phone).toBe("+910000000099");
  });
});
