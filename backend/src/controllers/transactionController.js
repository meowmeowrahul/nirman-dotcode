const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function mapDeliveryState(status) {
  if (status === "COMPLETED") {
    return "COMPLETED";
  }
  if (status === "IN_TRANSIT") {
    return "IN_TRANSIT";
  }
  return "REQUESTED";
}

async function getSummary(req, res, next) {
  try {
    const { transactionId } = req.params;
    if (!validateObjectId(transactionId)) {
      return res.status(400).json({ error: "valid transactionId is required" });
    }

    const tx = await Transaction.findById(transactionId).populate(
      "technician_id",
      "email phone city region_id"
    );

    if (!tx) {
      return res.status(404).json({ error: "transaction not found" });
    }

    const technician = tx.technician_id
      ? {
          id: String(tx.technician_id._id),
          name: tx.technician_id.email || tx.technician_id.phone || "Assigned Technician",
          phone: tx.technician_id.phone || "N/A",
          etaMinutes: 10,
        }
      : {
          id: "unassigned-tech",
          name: "Assigned Technician",
          phone: "N/A",
          etaMinutes: 10,
        };

    return res.status(200).json({
      transaction: {
        id: String(tx._id),
        deliveryState: mapDeliveryState(tx.status),
        supplierCitizenId: String(tx.beneficiary_id),
        requestingCitizenId: String(tx.beneficiary_id),
        technician,
        gasBufferAmount: tx.escrow.gas_value_deposited,
        serviceFeeAmount: tx.escrow.service_fee,
        metalDepositAmount: tx.escrow.metal_security_deposit,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function acknowledgeReturn(req, res, next) {
  try {
    const { transactionId } = req.params;
    if (!validateObjectId(transactionId)) {
      return res.status(400).json({ error: "valid transactionId is required" });
    }

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ error: "transaction not found" });
    }

    if (!["VERIFIED", "IN_TRANSIT", "COMPLETED"].includes(tx.status)) {
      return res.status(400).json({ error: "invalid state transition: acknowledge requires VERIFIED, IN_TRANSIT or COMPLETED" });
    }

    tx.status = "COMPLETED";
    tx.escrow.refund_to_beneficiary = tx.escrow.metal_security_deposit;

    if (tx.escrow.final_gas_payout === null || tx.escrow.final_gas_payout === undefined) {
      tx.escrow.final_gas_payout = Number(
        (tx.escrow.gas_value_deposited - tx.escrow.service_fee).toFixed(2)
      );
    }

    await tx.save();

    return res.status(200).json({
      success: true,
      requesterRefundAmount: tx.escrow.refund_to_beneficiary,
      supplierGasPayoutAmount: tx.escrow.final_gas_payout,
      transaction: tx,
    });
  } catch (error) {
    return next(error);
  }
}

async function acknowledgeContributorLock(req, res, next) {
  try {
    const { transactionId } = req.params;
    if (!validateObjectId(transactionId)) {
      return res.status(400).json({ error: "valid transactionId is required" });
    }

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ error: "transaction not found" });
    }

    if (!tx.contributor_id || String(tx.contributor_id) !== String(req.user.userId)) {
      return res.status(403).json({ error: "forbidden" });
    }

    tx.contributor_acknowledgement = {
      ...(tx.contributor_acknowledgement || {}),
      status: "ACKNOWLEDGED",
      acknowledged_at: new Date(),
    };

    await tx.save();

    return res.status(200).json({
      success: true,
      transaction_id: String(tx._id),
      contributor_acknowledgement: tx.contributor_acknowledgement,
    });
  } catch (error) {
    return next(error);
  }
}

async function listRegionalActivity(req, res, next) {
  try {
    const city = req.user.city || req.user.region_id;
    if (!city) {
      return res.status(400).json({ error: "missing city in token" });
    }

    const rows = await Transaction.find({
      $or: [{ city }, { region_id: city }],
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate("technician_id", "email phone")
      .lean();

    const activity = rows.map((tx, index) => {
      const manualWeight = Number(tx.cylinder_evidence?.actual_gas_kg ?? 0);
      const ocrWeight =
        index === 0 && manualWeight > 0
          ? Number((manualWeight - 0.3).toFixed(3))
          : manualWeight > 0
          ? Number((manualWeight - 0.05).toFixed(3))
          : 0;

      return {
        id: String(tx._id),
        city: tx.city || tx.region_id || "N/A",
        region: tx.city || tx.region_id || "N/A",
        technicianName:
          tx.technician_id?.email || tx.technician_id?.phone || "Unassigned",
        manualWeightKg: manualWeight,
        ocrWeightKg: ocrWeight,
        status: tx.status,
      };
    });

    return res.status(200).json({ activity });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSummary,
  acknowledgeReturn,
  acknowledgeContributorLock,
  listRegionalActivity,
};
