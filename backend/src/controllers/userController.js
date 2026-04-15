const User = require("../models/User");

async function updateKycStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["PENDING", "VERIFIED", "REJECTED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "invalid kyc status" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { "kyc.status": status } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({ user: user.toJSON() });
  } catch (error) {
    return next(error);
  }
}

module.exports = { updateKycStatus };
