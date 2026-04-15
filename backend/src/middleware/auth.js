const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "missing token" });
  }

  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    req.user = jwt.verify(token, secret);
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "invalid token" });
  }
}

module.exports = auth;
