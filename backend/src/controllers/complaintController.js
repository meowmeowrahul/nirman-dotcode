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
  listComplaints,
  updateComplaintStatus,
};
