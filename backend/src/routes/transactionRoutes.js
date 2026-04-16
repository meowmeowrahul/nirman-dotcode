const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const {
  getSummary,
  acknowledgeReturn,
  acknowledgeContributorLock,
  listContributorNotifications,
  listRegionalActivity,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/:transactionId/summary", auth, getSummary);
router.post(
  "/:transactionId/acknowledge-return",
  auth,
  authorize("BENEFICIARY", "CONTRIBUTOR"),
  acknowledgeReturn
);
router.patch(
  "/:transactionId/contributor-acknowledge",
  auth,
  authorize("CONTRIBUTOR"),
  acknowledgeContributorLock
);
router.get(
  "/contributor-notifications",
  auth,
  authorize("CONTRIBUTOR"),
  listContributorNotifications
);
router.get(
  "/regional-activity",
  auth,
  authorize("WARDEN"),
  listRegionalActivity
);

module.exports = router;
