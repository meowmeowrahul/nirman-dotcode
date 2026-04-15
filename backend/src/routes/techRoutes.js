const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { verifyTransaction, handoverTransaction } = require("../controllers/techController");

const router = express.Router();

router.patch("/verify/:transactionId", auth, authorize("TECHNICIAN"), verifyTransaction);
router.patch("/handover/:transactionId", auth, authorize("TECHNICIAN"), handoverTransaction);

module.exports = router;
