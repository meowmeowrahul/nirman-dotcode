const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 9000);

class AIServiceError extends Error {
  constructor(message, provider, code = "AI_SERVICE_ERROR") {
    super(message);
    this.name = "AIServiceError";
    this.provider = provider;
    this.code = code;
  }
}

function withTimeout(promise, timeoutMs, provider) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new AIServiceError("AI call timed out", provider, "AI_TIMEOUT"));
      }, timeoutMs);
    }),
  ]);
}

function extractJson(text) {
  if (typeof text !== "string") {
    return null;
  }

  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first === -1 || last === -1 || last <= first) {
      return null;
    }

    try {
      return JSON.parse(trimmed.slice(first, last + 1));
    } catch (_innerError) {
      return null;
    }
  }
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }
  return false;
}

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIServiceError("GEMINI_API_KEY is missing", "GEMINI", "MISSING_API_KEY");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

async function analyzeScaleImageWithGemini({ imageBuffer, prompt, mimeType = "image/jpeg" }) {
  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new AIServiceError("imageBuffer is required", "GEMINI", "INVALID_INPUT");
  }

  const model = getGeminiModel();

  const aiPrompt =
    prompt ||
    [
      "Read the LPG cylinder weighing-scale image.",
      "Return valid JSON only with keys:",
      '{"detected_weight_kg": number, "is_cylinder_visible": boolean}',
      "No markdown or extra fields.",
    ].join(" ");

  try {
    const result = await withTimeout(
      model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: aiPrompt },
              {
                inlineData: {
                  data: imageBuffer.toString("base64"),
                  mimeType,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
      DEFAULT_AI_TIMEOUT_MS,
      "GEMINI",
    );

    const text = result && result.response ? result.response.text() : "";
    const parsed = extractJson(text);
    if (!parsed || !Number.isFinite(Number(parsed.detected_weight_kg))) {
      throw new AIServiceError("Gemini response is not valid JSON", "GEMINI", "INVALID_OUTPUT");
    }

    return {
      detected_weight_kg: Number(parsed.detected_weight_kg),
      is_cylinder_visible: parseBoolean(parsed.is_cylinder_visible),
    };
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    throw new AIServiceError(
      `Gemini analyze failed: ${error.message || "unknown error"}`,
      "GEMINI",
      "PROVIDER_FAILURE",
    );
  }
}

async function scoreFraudRiskWithGemini({ transactionHistory, currentPayload }) {
  if (!Array.isArray(transactionHistory)) {
    throw new AIServiceError("transactionHistory must be an array", "GEMINI", "INVALID_INPUT");
  }

  const model = getGeminiModel();

  const payloadJson = JSON.stringify(
    {
      transaction_history_last_30_days: transactionHistory,
      current_payload: currentPayload,
    },
    null,
    0,
  );

  const systemMessage = [
    "You are FraudGuard. You detect LPG collusion, hoarding and tampering risk.",
    "Evaluate these rules:",
    "1) Technician and Contributor paired > 3 times in 14 days => HIGH_COLLUSION_RISK.",
    "2) Contributor listed > 2 cylinders in 72h => HOARDING_RISK.",
    "3) manual_weight differs from detected_weight by > 0.2 kg => TAMPERING_RISK.",
    "Return JSON object only: {\"combined_risk_score\": number, \"flags\": string[] }.",
    "combined_risk_score must be between 0 and 100.",
    "Input payload is JSON string in the next line, parse it and evaluate.",
    `INPUT_JSON=${payloadJson}`,
  ].join(" ");

  try {
    const result = await withTimeout(
      model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: systemMessage,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0,
        },
      }),
      DEFAULT_AI_TIMEOUT_MS,
      "GEMINI",
    );

    const text = result && result.response ? result.response.text() : "";

    const parsed = extractJson(text);
    if (!parsed || !Number.isFinite(Number(parsed.combined_risk_score))) {
      throw new AIServiceError("Gemini fraud response JSON is invalid", "GEMINI", "INVALID_OUTPUT");
    }

    const score = Math.max(0, Math.min(100, Number(parsed.combined_risk_score)));
    const flags = Array.isArray(parsed.flags)
      ? parsed.flags.map((flag) => String(flag)).filter(Boolean)
      : [];

    return {
      combined_risk_score: score,
      flags,
    };
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    throw new AIServiceError(
      `Gemini fraud scoring failed: ${error.message || "unknown error"}`,
      "GEMINI",
      "PROVIDER_FAILURE",
    );
  }
}

async function parseVernacularEmergencyRequest({ inputText, language, audioBase64 }) {
  const apiUrl = process.env.SARVAM_API_URL;
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiUrl) {
    throw new AIServiceError("SARVAM_API_URL is missing", "SARVAM", "MISSING_API_URL");
  }

  if (!apiKey) {
    throw new AIServiceError("SARVAM_API_KEY is missing", "SARVAM", "MISSING_API_KEY");
  }

  if (!inputText && !audioBase64) {
    throw new AIServiceError("inputText or audioBase64 is required", "SARVAM", "INVALID_INPUT");
  }

  try {
    const response = await axios.post(
      apiUrl,
      {
        text: inputText || null,
        source_language: language || "auto",
        audio_base64: audioBase64 || null,
        target_schema: {
          intent: "CREATE_REQUEST",
          urgency: "HIGH|MEDIUM|LOW",
          location_clue: "string",
        },
      },
      {
        timeout: DEFAULT_AI_TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const raw = response && response.data ? response.data : null;
    const candidate =
      (raw && raw.parsed_payload) ||
      (raw && raw.result) ||
      (raw && raw.output) ||
      raw;

    const parsed = typeof candidate === "string" ? extractJson(candidate) : candidate;
    if (!parsed || typeof parsed !== "object") {
      throw new AIServiceError("Sarvam response payload invalid", "SARVAM", "INVALID_OUTPUT");
    }

    return {
      intent: String(parsed.intent || "CREATE_REQUEST"),
      urgency: String(parsed.urgency || "HIGH").toUpperCase(),
      location_clue: String(parsed.location_clue || "").trim(),
    };
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    throw new AIServiceError(
      `Sarvam parsing failed: ${error.message || "unknown error"}`,
      "SARVAM",
      "PROVIDER_FAILURE",
    );
  }
}

module.exports = {
  AIServiceError,
  analyzeScaleImageWithGemini,
  scoreFraudRiskWithGemini,
  parseVernacularEmergencyRequest,
};