const express = require("express");
const { updateKycStatus } = require("../controllers/userController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.patch("/kyc/:id", auth, authorize("WARDEN"), updateKycStatus);

module.exports = router;
