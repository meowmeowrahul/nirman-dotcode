const User = require("../../src/models/User");
const { runPhase } = require("../../src/services/rippleSearchService");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Ripple Unit - Radius Logic", () => {
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

  test("Phase 1 with 500m returns only the ~300m contributor", async () => {
    const base = {
      role: "CONTRIBUTOR",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV123456" },
      contributor_listing: { status: "LISTED" },
    };

    await User.create([
      {
        ...base,
        phone: "+910000000001",
        location: { type: "Point", coordinates: [0, 0.0026949] },
      },
      {
        ...base,
        phone: "+910000000002",
        location: { type: "Point", coordinates: [0, 0.0134747] },
      },
      {
        ...base,
        phone: "+910000000003",
        location: { type: "Point", coordinates: [0, 0.0538988] },
      },
    ]);

    const results = await runPhase({ lat: 0, lng: 0, maxDistanceMeters: 500 });

    expect(results).toHaveLength(1);
    expect(results[0].phone).toBe("+910000000001");
  });
});
