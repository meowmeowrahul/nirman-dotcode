const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { listTechnicianAvailability } = require("../controllers/technicianController");

const router = express.Router();

router.get("/availability", auth, authorize("WARDEN"), listTechnicianAvailability);

module.exports = router;
