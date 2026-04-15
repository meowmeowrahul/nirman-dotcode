const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/User");
const KycForm = require("../../src/models/KycForm");
const { signToken } = require("../../src/controllers/authController");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("KYC Form Integration", () => {
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

  test("citizen can submit KYC form and warden can view it", async () => {
    const citizen = await User.create({
      role: "BENEFICIARY",
      name: "Citizen One",
      email: "citizen1@example.com",
      password: "hashed-password-placeholder",
      kyc: { status: "VERIFIED", omc_id: "SV200101" },
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    const warden = await User.create({
      role: "WARDEN",
      name: "Warden One",
      email: "warden1@example.com",
      password: "hashed-password-placeholder",
      region_id: "R-PUNE-1",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    const citizenToken = signToken({
      _id: citizen._id,
      role: "BENEFICIARY",
      region_id: null,
      name: "Citizen One",
    });

    const submitResponse = await request(app)
      .post("/api/users/kyc-form")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({
        aadhar_doc_photo: {
          url: "https://cdn.securelpg.test/docs/aadhar-1.jpg",
          mime_type: "image/jpeg",
        },
        pan_doc_photo: {
          url: "https://cdn.securelpg.test/docs/pan-1.jpg",
          mime_type: "image/jpeg",
        },
        verification_selfie: {
          url: "https://cdn.securelpg.test/docs/selfie-1.jpg",
          mime_type: "image/jpeg",
        },
      });

    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.kyc_form.user_id).toBe(String(citizen._id));

    const savedForm = await KycForm.findOne({ user_id: citizen._id }).lean();
    expect(savedForm).toBeTruthy();
    expect(savedForm.aadhar_doc_photo.url).toBe("https://cdn.securelpg.test/docs/aadhar-1.jpg");

    const updatedCitizen = await User.findById(citizen._id).lean();
    expect(updatedCitizen.kyc.status).toBe("PENDING");

    const wardenToken = signToken({
      _id: warden._id,
      role: "WARDEN",
      region_id: "R-PUNE-1",
      name: "Warden One",
    });

    const reviewResponse = await request(app)
      .get(`/api/users/kyc-form/${citizen._id}`)
      .set("Authorization", `Bearer ${wardenToken}`);

    expect(reviewResponse.status).toBe(200);
    expect(reviewResponse.body.kyc_form.user.id).toBe(String(citizen._id));
    expect(reviewResponse.body.kyc_form.aadhar_doc_photo.url).toBe(
      "https://cdn.securelpg.test/docs/aadhar-1.jpg"
    );
    expect(reviewResponse.body.kyc_form.pan_doc_photo.url).toBe(
      "https://cdn.securelpg.test/docs/pan-1.jpg"
    );
    expect(reviewResponse.body.kyc_form.verification_selfie.url).toBe(
      "https://cdn.securelpg.test/docs/selfie-1.jpg"
    );
  });

  test("non-warden cannot view another user's KYC form", async () => {
    const citizen = await User.create({
      role: "BENEFICIARY",
      name: "Citizen Two",
      email: "citizen2@example.com",
      password: "hashed-password-placeholder",
      kyc: { status: "PENDING", omc_id: "SV200102" },
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    const anotherCitizen = await User.create({
      role: "BENEFICIARY",
      name: "Citizen Three",
      email: "citizen3@example.com",
      password: "hashed-password-placeholder",
      kyc: { status: "PENDING", omc_id: "SV200103" },
      location: { type: "Point", coordinates: [73.8667, 18.5304] },
    });

    await KycForm.create({
      user_id: citizen._id,
      aadhar_doc_photo: { url: "https://cdn.securelpg.test/docs/aadhar-2.jpg" },
      pan_doc_photo: { url: "https://cdn.securelpg.test/docs/pan-2.jpg" },
      verification_selfie: { url: "https://cdn.securelpg.test/docs/selfie-2.jpg" },
    });

    const token = signToken({
      _id: anotherCitizen._id,
      role: "BENEFICIARY",
      region_id: null,
      name: "Citizen Three",
    });

    const response = await request(app)
      .get(`/api/users/kyc-form/${citizen._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "forbidden" });
  });
});
