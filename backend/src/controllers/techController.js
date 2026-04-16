const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const escrowFinanceService = require("../services/escrowFinanceService");

const MIN_TARE_KG = 14.0;
const MAX_TARE_KG = 17.0;

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function hasMatchingCity(transactionCity, technicianCity) {
  return Boolean(transactionCity) && Boolean(technicianCity) && transactionCity === technicianCity;
}

async function verifyTransaction(req, res, next) {
  try {
    const { transactionId } = req.params;
    const { beneficiary_user_id, serial_number, physical_weight, tare_weight, safety_passed } = req.body;

    if (!validateObjectId(transactionId)) {
      return res.status(400).json({ error: "valid transactionId is required" });
    }

    if (typeof serial_number !== "string" || serial_number.trim() === "") {
      return res.status(400).json({ error: "serial_number is required" });
    }

    if (beneficiary_user_id !== undefined && !validateObjectId(beneficiary_user_id)) {
      return res.status(400).json({ error: "beneficiary_user_id must be a valid ObjectId" });
    }

    if (!isFiniteNumber(physical_weight) || !isFiniteNumber(tare_weight)) {
      return res.status(400).json({ error: "physical_weight and tare_weight must be numbers" });
    }

    const physicalWeight = Number(physical_weight);
    const tareWeight = Number(tare_weight);

    if (tareWeight < MIN_TARE_KG || tareWeight > MAX_TARE_KG) {
      return res.status(400).json({ error: "tare_weight must be between 14.0kg and 17.0kg" });
    }

    if (typeof safety_passed !== "boolean") {
      return res.status(400).json({ error: "safety_passed must be boolean" });
    }

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ error: "transaction not found" });
    }

    if (
      beneficiary_user_id !== undefined &&
      String(tx.beneficiary_id) !== String(beneficiary_user_id)
    ) {
      return res.status(409).json({ error: "beneficiary_user_id does not match transaction beneficiary" });
    }

    const beneficiary = await User.findById(tx.beneficiary_id).select("city region_id").lean();
    const beneficiaryCity = beneficiary
      ? beneficiary.city || beneficiary.region_id || null
      : tx.city || tx.region_id || null;
    const technicianCity = req.user.city || req.user.region_id || null;

    if (!hasMatchingCity(beneficiaryCity, technicianCity)) {
      return res.status(403).json({ error: "forbidden: region mismatch" });
    }

    tx.city = tx.city || beneficiaryCity;
    tx.region_id = tx.region_id || beneficiaryCity;

    if (tx.status !== "PAID_IN_ESCROW") {
      return res.status(400).json({ error: "invalid state transition: verify requires PAID_IN_ESCROW" });
    }

    const actualGasKg = Number((physicalWeight - tareWeight).toFixed(3));
    if (actualGasKg <= 0) {
      return res.status(400).json({
        error:
          "invalid weights: actual_gas_kg = physical_weight - tare_weight, must be greater than 0 and not exceed 14.2kg",
      });
    }

    tx.technician_id = req.user.userId;
    tx.cylinder_evidence = {
      serial_number,
      physical_weight: physicalWeight,
      tare_weight: tareWeight,
      actual_gas_kg: actualGasKg,
      safety_passed,
    };

    if (!safety_passed) {
      tx.status = "CANCELLED";
      tx.escrow.final_gas_payout = 0;
      tx.escrow.refund_to_beneficiary = tx.escrow.gas_value_deposited + tx.escrow.metal_security_deposit;
      await tx.save();
      return res.status(200).json({
        transaction: tx,
        refunded: true,
      });
    }

    const { isOverweight, finalGasPayout } = escrowFinanceService.calculateFinalGasPayout(actualGasKg);
    tx.escrow.final_gas_payout = finalGasPayout;

    if (isOverweight) {
      await tx.save();
      return res.status(400).json({
        error: "actual_gas_kg exceeds 14.2kg capacity",
        flagged: true,
        capped_final_gas_payout: finalGasPayout,
      });
    }

    tx.status = "VERIFIED";
    await tx.save();

    return res.status(200).json({ transaction: tx });
  } catch (error) {
    return next(error);
  }
}

async function handoverTransaction(req, res, next) {
  try {
    const { transactionId } = req.params;

    if (!validateObjectId(transactionId)) {
      return res.status(400).json({ error: "valid transactionId is required" });
    }

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ error: "transaction not found" });
    }

    const technicianCity = req.user.city || req.user.region_id || null;
    if (!hasMatchingCity(tx.city || tx.region_id, technicianCity)) {
      return res.status(403).json({ error: "forbidden: region mismatch" });
    }

    if (tx.status !== "VERIFIED") {
      return res.status(400).json({ error: "invalid state transition: handover requires VERIFIED" });
    }

    tx.status = "IN_TRANSIT";
    await tx.save();
    return res.status(200).json({ transaction: tx });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  verifyTransaction,
  handoverTransaction,
};
