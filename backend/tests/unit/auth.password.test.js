const bcrypt = require("bcryptjs");

describe("Auth Unit - bcrypt.compare", () => {
  test("validates correct and incorrect passwords accurately", async () => {
    const plain = "Govt@1234";
    const hash = await bcrypt.hash(plain, 10);

    const ok = await bcrypt.compare("Govt@1234", hash);
    const bad = await bcrypt.compare("Wrong@1234", hash);

    expect(ok).toBe(true);
    expect(bad).toBe(false);
  });
});
