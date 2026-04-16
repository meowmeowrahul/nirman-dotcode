const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "missing token" });
  }

  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    const decoded = jwt.verify(token, secret);

    const userExists = await User.exists({ _id: decoded.userId });
    if (!userExists) {
      return res.status(401).json({ error: "token user not found" });
    }

    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "invalid token" });
  }
}

module.exports = auth;
