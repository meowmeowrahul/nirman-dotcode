const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Transaction = require("../../src/models/Transaction");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Ripple Integration - Busy Contributor Exclusion", () => {
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

  test("excludes contributor with active lending transaction", async () => {
    const beneficiary = await User.create({
      role: "BENEFICIARY",
      phone: "+910000000500",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV500001" },
      location: { type: "Point", coordinates: [73.1622, 18.9318] },
    });

    const busyContributor = await User.create({
      role: "CONTRIBUTOR",
      phone: "+910000000501",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV500002" },
      contributor_listing: { status: "LISTED" },
      location: { type: "Point", coordinates: [73.1623, 18.9319] },
    });

    await Transaction.create({
      beneficiary_id: beneficiary._id,
      contributor_id: busyContributor._id,
      status: "VERIFIED",
      escrow: {
        gas_value_deposited: 950,
        metal_security_deposit: 2000,
        service_fee: 150,
      },
    });

    const response = await request(app).post("/api/search/ripple").send({
      lat: 18.9318,
      lng: 73.1622,
      urgency_score: 5,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
