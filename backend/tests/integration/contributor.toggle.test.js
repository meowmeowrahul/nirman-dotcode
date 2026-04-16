const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const { signToken } = require("../../src/controllers/authController");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Contributor Listing Toggle", () => {
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

  test("persists toggle_enabled as true/false", async () => {
    const user = await User.create({
      role: "BENEFICIARY",
      phone: "+910000000120",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV900120" },
      city: "Mumbai",
      region_id: "Mumbai",
    });

    const token = signToken(user);

    const enableResponse = await request(app)
      .patch("/api/contributor/list/toggle")
      .set("Authorization", `Bearer ${token}`)
      .send({ enabled: true, city: "Mumbai" });

    expect(enableResponse.status).toBe(200);
    expect(enableResponse.body.listing.toggle_enabled).toBe(true);
    expect(enableResponse.body.listing.status).toBe("LISTED");

    const disableResponse = await request(app)
      .patch("/api/contributor/list/toggle")
      .set("Authorization", `Bearer ${token}`)
      .send({ enabled: false });

    expect(disableResponse.status).toBe(200);
    expect(disableResponse.body.listing.toggle_enabled).toBe(false);
    expect(disableResponse.body.listing.status).toBe("UNLISTED");

    const refreshed = await User.findById(user._id).lean();
    expect(refreshed.contributor_listing.toggle_enabled).toBe(false);
    expect(refreshed.contributor_listing.status).toBe("UNLISTED");
  });
});
