const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Alert = require("../models/Alert");
const escrowFinanceService = require("../services/escrowFinanceService");
const {
  analyzeScaleImageWithGemini,
  scoreFraudRiskWithGemini,
} = require("../services/ai.service");
const {
  createNotificationsByUserFilter,
} = require("../services/notificationService");

const MIN_TARE_KG = 14.0;
const MAX_TARE_KG = 17.0;

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function hasMatchingCity(transactionCity, technicianCity) {
  return (
    Boolean(transactionCity) &&
    Boolean(technicianCity) &&
    transactionCity === technicianCity
  );
}

function decodeBase64Image(imageBase64) {
  if (typeof imageBase64 !== "string" || imageBase64.trim() === "") {
    return null;
  }

  const withoutPrefix = imageBase64.includes(",")
    ? imageBase64.split(",").pop()
    : imageBase64;

  try {
    const buffer = Buffer.from(withoutPrefix, "base64");
    return buffer.length ? buffer : null;
  } catch (_error) {
    return null;
  }
}

async function upsertAndEmitWardenAlert(req, {
  transactionId,
  riskScore,
  flags,
  source,
  reviewReason,
  context,
}) {
  const alertDoc = await Alert.findOneAndUpdate(
    {
      transaction_id: transactionId,
      alert_type: "FRAUD_GUARD",
    },
    {
      $set: {
        combined_risk_score: riskScore,
        flags,
        source,
        review_status: "OPEN",
        review_reason: reviewReason || null,
        context: context || {},
      },
      $setOnInsert: {
        transaction_id: transactionId,
        alert_type: "FRAUD_GUARD",
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  const io = req.app && req.app.get("io");
  if (io) {
    io.emit("WARDEN_ALERT", {
      alert_id: String(alertDoc._id),
      transaction_id: String(transactionId),
      combined_risk_score: alertDoc.combined_risk_score,
      flags: alertDoc.flags,
      review_status: alertDoc.review_status,
      review_reason: alertDoc.review_reason,
      source: alertDoc.source,
      created_at: alertDoc.createdAt,
      updated_at: alertDoc.updatedAt,
    });
  }

  return alertDoc;
}

async function verifyTransaction(req, res, next) {
  try {
    const { transactionId } = req.params;
    const {
      beneficiary_user_id,
      serial_number,
      physical_weight,
      tare_weight,
      safety_passed,
      scale_image_base64,
      scale_image_mime_type,
      scale_prompt,
    } = req.body;

    if (!validateObjectId(transactionId)) {
      return res.status(400).json({ error: "valid transactionId is required" });
    }

    if (typeof serial_number !== "string" || serial_number.trim() === "") {
      return res.status(400).json({ error: "serial_number is required" });
    }

    if (
      beneficiary_user_id !== undefined &&
      !validateObjectId(beneficiary_user_id)
    ) {
      return res
        .status(400)
        .json({ error: "beneficiary_user_id must be a valid ObjectId" });
    }

    if (!isFiniteNumber(physical_weight) || !isFiniteNumber(tare_weight)) {
      return res
        .status(400)
        .json({ error: "physical_weight and tare_weight must be numbers" });
    }

    const physicalWeight = Number(physical_weight);
    const tareWeight = Number(tare_weight);

    if (tareWeight < MIN_TARE_KG || tareWeight > MAX_TARE_KG) {
      return res
        .status(400)
        .json({ error: "tare_weight must be between 14.0kg and 17.0kg" });
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
      return res
        .status(409)
        .json({
          error: "beneficiary_user_id does not match transaction beneficiary",
        });
    }

    const beneficiary = await User.findById(tx.beneficiary_id)
      .select("city region_id")
      .lean();
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
      return res
        .status(400)
        .json({
          error: "invalid state transition: verify requires PAID_IN_ESCROW",
        });
    }

    const actualGasKg = Number((physicalWeight - tareWeight).toFixed(3));
    if (actualGasKg <= 0) {
      return res.status(400).json({
        error:
          "invalid weights: actual_gas_kg = physical_weight - tare_weight, must be greater than 0 and not exceed 14.2kg",
      });
    }

    tx.technician_id = req.user.userId;

    const imageBuffer = decodeBase64Image(scale_image_base64);
    let geminiResult = null;
    let geminiFailure = null;

    if (imageBuffer) {
      try {
        geminiResult = await analyzeScaleImageWithGemini({
          imageBuffer,
          mimeType: scale_image_mime_type || "image/jpeg",
          prompt: scale_prompt,
        });
      } catch (error) {
        geminiFailure = error;
      }
    } else {
      geminiFailure = new Error("scale image not provided");
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const historyRows = await Transaction.find({
      createdAt: { $gte: thirtyDaysAgo },
      $or: [
        { beneficiary_id: tx.beneficiary_id },
        ...(tx.contributor_id ? [{ contributor_id: tx.contributor_id }] : []),
        { technician_id: req.user.userId },
      ],
    })
      .select("contributor_id technician_id createdAt status cylinder_evidence")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    const normalizedHistory = historyRows.map((row) => ({
      transaction_id: String(row._id),
      contributor_id: row.contributor_id ? String(row.contributor_id) : null,
      technician_id: row.technician_id ? String(row.technician_id) : null,
      created_at: row.createdAt,
      status: row.status,
      manual_weight_kg:
        row.cylinder_evidence && Number.isFinite(Number(row.cylinder_evidence.physical_weight))
          ? Number(row.cylinder_evidence.physical_weight)
          : null,
    }));

    const nowTs = Date.now();
    const pairCount14Days = normalizedHistory.filter((row) => {
      if (!row.created_at) {
        return false;
      }
      const createdAt = new Date(row.created_at).getTime();
      return (
        row.contributor_id &&
        tx.contributor_id &&
        row.contributor_id === String(tx.contributor_id) &&
        row.technician_id === String(req.user.userId) &&
        createdAt >= nowTs - 14 * 24 * 60 * 60 * 1000
      );
    }).length;

    const contributorListings72h = normalizedHistory.filter((row) => {
      if (!row.created_at) {
        return false;
      }
      const createdAt = new Date(row.created_at).getTime();
      return (
        row.contributor_id &&
        tx.contributor_id &&
        row.contributor_id === String(tx.contributor_id) &&
        createdAt >= nowTs - 72 * 60 * 60 * 1000
      );
    }).length;

    const manualVsDetectedDiffKg =
      geminiResult && Number.isFinite(Number(geminiResult.detected_weight_kg))
        ? Number(Math.abs(physicalWeight - Number(geminiResult.detected_weight_kg)).toFixed(3))
        : null;

    let fraudGuardResult = null;
    let fraudGuardFailure = null;

    try {
      fraudGuardResult = await scoreFraudRiskWithGemini({
        transactionHistory: normalizedHistory,
        currentPayload: {
          transaction_id: String(tx._id),
          beneficiary_id: String(tx.beneficiary_id),
          contributor_id: tx.contributor_id ? String(tx.contributor_id) : null,
          technician_id: String(req.user.userId),
          manual_weight: physicalWeight,
          detected_weight: geminiResult ? geminiResult.detected_weight_kg : null,
          is_cylinder_visible: geminiResult ? geminiResult.is_cylinder_visible : null,
          rule_metrics: {
            technician_contributor_pair_count_14d: pairCount14Days,
            contributor_listings_72h: contributorListings72h,
            manual_detected_weight_diff_kg: manualVsDetectedDiffKg,
          },
          captured_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      fraudGuardFailure = error;
    }

    if (fraudGuardResult && Number(fraudGuardResult.combined_risk_score) > 75) {
      await upsertAndEmitWardenAlert(req, {
        transactionId: tx._id,
        riskScore: Number(fraudGuardResult.combined_risk_score),
        flags: Array.isArray(fraudGuardResult.flags) ? fraudGuardResult.flags : [],
        source: "GEMINI_FLASH",
        reviewReason: "High combined risk score from FraudGuard",
        context: {
          gemini_result: geminiResult,
          manual_weight_kg: physicalWeight,
          tare_weight_kg: tareWeight,
          actual_gas_kg: actualGasKg,
        },
      });
    }

    const didGeminiTimeout =
      (geminiFailure && geminiFailure.code === "AI_TIMEOUT") ||
      (fraudGuardFailure && fraudGuardFailure.code === "AI_TIMEOUT");

    if (geminiFailure || fraudGuardFailure) {
      const reasons = [];
      if (geminiFailure) {
        reasons.push(`Gemini: ${geminiFailure.message}`);
      }
      if (fraudGuardFailure) {
        reasons.push(`Gemini FraudGuard: ${fraudGuardFailure.message}`);
      }

      await upsertAndEmitWardenAlert(req, {
        transactionId: tx._id,
        riskScore: didGeminiTimeout ? 85 : 76,
        flags: didGeminiTimeout
          ? ["MANUAL_WARDEN_REVIEW_REQUIRED", "GEMINI_TIMEOUT"]
          : ["MANUAL_WARDEN_REVIEW_REQUIRED", "AI_PIPELINE_FAILURE"],
        source: didGeminiTimeout ? "GEMINI_TIMEOUT_FALLBACK" : "GEMINI_FALLBACK",
        reviewReason: reasons.join(" | "),
        context: {
          gemini_result: geminiResult,
          manual_weight_kg: physicalWeight,
          tare_weight_kg: tareWeight,
          actual_gas_kg: actualGasKg,
        },
      });
    }

    tx.cylinder_evidence = {
      serial_number,
      physical_weight: physicalWeight,
      tare_weight: tareWeight,
      actual_gas_kg: actualGasKg,
      safety_passed,
    };

    if (didGeminiTimeout) {
      tx.status = "PENDING_WARDEN_REVIEW";
      await tx.save();
      return res.status(202).json({
        transaction: tx,
        fallback: "PENDING_WARDEN_REVIEW",
      });
    }

    if (!safety_passed) {
      tx.status = "CANCELLED";
      tx.escrow.final_gas_payout = 0;
      tx.escrow.refund_to_beneficiary =
        tx.escrow.gas_value_deposited + tx.escrow.metal_security_deposit;
      await tx.save();
      return res.status(200).json({
        transaction: tx,
        refunded: true,
      });
    }

    const { isOverweight, finalGasPayout } =
      escrowFinanceService.calculateFinalGasPayout(actualGasKg);
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

    await createNotificationsByUserFilter({
      userFilter: {
        role: "WARDEN",
        $or: [
          { city: tx.city || tx.region_id || null },
          { region_id: tx.city || tx.region_id || null },
        ],
      },
      type: "TECH_VERIFICATION_COMPLETED",
      title: "Technician Verification Completed",
      message: "A technician has completed LPG verification for a transaction.",
      meta: {
        transaction_id: String(tx._id),
        city: tx.city || tx.region_id || null,
        status: tx.status,
      },
    });

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
      return res
        .status(400)
        .json({
          error: "invalid state transition: handover requires VERIFIED",
        });
    }

    tx.status = "IN_TRANSIT";
    await tx.save();

    await createNotificationsByUserFilter({
      userFilter: {
        role: "WARDEN",
        $or: [
          { city: tx.city || tx.region_id || null },
          { region_id: tx.city || tx.region_id || null },
        ],
      },
      type: "TECH_HANDOVER_COMPLETED",
      title: "Technician Handover Updated",
      message:
        "A technician has completed the handover step for a transaction.",
      meta: {
        transaction_id: String(tx._id),
        city: tx.city || tx.region_id || null,
        status: tx.status,
      },
    });

    return res.status(200).json({ transaction: tx });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  verifyTransaction,
  handoverTransaction,
};
