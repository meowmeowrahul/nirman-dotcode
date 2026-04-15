const User = require("../models/User");

async function listTechnicianAvailability(req, res, next) {
  try {
    const regionId = req.query.region_id || req.user.region_id || null;

    const filter = { role: "TECHNICIAN" };
    if (regionId) {
      filter.region_id = regionId;
    }

    const rows = await User.find(filter)
      .sort({ updatedAt: -1 })
      .select("name phone region_id technician_availability")
      .lean();

    const technicians = rows.map((tech) => ({
      id: String(tech._id),
      name: tech.name || tech.phone || tech.email || "Technician",
      phone: tech.phone || null,
      rating:
        typeof tech.technician_availability?.rating === "number"
          ? tech.technician_availability.rating
          : null,
      status: tech.technician_availability?.status || "AVAILABLE",
      region_id: tech.region_id || null,
    }));

    return res.status(200).json({ technicians });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTechnicianAvailability,
};
