const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Transaction = require("../../src/models/Transaction");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Escrow Edge Case - Overweight Input", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(async () => {
    await clearDb();
  });

  test("Actual_Gas_KG = 15.0 caps payout at 950 and flags an error", async () => {
    const tx = await Transaction.create({
      beneficiary_id: new mongoose.Types.ObjectId(),
      status: "PAID_IN_ESCROW",
      escrow: {
        gas_value_deposited: 950,
        metal_security_deposit: 2000,
        service_fee: 150,
      },
    });

    const response = await request(app).post("/api/escrow/calculate").send({
      transaction_id: String(tx._id),
      actual_gas_kg: 15.0,
    });

    expect(response.status).toBe(400);
    expect(response.body.flagged).toBe(true);
    expect(response.body.capped_final_gas_payout).toBe(950);

    const refreshed = await Transaction.findById(tx._id);
    expect(refreshed.escrow.final_gas_payout).toBe(950);
    expect(refreshed.status).toBe("PAID_IN_ESCROW");
  });
});
