function authorize(...allowedRoles) {
  return function enforceRole(req, res, next) {
    const role = req.user && req.user.role;

    if (!role) {
      return res.status(401).json({ error: "missing role in token" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "forbidden" });
    }

    return next();
  };
}

module.exports = authorize;
