const express = require("express");
const { createVoiceRequest } = require("../controllers/emergencyController");

const router = express.Router();

router.post("/voice-request", createVoiceRequest);

module.exports = router;