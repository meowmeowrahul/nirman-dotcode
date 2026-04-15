const User = require("../models/User");

async function listTechnicianAvailability(req, res, next) {
  try {
    const city = req.query.city || req.query.region_id || req.user.city || req.user.region_id || null;

    const filter = { role: "TECHNICIAN" };
    if (city) {
      filter.city = city;
    }

    const rows = await User.find(filter)
      .sort({ updatedAt: -1 })
      .select("name phone city region_id technician_availability")
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
      city: tech.city || tech.region_id || null,
      region_id: tech.region_id || tech.city || null,
    }));

    return res.status(200).json({ technicians });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTechnicianAvailability,
};
