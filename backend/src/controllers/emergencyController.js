const Alert = require("../models/Alert");
const { parseVernacularEmergencyRequest } = require("../services/ai.service");

function emitWardenAlert(req, payload) {
  const io = req.app && req.app.get("io");
  if (io) {
    io.emit("WARDEN_ALERT", payload);
  }
}

async function createVoiceRequest(req, res, next) {
  try {
    const { text, language, audio_base64 } = req.body;

    if (
      (typeof text !== "string" || text.trim() === "") &&
      (typeof audio_base64 !== "string" || audio_base64.trim() === "")
    ) {
      return res.status(400).json({ error: "text or audio_base64 is required" });
    }

    try {
      const parsedRequest = await parseVernacularEmergencyRequest({
        inputText: typeof text === "string" ? text.trim() : null,
        language,
        audioBase64: typeof audio_base64 === "string" ? audio_base64 : null,
      });

      return res.status(200).json({ request: parsedRequest });
    } catch (aiError) {
      const fallbackAlert = await Alert.create({
        transaction_id: null,
        alert_type: "VOICE_AI_FAILURE",
        combined_risk_score: 80,
        flags: ["MANUAL_WARDEN_REVIEW_REQUIRED", "VOICE_AI_FAILURE"],
        source: "SARVAM_FALLBACK",
        review_status: "OPEN",
        review_reason: aiError.message,
        context: {
          text: typeof text === "string" ? text.trim() : null,
          language: language || null,
        },
      });

      emitWardenAlert(req, {
        alert_id: String(fallbackAlert._id),
        transaction_id: null,
        combined_risk_score: fallbackAlert.combined_risk_score,
        flags: fallbackAlert.flags,
        review_status: fallbackAlert.review_status,
        review_reason: fallbackAlert.review_reason,
        source: fallbackAlert.source,
        created_at: fallbackAlert.createdAt,
      });

      return res.status(202).json({
        request: {
          intent: "CREATE_REQUEST",
          urgency: "HIGH",
          location_clue: typeof text === "string" ? text.trim() : "",
        },
        fallback: "MANUAL_WARDEN_REVIEW",
      });
    }
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createVoiceRequest,
};