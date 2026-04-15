const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const { calculateFinalGasPayout } = require("../services/escrowFinanceService");

const ACTIVE_HOLDING_STATUSES = ["PAID_IN_ESCROW", "VERIFIED", "IN_TRANSIT"];

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function lockEscrow(req, res, next) {
  try {
    const { beneficiary_id, contributor_id, region_id } = req.body;

    if (!beneficiary_id || !validateObjectId(beneficiary_id)) {
      return res.status(400).json({ error: "valid beneficiary_id is required" });
    }

    if (contributor_id && !validateObjectId(contributor_id)) {
      return res.status(400).json({ error: "contributor_id must be a valid ObjectId" });
    }

    const existingActive = await Transaction.findOne({
      beneficiary_id,
      status: { $in: ACTIVE_HOLDING_STATUSES },
    });

    if (existingActive) {
      return res.status(409).json({ error: "active transaction already holds metal security deposit" });
    }

    const tx = await Transaction.create({
      beneficiary_id,
      contributor_id: contributor_id || null,
      region_id: region_id || null,
      status: "PAID_IN_ESCROW",
      escrow: {
        gas_value_deposited: 950.0,
        metal_security_deposit: 2000.0,
        service_fee: 150.0,
      },
    });

    return res.status(201).json({ transaction: tx });
  } catch (error) {
    return next(error);
  }
}

async function calculateEscrow(req, res, next) {
  try {
    const { transaction_id, actual_gas_kg } = req.body;

    if (!transaction_id || !validateObjectId(transaction_id)) {
      return res.status(400).json({ error: "valid transaction_id is required" });
    }

    if (actual_gas_kg === undefined || actual_gas_kg === null) {
      return res.status(400).json({ error: "actual_gas_kg is required" });
    }

    const tx = await Transaction.findById(transaction_id);
    if (!tx) {
      return res.status(404).json({ error: "transaction not found" });
    }

    if (tx.status !== "PAID_IN_ESCROW") {
      return res.status(400).json({ error: "invalid state transition: calculation requires PAID_IN_ESCROW" });
    }

    const { isOverweight, finalGasPayout } = calculateFinalGasPayout(actual_gas_kg);

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

    return res.status(200).json({
      transaction: tx,
    });
  } catch (error) {
    return next(error);
  }
}

async function releaseEscrow(req, res, next) {
  try {
    const { transaction_id, serial_number } = req.body;

    if (!transaction_id || !validateObjectId(transaction_id)) {
      return res.status(400).json({ error: "valid transaction_id is required" });
    }

    const tx = await Transaction.findById(transaction_id);
    if (!tx) {
      return res.status(404).json({ error: "transaction not found" });
    }

    if (!["VERIFIED", "IN_TRANSIT", "COMPLETED"].includes(tx.status)) {
      return res.status(400).json({ error: "invalid state transition: release requires VERIFIED, IN_TRANSIT or COMPLETED" });
    }

    const expectedSerial = tx.cylinder_evidence && tx.cylinder_evidence.serial_number;
    if (expectedSerial !== null && expectedSerial !== undefined) {
      if (typeof serial_number !== "string" || serial_number !== expectedSerial) {
        return res.status(409).json({ error: "serial number mismatch" });
      }
    }

    tx.status = "COMPLETED";
    if (tx.escrow.refund_to_beneficiary === null || tx.escrow.refund_to_beneficiary === undefined) {
      tx.escrow.refund_to_beneficiary = tx.escrow.metal_security_deposit;
    }

    if (tx.escrow.final_gas_payout === null || tx.escrow.final_gas_payout === undefined) {
      tx.escrow.final_gas_payout = Number(
        (tx.escrow.gas_value_deposited - tx.escrow.service_fee).toFixed(2)
      );
    }

    await tx.save();

    return res.status(200).json({ transaction: tx });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  lockEscrow,
  calculateEscrow,
  releaseEscrow,
};
