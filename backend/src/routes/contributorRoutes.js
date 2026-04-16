const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const {
	listContributor,
	setListingToggle,
	getMyListingStatus,
} = require("../controllers/contributorController");

const router = express.Router();

router.get("/list/me", auth, authorize("CONTRIBUTOR", "BENEFICIARY"), getMyListingStatus);
router.patch("/list/toggle", auth, authorize("CONTRIBUTOR", "BENEFICIARY"), setListingToggle);
router.post("/list", auth, authorize("CONTRIBUTOR", "BENEFICIARY"), listContributor);

module.exports = router;
