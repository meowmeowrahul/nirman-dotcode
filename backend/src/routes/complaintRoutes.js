const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const {
  listComplaints,
  updateComplaintStatus,
} = require("../controllers/complaintController");

const router = express.Router();

router.get("/", auth, authorize("WARDEN"), listComplaints);
router.patch("/:id/status", auth, authorize("WARDEN"), updateComplaintStatus);

module.exports = router;
