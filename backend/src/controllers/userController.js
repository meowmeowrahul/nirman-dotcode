const User = require("../models/User");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const KycForm = require("../models/KycForm");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeKycImage(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    return {
      url: trimmed,
      mime_type: null,
    };
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const url = typeof value.url === "string" ? value.url.trim() : "";
  if (!url) {
    return null;
  }

  return {
    url,
    mime_type: typeof value.mime_type === "string" && value.mime_type.trim()
      ? value.mime_type.trim()
      : null,
  };
}

function parseFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

async function updateMyLocation(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ error: "invalid token user" });
    }

    const lat = parseFiniteNumber(req.body.lat);
    const lng = parseFiniteNumber(req.body.lng);

    if (lat === null || lng === null) {
      return res.status(400).json({ error: "lat and lng must be numbers" });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "invalid latitude or longitude range" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          location: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({
      location: {
        user_id: String(user._id),
        lat,
        lng,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function submitKycForm(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ error: "invalid token user" });
    }

    const aadharDocPhoto = normalizeKycImage(req.body.aadhar_doc_photo);
    const panDocPhoto = normalizeKycImage(req.body.pan_doc_photo);
    const verificationSelfie = normalizeKycImage(req.body.verification_selfie);

    if (!aadharDocPhoto || !panDocPhoto || !verificationSelfie) {
      return res.status(400).json({
        error: "aadhar_doc_photo, pan_doc_photo and verification_selfie are required",
      });
    }

    const form = await KycForm.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          aadhar_doc_photo: aadharDocPhoto,
          pan_doc_photo: panDocPhoto,
          verification_selfie: verificationSelfie,
          submitted_at: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await User.findByIdAndUpdate(userId, { $set: { "kyc.status": "PENDING" } });

    return res.status(200).json({
      kyc_form: {
        id: String(form._id),
        user_id: String(form.user_id),
        aadhar_doc_photo: form.aadhar_doc_photo,
        pan_doc_photo: form.pan_doc_photo,
        verification_selfie: form.verification_selfie,
        submitted_at: form.submitted_at,
        created_at: form.createdAt,
        updated_at: form.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getOwnKycForm(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ error: "invalid token user" });
    }

    const form = await KycForm.findOne({ user_id: userId }).lean();
    if (!form) {
      return res.status(404).json({ error: "kyc form not found" });
    }

    return res.status(200).json({
      kyc_form: {
        id: String(form._id),
        user_id: String(form.user_id),
        aadhar_doc_photo: form.aadhar_doc_photo,
        pan_doc_photo: form.pan_doc_photo,
        verification_selfie: form.verification_selfie,
        submitted_at: form.submitted_at,
        created_at: form.createdAt,
        updated_at: form.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getKycFormForWarden(req, res, next) {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "valid userId is required" });
    }

    const form = await KycForm.findOne({ user_id: userId })
      .populate("user_id", "name role email phone region_id kyc.status")
      .lean();

    if (!form) {
      return res.status(404).json({ error: "kyc form not found" });
    }

    return res.status(200).json({
      kyc_form: {
        id: String(form._id),
        user: form.user_id
          ? {
              id: String(form.user_id._id),
              name: form.user_id.name || null,
              role: form.user_id.role,
              email: form.user_id.email || null,
              phone: form.user_id.phone || null,
              region_id: form.user_id.region_id || null,
              kyc_status: form.user_id.kyc && form.user_id.kyc.status ? form.user_id.kyc.status : null,
            }
          : null,
        aadhar_doc_photo: form.aadhar_doc_photo,
        pan_doc_photo: form.pan_doc_photo,
        verification_selfie: form.verification_selfie,
        submitted_at: form.submitted_at,
        created_at: form.createdAt,
        updated_at: form.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listPendingKycForms(req, res, next) {
  try {
    const regionId = req.query.region_id || req.user.region_id || null;

    const forms = await KycForm.find()
      .sort({ submitted_at: -1 })
      .populate("user_id", "name region_id kyc.status")
      .lean();

    const items = forms
      .filter((form) => {
        const user = form.user_id;
        if (!user) {
          return false;
        }

        const isPending = user.kyc && user.kyc.status === "PENDING";
        if (!isPending) {
          return false;
        }

        if (regionId && user.region_id !== regionId) {
          return false;
        }

        return true;
      })
      .map((form) => ({
        user_id: String(form.user_id._id),
        name: form.user_id.name || "Unknown",
        submitted_at: form.submitted_at,
        kyc_status: form.user_id.kyc.status,
      }));

    return res.status(200).json({ items });
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

module.exports = {
  updateKycStatus,
  listUserTransactions,
  submitKycForm,
  getOwnKycForm,
  getKycFormForWarden,
  listPendingKycForms,
  updateMyLocation,
};
