const { rippleSearch } = require("../services/rippleSearchService");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const ACTIVE_REQUEST_STATUSES = ["PAID_IN_ESCROW", "VERIFIED", "IN_TRANSIT"];

function getLatLngFromLocation(location) {
  if (!location || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    return null;
  }

  const [lng, lat] = location.coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function ripple(req, res, next) {
  try {
    const lat = parseNumber(req.body.lat);
    const lng = parseNumber(req.body.lng);
    const urgencyScore = parseNumber(req.body.urgency_score) || 0;

    if (lat === null || lng === null) {
      return res.status(400).json({ error: "lat and lng must be numbers" });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "invalid latitude or longitude range" });
    }

    const contributors = await rippleSearch({ lat, lng, urgencyScore });
    return res.status(200).json(contributors);
  } catch (error) {
    return next(error);
  }
}

async function liveMap(req, res, next) {
  try {
    const regionId = req.query.region_id || req.user.region_id || null;

    const transactionFilter = {
      status: { $in: ACTIVE_REQUEST_STATUSES },
    };
    if (regionId) {
      transactionFilter.region_id = regionId;
    }

    const contributorFilter = {
      role: "CONTRIBUTOR",
      "kyc.status": "VERIFIED",
    };
    if (regionId) {
      contributorFilter.region_id = regionId;
    }

    const [activeTransactions, contributors] = await Promise.all([
      Transaction.find(transactionFilter)
        .sort({ updatedAt: -1 })
        .limit(100)
        .populate("beneficiary_id", "location")
        .lean(),
      User.find(contributorFilter)
        .sort({ updatedAt: -1 })
        .limit(200)
        .select("role region_id location")
        .lean(),
    ]);

    const active_requests = activeTransactions
      .map((tx) => {
        const position = getLatLngFromLocation(tx.beneficiary_id && tx.beneficiary_id.location);
        if (!position) {
          return null;
        }

        return {
          transaction_id: String(tx._id),
          status: tx.status,
          region_id: tx.region_id || null,
          lat: position.lat,
          lng: position.lng,
          updated_at: tx.updatedAt,
        };
      })
      .filter(Boolean);

    const available_contributors = contributors
      .map((user) => {
        const position = getLatLngFromLocation(user.location);
        if (!position) {
          return null;
        }

        return {
          user_id: String(user._id),
          role: user.role,
          region_id: user.region_id || null,
          lat: position.lat,
          lng: position.lng,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      region_id: regionId,
      active_requests,
      available_contributors,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  ripple,
  liveMap,
};
