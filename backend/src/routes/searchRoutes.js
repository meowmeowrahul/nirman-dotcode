const express = require("express");
const { ripple } = require("../controllers/searchController");

const router = express.Router();

router.post("/ripple", ripple);

module.exports = router;
