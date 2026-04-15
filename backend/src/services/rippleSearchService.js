const User = require("../models/User");
const mongoose = require("mongoose");

const MAX_RESULTS = 10;

function buildPipeline({ lat, lng, maxDistanceMeters, requesterUserId }) {
  const query = {
    role: "CONTRIBUTOR",
    "contributor_listing.status": "LISTED",
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
  const rows = await User.aggregate(pipeline);
  return rows.map((row) => ({
    ...row,
    distance_km:
      typeof row.distance_meters === "number"
        ? Number((row.distance_meters / 1000).toFixed(3))
        : undefined,
  }));
}

function buildRelaxedPipeline({ lat, lng, maxDistanceMeters, requesterUserId }) {
  const query = {
    role: "CONTRIBUTOR",
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

function hasValidCoordinates(location) {
  if (!location || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    return false;
  }

  const [lng, lat] = location.coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  return !(lat === 0 && lng === 0);
}

async function runRelaxedPhase({ lat, lng, maxDistanceMeters, requesterUserId }) {
  const pipeline = buildRelaxedPipeline({ lat, lng, maxDistanceMeters, requesterUserId });
  const rows = await User.aggregate(pipeline);

  return rows
    .filter((row) => hasValidCoordinates(row.location))
    .map((row) => ({
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
    role: "CONTRIBUTOR",
    "contributor_listing.status": "LISTED",
  };

  if (requesterUserId && mongoose.Types.ObjectId.isValid(requesterUserId)) {
    baseFilter._id = { $ne: new mongoose.Types.ObjectId(requesterUserId) };
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

  for (const radius of phases) {
    const relaxedMatches = await runRelaxedPhase({
      lat,
      lng,
      maxDistanceMeters: radius,
      requesterUserId,
    });

    if (relaxedMatches.length > 0) {
      return relaxedMatches;
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
