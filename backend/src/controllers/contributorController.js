const User = require("../models/User");

function parseFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isKycVerified(user) {
  return user && user.kyc && user.kyc.status === "VERIFIED";
}

async function listContributor(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: "invalid token user" });
    }

    const actor = await User.findById(userId).select("kyc.status").lean();
    if (!actor) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!isKycVerified(actor)) {
      return res.status(403).json({
        error: "kyc must be VERIFIED before enabling Lend LPG",
      });
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
      "contributor_listing.toggle_enabled": true,
      "contributor_listing.listed_at": new Date(),
    };

    if (lat !== null && lng !== null) {
      update.location = {
        type: "Point",
        coordinates: [lng, lat],
      };
    }

    const city =
      (typeof req.body.city === "string" && req.body.city.trim()) ||
      (typeof req.body.region_id === "string" && req.body.region_id.trim()) ||
      null;

    if (city) {
      update.city = city;
      update.region_id = city;
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({
      listing: {
        user_id: String(user._id),
        status: user.contributor_listing?.status || "LISTED",
        toggle_enabled: Boolean(user.contributor_listing?.toggle_enabled),
        listed_at: user.contributor_listing?.listed_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function setListingToggle(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: "invalid token user" });
    }

    if (typeof req.body.enabled !== "boolean") {
      return res.status(400).json({ error: "enabled must be boolean" });
    }

    const enabled = req.body.enabled;
    const actor = await User.findById(userId).select("kyc.status").lean();
    if (!actor) {
      return res.status(404).json({ error: "user not found" });
    }

    if (enabled && !isKycVerified(actor)) {
      return res.status(403).json({
        error: "kyc must be VERIFIED before enabling Lend LPG",
      });
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
      "contributor_listing.toggle_enabled": enabled,
      "contributor_listing.status": enabled ? "LISTED" : "UNLISTED",
      "contributor_listing.listed_at": enabled ? new Date() : null,
    };

    if (enabled && lat !== null && lng !== null) {
      update.location = {
        type: "Point",
        coordinates: [lng, lat],
      };
    }

    const city =
      (typeof req.body.city === "string" && req.body.city.trim()) ||
      (typeof req.body.region_id === "string" && req.body.region_id.trim()) ||
      null;

    if (enabled && city) {
      update.city = city;
      update.region_id = city;
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({
      listing: {
        user_id: String(user._id),
        role: user.role,
        kyc_status: user.kyc?.status || "PENDING",
        status: user.contributor_listing?.status || "UNLISTED",
        toggle_enabled: Boolean(user.contributor_listing?.toggle_enabled),
        listed_at: user.contributor_listing?.listed_at || null,
        city: user.city || user.region_id || null,
        location: user.location || null,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyListingStatus(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: "invalid token user" });
    }

    const user = await User.findById(userId)
      .select("role contributor_listing city region_id location")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({
      listing: {
        user_id: String(user._id),
        role: user.role,
        kyc_status: user.kyc?.status || "PENDING",
        status: user.contributor_listing?.status || "UNLISTED",
        toggle_enabled: Boolean(user.contributor_listing?.toggle_enabled),
        listed_at: user.contributor_listing?.listed_at || null,
        city: user.city || user.region_id || null,
        location: user.location || null,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listContributor,
  setListingToggle,
  getMyListingStatus,
};
