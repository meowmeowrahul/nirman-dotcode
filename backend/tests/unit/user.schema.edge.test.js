const User = require("../../src/models/User");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Schema Edge Case - WARDEN requires region_id", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(async () => {
    await clearDb();
  });

  test("throws validation error when region_id is missing", async () => {
    await expect(
      User.create({
        role: "WARDEN",
        email: "warden@gov.in",
        password: "hashed-password-placeholder",
        kyc: {
          status: "VERIFIED",
          masked_aadhar: "XXXX-XXXX-6789",
        },
        location: { type: "Point", coordinates: [77.2, 28.6] },
      })
    ).rejects.toThrow(/region_id/i);
  });
});
