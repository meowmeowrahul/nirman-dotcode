const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { listContributor } = require("../controllers/contributorController");

const router = express.Router();

router.post("/list", auth, authorize("CONTRIBUTOR", "BENEFICIARY"), listContributor);

module.exports = router;
