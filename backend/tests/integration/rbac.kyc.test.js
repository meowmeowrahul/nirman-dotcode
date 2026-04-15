const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../src/app");
const User = require("../../src/models/User");
const { signToken } = require("../../src/controllers/authController");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("RBAC Integration - Warden-only KYC update", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(async () => {
    await clearDb();
  });

  test("returns 403 when BENEFICIARY token hits PATCH /api/users/kyc/:id", async () => {
    const hashed = await bcrypt.hash("Password#1", 10);

    const targetUser = await User.create({
      role: "CONTRIBUTOR",
      phone: "+919999999991",
      password: hashed,
      kyc: {
        status: "PENDING",
        omc_id: "SV000001",
        masked_aadhar: "XXXX-XXXX-1234",
      },
      location: { type: "Point", coordinates: [77.1025, 28.7041] },
    });

    const token = signToken({
      _id: "6801c8a6b9f1b7e4f5d12345",
      role: "BENEFICIARY",
      region_id: "R1",
    });

    const response = await request(app)
      .patch(`/api/users/kyc/${targetUser._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "VERIFIED" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "forbidden" });
  });
});
