const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Transaction = require("../../src/models/Transaction");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Escrow Integration - State Machine", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(async () => {
    await clearDb();
  });

  test("release on PAID_IN_ESCROW transaction returns 400", async () => {
    const tx = await Transaction.create({
      beneficiary_id: new mongoose.Types.ObjectId(),
      status: "PAID_IN_ESCROW",
      escrow: {
        gas_value_deposited: 950,
        metal_security_deposit: 2000,
        service_fee: 150,
      },
    });

    const response = await request(app).post("/api/escrow/release").send({
      transaction_id: String(tx._id),
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/invalid state transition/i);
  });
});
