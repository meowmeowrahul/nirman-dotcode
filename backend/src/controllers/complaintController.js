const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");

const ALLOWED_STATUSES = ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"];

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function listComplaints(req, res, next) {
  try {
    const city = req.query.city || req.query.region_id || req.user.city || req.user.region_id || null;
    const status = req.query.status || null;

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: "invalid complaint status" });
    }

    const filter = {};
    if (city) {
      filter.region_id = city;
    }
    if (status) {
      filter.status = status;
    }

    const rows = await Complaint.find(filter).sort({ createdAt: -1 }).lean();

    const complaints = rows.map((complaint) => ({
      id: String(complaint._id),
      reporter_user_id: String(complaint.reporter_user_id),
      accused_user_id: String(complaint.accused_user_id),
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      created_at: complaint.createdAt,
    }));

    return res.status(200).json({ complaints });
  } catch (error) {
    return next(error);
  }
}

async function listOwnComplaints(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!isValidObjectId(userId)) {
      return res.status(401).json({ error: "invalid token user" });
    }

    const rows = await Complaint.find({
      $or: [{ reporter_user_id: userId }, { accused_user_id: userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const complaints = rows.map((complaint) => ({
      id: String(complaint._id),
      reporter_user_id: String(complaint.reporter_user_id),
      accused_user_id: String(complaint.accused_user_id),
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      created_at: complaint.createdAt,
    }));

    return res.status(200).json({ complaints });
  } catch (error) {
    return next(error);
  }
}

async function createComplaint(req, res, next) {
  try {
    const reporterUserId = req.user && req.user.userId;
    if (!isValidObjectId(reporterUserId)) {
      return res.status(401).json({ error: "invalid token user" });
    }

    const { accused_user_id, category, description } = req.body;

    if (!isValidObjectId(accused_user_id)) {
      return res.status(400).json({ error: "valid accused_user_id is required" });
    }

    if (String(accused_user_id) === String(reporterUserId)) {
      return res.status(400).json({ error: "cannot file complaint against self" });
    }

    const normalizedCategory =
      typeof category === "string" && category.trim()
        ? category.trim().toUpperCase()
        : "OTHER";

    const normalizedDescription =
      typeof description === "string" ? description.trim() : "";

    if (!normalizedDescription) {
      return res.status(400).json({ error: "description is required" });
    }

    const complaint = await Complaint.create({
      reporter_user_id: reporterUserId,
      accused_user_id,
      region_id: req.user.city || req.user.region_id || null,
      category: normalizedCategory,
      description: normalizedDescription,
      status: "OPEN",
    });

    return res.status(201).json({
      complaint: {
        id: String(complaint._id),
        reporter_user_id: String(complaint.reporter_user_id),
        accused_user_id: String(complaint.accused_user_id),
        category: complaint.category,
        description: complaint.description,
        status: complaint.status,
        created_at: complaint.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateComplaintStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "valid complaint id is required" });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: "invalid complaint status" });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: "complaint not found" });
    }

    return res.status(200).json({
      complaint: {
        id: String(complaint._id),
        status: complaint.status,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createComplaint,
  listComplaints,
  listOwnComplaints,
  updateComplaintStatus,
};
