const User = require("../models/User");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function updateKycStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["PENDING", "VERIFIED", "REJECTED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "invalid kyc status" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { "kyc.status": status } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({ user: user.toJSON() });
  } catch (error) {
    return next(error);
  }
}

async function listUserTransactions(req, res, next) {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "valid userId is required" });
    }

    const requesterId = req.user && req.user.userId ? String(req.user.userId) : null;
    const isSelfRequest = requesterId === String(userId);
    const isWarden = req.user && req.user.role === "WARDEN";

    if (!isSelfRequest && !isWarden) {
      return res.status(403).json({ error: "forbidden" });
    }

    const rows = await Transaction.find({
      $or: [
        { beneficiary_id: userId },
        { contributor_id: userId },
        { technician_id: userId },
      ],
    })
      .sort({ updatedAt: -1 })
      .populate("beneficiary_id", "role email phone")
      .populate("contributor_id", "role email phone")
      .populate("technician_id", "role email phone")
      .lean();

    const transactions = rows.map((tx) => ({
      id: String(tx._id),
      status: tx.status,
      region_id: tx.region_id || null,
      created_at: tx.createdAt,
      updated_at: tx.updatedAt,
      beneficiary: tx.beneficiary_id
        ? {
            id: String(tx.beneficiary_id._id),
            role: tx.beneficiary_id.role,
            email: tx.beneficiary_id.email || null,
            phone: tx.beneficiary_id.phone || null,
          }
        : null,
      contributor: tx.contributor_id
        ? {
            id: String(tx.contributor_id._id),
            role: tx.contributor_id.role,
            email: tx.contributor_id.email || null,
            phone: tx.contributor_id.phone || null,
          }
        : null,
      technician: tx.technician_id
        ? {
            id: String(tx.technician_id._id),
            role: tx.technician_id.role,
            email: tx.technician_id.email || null,
            phone: tx.technician_id.phone || null,
          }
        : null,
      escrow: {
        gas_value_deposited: tx.escrow.gas_value_deposited,
        service_fee: tx.escrow.service_fee,
        metal_security_deposit: tx.escrow.metal_security_deposit,
        final_gas_payout: tx.escrow.final_gas_payout,
        refund_to_beneficiary: tx.escrow.refund_to_beneficiary,
      },
      cylinder_evidence: tx.cylinder_evidence || null,
    }));

    return res.status(200).json({ transactions });
  } catch (error) {
    return next(error);
  }
}

module.exports = { updateKycStatus, listUserTransactions };
