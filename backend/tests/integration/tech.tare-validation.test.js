const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Transaction = require("../../src/models/Transaction");
const { signToken } = require("../../src/controllers/authController");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Technician Unit-Style API Test - Tare Validation", () => {
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

  test("rejects negative Actual_Gas when physical_weight < tare_weight", async () => {
    const tx = await Transaction.create({
      beneficiary_id: new mongoose.Types.ObjectId(),
      region_id: "R-DEL-01",
      status: "PAID_IN_ESCROW",
      escrow: {
        gas_value_deposited: 950,
        metal_security_deposit: 2000,
        service_fee: 150,
      },
    });

    const token = signToken({
      _id: new mongoose.Types.ObjectId(),
      role: "TECHNICIAN",
      region_id: "R-DEL-01",
    });

    const response = await request(app)
      .patch(`/api/tech/verify/${tx._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        serial_number: "HPCL-001-XYZ",
        physical_weight: 20.0,
        tare_weight: 25.0,
        safety_passed: true,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/tare_weight|actual gas/i);
  });
});
