const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const Transaction = require("../../src/models/Transaction");
const { signToken } = require("../../src/controllers/authController");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("User Transactions Endpoint", () => {
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

  test("returns transactions where user is beneficiary, contributor, or technician", async () => {
    const beneficiary = await User.create({
      role: "BENEFICIARY",
      phone: "+910000000111",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV100111" },
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    const contributor = await User.create({
      role: "CONTRIBUTOR",
      phone: "+910000000112",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV100112" },
      location: { type: "Point", coordinates: [73.8667, 18.5304] },
    });

    const technician = await User.create({
      role: "TECHNICIAN",
      phone: "+910000000113",
      password: "hashed-password-placeholder",
      region_id: "R-PUNE-1",
      location: { type: "Point", coordinates: [73.8767, 18.5404] },
    });

    const outsider = await User.create({
      role: "BENEFICIARY",
      phone: "+910000000114",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV100114" },
      location: { type: "Point", coordinates: [73.8967, 18.5604] },
    });

    await Transaction.create({
      beneficiary_id: beneficiary._id,
      contributor_id: contributor._id,
      technician_id: technician._id,
      region_id: "R-PUNE-1",
      status: "IN_TRANSIT",
      escrow: {
        gas_value_deposited: 950,
        metal_security_deposit: 2000,
        service_fee: 150,
      },
    });

    await Transaction.create({
      beneficiary_id: outsider._id,
      region_id: "R-OTHER",
      status: "PAID_IN_ESCROW",
      escrow: {
        gas_value_deposited: 950,
        metal_security_deposit: 2000,
        service_fee: 150,
      },
    });

    const token = signToken({
      _id: beneficiary._id,
      role: "BENEFICIARY",
      region_id: null,
    });

    const response = await request(app)
      .get(`/api/users/${beneficiary._id}/transactions`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.transactions)).toBe(true);
    expect(response.body.transactions).toHaveLength(1);
    expect(response.body.transactions[0].beneficiary.id).toBe(String(beneficiary._id));
    expect(response.body.transactions[0].contributor.id).toBe(String(contributor._id));
    expect(response.body.transactions[0].technician.id).toBe(String(technician._id));
  });

  test("returns 403 when another non-warden user requests someone else's transactions", async () => {
    const beneficiary = await User.create({
      role: "BENEFICIARY",
      phone: "+910000000121",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV100121" },
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    const otherUser = await User.create({
      role: "BENEFICIARY",
      phone: "+910000000122",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV100122" },
      location: { type: "Point", coordinates: [73.8667, 18.5304] },
    });

    const token = signToken({
      _id: otherUser._id,
      role: "BENEFICIARY",
      region_id: null,
    });

    const response = await request(app)
      .get(`/api/users/${beneficiary._id}/transactions`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "forbidden" });
  });
});
