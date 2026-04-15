const express = require("express");
const { updateKycStatus, listUserTransactions } = require("../controllers/userController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.patch("/kyc/:id", auth, authorize("WARDEN"), updateKycStatus);
router.get("/:userId/transactions", auth, listUserTransactions);

module.exports = router;
