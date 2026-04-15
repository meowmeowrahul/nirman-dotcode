const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Ripple Edge Case - Empty Ocean Coordinates", () => {
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

  test("returns 200 with empty array when no contributors are nearby", async () => {
    const response = await request(app).post("/api/search/ripple").send({
      lat: -33.9,
      lng: -140.0,
      urgency_score: 3,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
