const Decimal = require("decimal.js");

const CYLINDER_MAX_KG = new Decimal("14.2");
const MAX_GAS_PAYOUT = new Decimal("950");

function toMoneyNumber(decimalValue) {
  return Number(decimalValue.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString());
}

function calculateFinalGasPayout(actualGasKg) {
  const actual = new Decimal(String(actualGasKg));

  if (actual.isNegative()) {
    throw new Error("actual_gas_kg cannot be negative");
  }

  const isOverweight = actual.greaterThan(CYLINDER_MAX_KG);
  const cappedKg = Decimal.min(actual, CYLINDER_MAX_KG);
  const payout = cappedKg.div(CYLINDER_MAX_KG).times(MAX_GAS_PAYOUT);

  return {
    isOverweight,
    cappedKg: Number(cappedKg.toString()),
    finalGasPayout: toMoneyNumber(payout),
  };
}

module.exports = {
  CYLINDER_MAX_KG,
  MAX_GAS_PAYOUT,
  calculateFinalGasPayout,
};
