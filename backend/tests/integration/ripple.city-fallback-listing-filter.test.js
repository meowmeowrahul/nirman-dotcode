const request = require("supertest");
const User = require("../../src/models/User");
const app = require("../../src/app");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Ripple Integration - City Fallback Keeps Listing Filter", () => {
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

  test("city fallback excludes UNLISTED users with toggle disabled", async () => {
    await User.create({
      role: "BENEFICIARY",
      phone: "+910000000881",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV900881" },
      city: "Mumbai",
      region_id: "Mumbai",
      contributor_listing: { status: "UNLISTED", toggle_enabled: false },
      location: { type: "Point", coordinates: [73.1622, 18.9318] },
    });

    await User.create({
      role: "CONTRIBUTOR",
      phone: "+910000000882",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV900882" },
      city: "Mumbai",
      region_id: "Mumbai",
      contributor_listing: { status: "LISTED", toggle_enabled: true },
      location: { type: "Point", coordinates: [73.1622, 18.9318] },
    });

    const response = await request(app).post("/api/search/ripple").send({
      lat: -33.9,
      lng: -140.0,
      urgency_score: 3,
      city: "Mumbai",
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.map((row) => row.phone)).toContain("+910000000882");
    expect(response.body.map((row) => row.phone)).not.toContain(
      "+910000000881",
    );
  });
});
