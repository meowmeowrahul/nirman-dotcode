const User = require("../models/User");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

const MAX_RESULTS = 10;
const ACTIVE_LENDING_STATUSES = ["PAID_IN_ESCROW", "VERIFIED", "IN_TRANSIT"];
const LENDING_ROLES = ["CONTRIBUTOR", "BENEFICIARY"];

function buildPipeline({ lat, lng, maxDistanceMeters, requesterUserId }) {
  const query = {
    role: { $in: LENDING_ROLES },
    "contributor_listing.status": "LISTED",
    "contributor_listing.toggle_enabled": true,
  };

  if (requesterUserId && mongoose.Types.ObjectId.isValid(requesterUserId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(requesterUserId) };
  }

  return [
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng, lat],
        },
        distanceField: "distance_meters",
        spherical: true,
        maxDistance: maxDistanceMeters,
        query,
      },
    },
    {
      $sort: {
        distance_meters: 1,
      },
    },
    {
      $limit: MAX_RESULTS,
    },
    {
      $project: {
        _id: 1,
        role: 1,
        email: 1,
        phone: 1,
        city: 1,
        region_id: 1,
        location: 1,
        "kyc.status": 1,
        distance_meters: 1,
      },
    },
  ];
}

async function runPhase({ lat, lng, maxDistanceMeters, requesterUserId }) {
  const pipeline = buildPipeline({ lat, lng, maxDistanceMeters, requesterUserId });
  const rows = await User.aggregate([
    ...pipeline,
    {
      $lookup: {
        from: "transactions",
        let: { contributorId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$contributor_id", "$$contributorId"] },
                  { $in: ["$status", ACTIVE_LENDING_STATUSES] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "active_contributor_transactions",
      },
    },
    {
      $match: {
        active_contributor_transactions: { $size: 0 },
      },
    },
    {
      $project: {
        active_contributor_transactions: 0,
      },
    },
  ]);
  return rows.map((row) => ({
    ...row,
    distance_km:
      typeof row.distance_meters === "number"
        ? Number((row.distance_meters / 1000).toFixed(3))
        : undefined,
  }));
}

function mapListedContributor(user) {
  return {
    _id: user._id,
    role: user.role,
    email: user.email,
    phone: user.phone,
    city: user.city || user.region_id || null,
    region_id: user.region_id,
    location: user.location,
  };
}

async function runListedFallback({ city, requesterUserId }) {
  const baseFilter = {
    role: { $in: LENDING_ROLES },
    "contributor_listing.status": "LISTED",
    "contributor_listing.toggle_enabled": true,
  };

  if (requesterUserId && mongoose.Types.ObjectId.isValid(requesterUserId)) {
    baseFilter._id = { $ne: new mongoose.Types.ObjectId(requesterUserId) };
  }

  const busyContributorIds = await Transaction.find({
    contributor_id: { $ne: null },
    status: { $in: ACTIVE_LENDING_STATUSES },
  })
    .distinct("contributor_id");

  if (busyContributorIds.length > 0) {
    baseFilter._id = {
      ...(baseFilter._id || {}),
      $nin: busyContributorIds,
    };
  }

  const regionFilter = city ? { ...baseFilter, $or: [{ city }, { region_id: city }] } : null;

  if (regionFilter) {
    const regional = await User.find(regionFilter)
      .sort({ "contributor_listing.listed_at": -1, updatedAt: -1 })
      .limit(MAX_RESULTS)
      .select("role email phone city region_id location")
      .lean();

    if (regional.length > 0) {
      return regional.map(mapListedContributor);
    }
  }

  const global = await User.find(baseFilter)
    .sort({ "contributor_listing.listed_at": -1, updatedAt: -1 })
    .limit(MAX_RESULTS)
    .select("role email phone city region_id location")
    .lean();

  return global.map(mapListedContributor);
}

function getSearchPhases(urgencyScore) {
  if (urgencyScore > 8) {
    return [2000, 5000];
  }
  return [500, 2000, 5000];
}

async function rippleSearch({ lat, lng, urgencyScore, city, requesterUserId }) {
  const phases = getSearchPhases(urgencyScore);

  for (const radius of phases) {
    const matches = await runPhase({
      lat,
      lng,
      maxDistanceMeters: radius,
      requesterUserId,
    });
    if (matches.length > 0) {
      return matches;
    }
  }

  return runListedFallback({ city, requesterUserId });
}

module.exports = {
  buildPipeline,
  getSearchPhases,
  runPhase,
  rippleSearch,
};
