const express = require("express");
const { ripple, liveMap } = require("../controllers/searchController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/ripple", (req, _res, next) => {
	const authHeader = req.headers.authorization || "";
	if (authHeader.startsWith("Bearer ")) {
		return auth(req, _res, next);
	}
	return next();
}, ripple);
router.get("/live-map", auth, liveMap);

module.exports = router;
