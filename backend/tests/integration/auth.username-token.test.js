const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const { setupTestDb, teardownTestDb, clearDb } = require("../helpers/db");

describe("Auth Integration - Name in JWT", () => {
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

  test("saves name and includes name claim after login", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send({
      role: "TECHNICIAN",
      name: "Rahul Tech",
      email: "rahul.tech@example.com",
      password: "Password#1",
      region_id: "R-PUNE-1",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.name).toBe("Rahul Tech");

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "rahul.tech@example.com",
      password: "Password#1",
    });

    expect(loginResponse.status).toBe(200);
    expect(typeof loginResponse.body.token).toBe("string");

    const payload = jwt.verify(loginResponse.body.token, "test-secret");
    expect(payload.name).toBe("Rahul Tech");
    expect(payload.role).toBe("TECHNICIAN");
  });

  test("derives name from phone when missing", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send({
      role: "WARDEN",
      phone: "+910000000310",
      password: "Password#1",
      region_id: "R-PUNE-1",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.name).toBe("+910000000310");

    const loginResponse = await request(app).post("/api/auth/login").send({
      phone: "+910000000310",
      password: "Password#1",
    });

    expect(loginResponse.status).toBe(200);
    const payload = jwt.verify(loginResponse.body.token, "test-secret");
    expect(payload.name).toBe("+910000000310");
    expect(payload.role).toBe("WARDEN");
  });

  test("maps legacy username field into name on register", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send({
      role: "TECHNICIAN",
      username: "legacy.tech",
      email: "legacy.tech@example.com",
      password: "Password#1",
      region_id: "R-PUNE-1",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.name).toBe("legacy.tech");

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "legacy.tech@example.com",
      password: "Password#1",
    });

    expect(loginResponse.status).toBe(200);
    const payload = jwt.verify(loginResponse.body.token, "test-secret");
    expect(payload.name).toBe("legacy.tech");
  });
});
