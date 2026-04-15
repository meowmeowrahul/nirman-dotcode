const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Transaction = require("../../src/models/Transaction");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Escrow Edge Case - Serial Mismatch On Return", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(async () => {
    await clearDb();
  });

  test("returns 409 when return serial_number does not match verified serial", async () => {
    const tx = await Transaction.create({
      beneficiary_id: new mongoose.Types.ObjectId(),
      status: "IN_TRANSIT",
      escrow: {
        gas_value_deposited: 950,
        metal_security_deposit: 2000,
        service_fee: 150,
        final_gas_payout: 600,
      },
      cylinder_evidence: {
        serial_number: "IOCL-DEL-0007",
        physical_weight: 20,
        tare_weight: 15,
        actual_gas_kg: 5,
        safety_passed: true,
      },
    });

    const response = await request(app).post("/api/escrow/release").send({
      transaction_id: String(tx._id),
      serial_number: "IOCL-DEL-9999",
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "serial number mismatch" });
  });
});
