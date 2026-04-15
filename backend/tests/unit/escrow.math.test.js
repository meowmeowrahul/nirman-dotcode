const { calculateFinalGasPayout } = require("../../src/services/escrowFinanceService");

describe("Escrow Unit - Math Accuracy", () => {
  test("Actual_Gas_KG = 7.1 yields exact final_gas_payout 475", () => {
    const result = calculateFinalGasPayout(7.1);

    expect(result.isOverweight).toBe(false);
    expect(result.finalGasPayout).toBe(475);
  });
});
