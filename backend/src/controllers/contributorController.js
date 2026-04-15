const User = require("../models/User");

function parseFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function listContributor(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: "invalid token user" });
    }

    const lat = parseFiniteNumber(req.body.lat);
    const lng = parseFiniteNumber(req.body.lng);

    if (lat !== null && (lat < -90 || lat > 90)) {
      return res.status(400).json({ error: "invalid latitude range" });
    }

    if (lng !== null && (lng < -180 || lng > 180)) {
      return res.status(400).json({ error: "invalid longitude range" });
    }

    const update = {
      "contributor_listing.status": "LISTED",
      "contributor_listing.listed_at": new Date(),
    };

    if (lat !== null && lng !== null) {
      update.location = {
        type: "Point",
        coordinates: [lng, lat],
      };
    }

    if (typeof req.body.region_id === "string" && req.body.region_id.trim()) {
      update.region_id = req.body.region_id.trim();
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({
      listing: {
        user_id: String(user._id),
        status: user.contributor_listing?.status || "LISTED",
        listed_at: user.contributor_listing?.listed_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listContributor,
};
