const express = require("express");
const { ripple, liveMap } = require("../controllers/searchController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/ripple", ripple);
router.get("/live-map", auth, liveMap);

module.exports = router;
