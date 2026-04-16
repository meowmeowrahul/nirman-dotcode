const express = require("express");
const auth = require("../middleware/auth");
const {
  listMyNotifications,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", auth, listMyNotifications);
router.patch("/read-all", auth, markAllNotificationsRead);

module.exports = router;
