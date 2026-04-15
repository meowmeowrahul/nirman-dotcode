const express = require("express");
const { lockEscrow, calculateEscrow, releaseEscrow } = require("../controllers/escrowController");

const router = express.Router();

router.post("/lock", lockEscrow);
router.post("/calculate", calculateEscrow);
router.post("/release", releaseEscrow);

module.exports = router;
