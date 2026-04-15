const { rippleSearch } = require("../services/rippleSearchService");

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

module.exports = {
  ripple,
};
