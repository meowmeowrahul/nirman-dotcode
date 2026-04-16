const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const {
  createComplaint,
  listComplaints,
  listOwnComplaints,
  updateComplaintStatus,
} = require("../controllers/complaintController");

const router = express.Router();

router.post("/", auth, authorize("BENEFICIARY", "CONTRIBUTOR", "TECHNICIAN", "WARDEN"), createComplaint);
router.get("/me", auth, authorize("BENEFICIARY", "CONTRIBUTOR", "TECHNICIAN"), listOwnComplaints);
router.get("/", auth, authorize("WARDEN"), listComplaints);
router.patch("/:id/status", auth, authorize("WARDEN"), updateComplaintStatus);

module.exports = router;
