const request = require("supertest");
const User = require("../../src/models/User");
const app = require("../../src/app");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Ripple Integration - Urgency Bypass", () => {
  beforeAll(async () => {
    await setupTestDb();
    await User.syncIndexes();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(async () => {
    await clearDb();
    jest.restoreAllMocks();
  });

  test("urgency_score 9 skips 500m and finds ~1500m contributor in first DB call", async () => {
    await User.create({
      role: "CONTRIBUTOR",
      phone: "+910000000010",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV900010" },
      location: { type: "Point", coordinates: [0, 0.0134747] },
    });

    const aggregateSpy = jest.spyOn(User, "aggregate");

    const response = await request(app).post("/api/search/ripple").send({
      lat: 0,
      lng: 0,
      urgency_score: 9,
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].phone).toBe("+910000000010");

    expect(aggregateSpy).toHaveBeenCalledTimes(1);
    const firstPipeline = aggregateSpy.mock.calls[0][0];
    expect(firstPipeline[0].$geoNear.maxDistance).toBe(2000);
  });
});
