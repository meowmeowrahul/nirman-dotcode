const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Transaction = require("../../src/models/Transaction");
const escrowFinanceService = require("../../src/services/escrowFinanceService");
const { signToken } = require("../../src/controllers/authController");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Technician Integration - Verify Pipeline", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(async () => {
    await clearDb();
    jest.restoreAllMocks();
  });

  test("verify computes Actual_Gas and forwards to escrow finance service", async () => {
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

    const calculateSpy = jest.spyOn(escrowFinanceService, "calculateFinalGasPayout");

    const response = await request(app)
      .patch(`/api/tech/verify/${tx._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        serial_number: "BPC-DEL-7788",
        physical_weight: 21.2,
        tare_weight: 15.0,
        safety_passed: true,
      });

    expect(response.status).toBe(200);
    expect(calculateSpy).toHaveBeenCalledTimes(1);
    expect(calculateSpy).toHaveBeenCalledWith(6.2);
    expect(response.body.transaction.status).toBe("VERIFIED");
    expect(response.body.transaction.cylinder_evidence.actual_gas_kg).toBe(6.2);
  });
});
