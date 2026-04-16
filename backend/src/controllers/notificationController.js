const mongoose = require("mongoose");
const Notification = require("../models/Notification");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function listMyNotifications(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ error: "invalid token user" });
    }

    const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200));

    const [rows, unreadCount] = await Promise.all([
      Notification.find({ recipient_user_id: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient_user_id: userId, read_at: null }),
    ]);

    const notifications = rows.map((row) => ({
      id: String(row._id),
      type: row.type,
      title: row.title,
      message: row.message,
      is_read: Boolean(row.read_at),
      read_at: row.read_at,
      created_at: row.createdAt,
      meta: row.meta || {},
    }));

    return res.status(200).json({ notifications, unread_count: unreadCount });
  } catch (error) {
    return next(error);
  }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({ error: "invalid token user" });
    }

    const now = new Date();
    const result = await Notification.updateMany(
      { recipient_user_id: userId, read_at: null },
      { $set: { read_at: now } },
    );

    return res.status(200).json({
      success: true,
      marked_count: result.modifiedCount || 0,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listMyNotifications,
  markAllNotificationsRead,
};
