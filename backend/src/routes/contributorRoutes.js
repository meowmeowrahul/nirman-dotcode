const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { listContributor, getMyListingStatus } = require("../controllers/contributorController");

const router = express.Router();

router.get("/list/me", auth, authorize("CONTRIBUTOR", "BENEFICIARY"), getMyListingStatus);
router.post("/list", auth, authorize("CONTRIBUTOR", "BENEFICIARY"), listContributor);

module.exports = router;
