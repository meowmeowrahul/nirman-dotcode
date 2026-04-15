const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Transaction = require("../../src/models/Transaction");
const { signToken } = require("../../src/controllers/authController");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Live Map Endpoint", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    await setupTestDb();
    await User.syncIndexes();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(async () => {
    await clearDb();
  });

  test("returns active requests and verified contributors for request region", async () => {
    const beneficiary = await User.create({
      role: "BENEFICIARY",
      phone: "+910000000211",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV200211" },
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    await User.create({
      role: "CONTRIBUTOR",
      phone: "+910000000212",
      password: "hashed-password-placeholder",
      region_id: "R-PUNE-1",
      kyc: { status: "VERIFIED", omc_id: "SV200212" },
      location: { type: "Point", coordinates: [73.8667, 18.5304] },
    });

    await User.create({
      role: "CONTRIBUTOR",
      phone: "+910000000213",
      password: "hashed-password-placeholder",
      region_id: "R-PUNE-1",
      kyc: { status: "PENDING", omc_id: "SV200213" },
      location: { type: "Point", coordinates: [73.8767, 18.5404] },
    });

    await Transaction.create({
      beneficiary_id: beneficiary._id,
      region_id: "R-PUNE-1",
      status: "VERIFIED",
      escrow: {
        gas_value_deposited: 950,
        metal_security_deposit: 2000,
        service_fee: 150,
      },
    });

    const token = signToken({
      _id: beneficiary._id,
      role: "BENEFICIARY",
      region_id: "R-PUNE-1",
    });

    const response = await request(app)
      .get("/api/search/live-map")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.region_id).toBe("R-PUNE-1");
    expect(Array.isArray(response.body.active_requests)).toBe(true);
    expect(Array.isArray(response.body.available_contributors)).toBe(true);
    expect(response.body.active_requests).toHaveLength(1);
    expect(response.body.available_contributors).toHaveLength(1);
    expect(response.body.active_requests[0].status).toBe("VERIFIED");
  });

  test("requires auth token", async () => {
    const response = await request(app).get("/api/search/live-map");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "missing token" });
  });
});
