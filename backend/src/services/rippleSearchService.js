const User = require("../models/User");

const MAX_RESULTS = 10;

function buildPipeline({ lat, lng, maxDistanceMeters }) {
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
        query: {
          role: "CONTRIBUTOR",
          "kyc.status": "VERIFIED",
        },
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
        region_id: 1,
        location: 1,
        "kyc.status": 1,
        distance_meters: 1,
      },
    },
  ];
}

async function runPhase({ lat, lng, maxDistanceMeters }) {
  const pipeline = buildPipeline({ lat, lng, maxDistanceMeters });
  return User.aggregate(pipeline);
}

function getSearchPhases(urgencyScore) {
  if (urgencyScore > 8) {
    return [2000, 5000];
  }
  return [500, 2000, 5000];
}

async function rippleSearch({ lat, lng, urgencyScore }) {
  const phases = getSearchPhases(urgencyScore);

  for (const radius of phases) {
    const matches = await runPhase({ lat, lng, maxDistanceMeters: radius });
    if (matches.length > 0) {
      return matches;
    }
  }

  return [];
}

module.exports = {
  buildPipeline,
  getSearchPhases,
  runPhase,
  rippleSearch,
};
