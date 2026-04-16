const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const {
	acceptOpenRequest,
	lockEscrow,
	listOpenRequests,
	calculateEscrow,
	releaseEscrow,
} = require("../controllers/escrowController");

const router = express.Router();

router.post("/lock", lockEscrow);
router.get("/open-requests", auth, authorize("CONTRIBUTOR"), listOpenRequests);
router.post("/accept-request", auth, authorize("CONTRIBUTOR"), acceptOpenRequest);
router.post("/calculate", calculateEscrow);
router.post("/release", releaseEscrow);

module.exports = router;
