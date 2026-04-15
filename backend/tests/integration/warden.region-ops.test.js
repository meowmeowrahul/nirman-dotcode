const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const KycForm = require("../../src/models/KycForm");
const Complaint = require("../../src/models/Complaint");
const { signToken } = require("../../src/controllers/authController");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Warden Region Operations APIs", () => {
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

  test("GET /users/kyc-form/pending returns pending KYC queue", async () => {
    const citizen = await User.create({
      role: "BENEFICIARY",
      name: "Rahul",
      phone: "+910000001001",
      password: "hashed-password-placeholder",
      kyc: { status: "PENDING", omc_id: "SV300101" },
      region_id: "MH-PUN-014",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    const warden = await User.create({
      role: "WARDEN",
      name: "Warden Queue",
      phone: "+910000001002",
      password: "hashed-password-placeholder",
      region_id: "MH-PUN-014",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    await KycForm.create({
      user_id: citizen._id,
      aadhar_doc_photo: { url: "https://cdn.securelpg.test/docs/aadhar-pending.jpg" },
      pan_doc_photo: { url: "https://cdn.securelpg.test/docs/pan-pending.jpg" },
      verification_selfie: { url: "https://cdn.securelpg.test/docs/selfie-pending.jpg" },
      submitted_at: new Date("2026-04-16T10:00:00.000Z"),
    });

    const token = signToken({
      _id: warden._id,
      role: "WARDEN",
      region_id: "MH-PUN-014",
      name: "Warden Queue",
    });

    const response = await request(app)
      .get("/api/users/kyc-form/pending?region_id=MH-PUN-014")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].user_id).toBe(String(citizen._id));
    expect(response.body.items[0].name).toBe("Rahul");
    expect(response.body.items[0].kyc_status).toBe("PENDING");
  });

  test("GET /technicians/availability returns technicians in region", async () => {
    const warden = await User.create({
      role: "WARDEN",
      name: "Warden Tech",
      phone: "+910000001011",
      password: "hashed-password-placeholder",
      region_id: "MH-PUN-014",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    await User.create({
      role: "TECHNICIAN",
      name: "Tech Alpha",
      phone: "+910000001012",
      password: "hashed-password-placeholder",
      region_id: "MH-PUN-014",
      technician_availability: { rating: 4.8, status: "AVAILABLE" },
      location: { type: "Point", coordinates: [73.8667, 18.5304] },
    });

    await User.create({
      role: "TECHNICIAN",
      name: "Tech Beta",
      phone: "+910000001013",
      password: "hashed-password-placeholder",
      region_id: "MH-MUM-001",
      technician_availability: { rating: 4.5, status: "BUSY" },
      location: { type: "Point", coordinates: [72.8777, 19.076] },
    });

    const token = signToken({
      _id: warden._id,
      role: "WARDEN",
      region_id: "MH-PUN-014",
      name: "Warden Tech",
    });

    const response = await request(app)
      .get("/api/technicians/availability?region_id=MH-PUN-014")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.technicians)).toBe(true);
    expect(response.body.technicians).toHaveLength(1);
    expect(response.body.technicians[0].name).toBe("Tech Alpha");
    expect(response.body.technicians[0].rating).toBe(4.8);
    expect(response.body.technicians[0].status).toBe("AVAILABLE");
    expect(response.body.technicians[0].region_id).toBe("MH-PUN-014");
  });

  test("GET /complaints and PATCH /complaints/:id/status work as expected", async () => {
    const warden = await User.create({
      role: "WARDEN",
      name: "Warden Complaints",
      phone: "+910000001021",
      password: "hashed-password-placeholder",
      region_id: "MH-PUN-014",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    const reporter = await User.create({
      role: "BENEFICIARY",
      name: "Reporter",
      phone: "+910000001022",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV300122" },
      region_id: "MH-PUN-014",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    const accused = await User.create({
      role: "CONTRIBUTOR",
      name: "Accused",
      phone: "+910000001023",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV300123" },
      region_id: "MH-PUN-014",
      location: { type: "Point", coordinates: [73.8667, 18.5304] },
    });

    const complaint = await Complaint.create({
      reporter_user_id: reporter._id,
      accused_user_id: accused._id,
      region_id: "MH-PUN-014",
      category: "OVERPRICING",
      description: "Charged above approved emergency rate.",
      status: "OPEN",
    });

    const token = signToken({
      _id: warden._id,
      role: "WARDEN",
      region_id: "MH-PUN-014",
      name: "Warden Complaints",
    });

    const listResponse = await request(app)
      .get("/api/complaints?region_id=MH-PUN-014&status=OPEN")
      .set("Authorization", `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.complaints)).toBe(true);
    expect(listResponse.body.complaints).toHaveLength(1);
    expect(listResponse.body.complaints[0].id).toBe(String(complaint._id));
    expect(listResponse.body.complaints[0].category).toBe("OVERPRICING");
    expect(listResponse.body.complaints[0].status).toBe("OPEN");

    const patchResponse = await request(app)
      .patch(`/api/complaints/${complaint._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "UNDER_REVIEW" });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.complaint.id).toBe(String(complaint._id));
    expect(patchResponse.body.complaint.status).toBe("UNDER_REVIEW");
  });
});
