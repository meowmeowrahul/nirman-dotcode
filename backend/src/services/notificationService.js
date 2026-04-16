const Notification = require("../models/Notification");
const User = require("../models/User");

async function createNotification({
  recipientUserId,
  type,
  title,
  message,
  meta = {},
}) {
  if (!recipientUserId || !type || !title || !message) {
    return null;
  }

  return Notification.create({
    recipient_user_id: recipientUserId,
    type,
    title,
    message,
    meta,
  });
}

async function createNotificationsForUsers({
  userIds,
  type,
  title,
  message,
  meta = {},
}) {
  if (
    !Array.isArray(userIds) ||
    userIds.length === 0 ||
    !type ||
    !title ||
    !message
  ) {
    return 0;
  }

  const payload = userIds.map((id) => ({
    recipient_user_id: id,
    type,
    title,
    message,
    meta,
  }));

  const result = await Notification.insertMany(payload, { ordered: false });
  return result.length;
}

async function createNotificationsByUserFilter({
  userFilter = {},
  excludedUserIds = [],
  type,
  title,
  message,
  meta = {},
}) {
  if (!type || !title || !message) {
    return 0;
  }

  const users = await User.find(userFilter).select("_id").lean();
  if (!users.length) {
    return 0;
  }

  const excluded = new Set(
    (excludedUserIds || []).map((value) => String(value)),
  );
  const userIds = users
    .map((user) => String(user._id))
    .filter((id) => !excluded.has(id));

  return createNotificationsForUsers({
    userIds,
    type,
    title,
    message,
    meta,
  });
}

async function notifyCitizensLpgNeeded({ city = null, transactionId = null } = {}) {
  return createNotificationsByUserFilter({
    userFilter: {
      role: { $in: ["BENEFICIARY", "CONTRIBUTOR"] },
    },
    type: "RIPPLE_LPG_NEEDED",
    title: "LPG Needed in Community",
    message:
      "A neighbor needs LPG support right now. Please turn on Lend mode if you can help.",
    meta: {
      city,
      transaction_id: transactionId,
      source: "RIPPLE_SEARCH",
    },
  });
}

module.exports = {
  createNotification,
  createNotificationsForUsers,
  createNotificationsByUserFilter,
  notifyCitizensLpgNeeded,
};
