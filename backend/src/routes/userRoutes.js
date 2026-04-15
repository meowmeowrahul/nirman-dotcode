const express = require("express");
const {
	updateKycStatus,
	listUserTransactions,
	submitKycForm,
	getOwnKycForm,
	getKycFormForWarden,
} = require("../controllers/userController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.patch("/kyc/:id", auth, authorize("WARDEN"), updateKycStatus);
router.post("/kyc-form", auth, authorize("BENEFICIARY", "CONTRIBUTOR"), submitKycForm);
router.get("/kyc-form/me", auth, getOwnKycForm);
router.get("/kyc-form/:userId", auth, authorize("WARDEN"), getKycFormForWarden);
router.get("/:userId/transactions", auth, listUserTransactions);

module.exports = router;
