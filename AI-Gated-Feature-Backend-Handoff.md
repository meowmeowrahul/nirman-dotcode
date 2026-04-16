# SecureLPG AI-Gated Feature Backend Handoff (v4.0)

This document describes the backend implementation for the AI-gated verification and emergency voice pipeline, intended for frontend integration.

## 1) Scope Implemented

The backend currently implements:

- Gemini Vision OCR for technician scale-photo verification.
- Gemini FraudGuard scoring for collusion/velocity/tampering risk analysis.
- Sarvam-based vernacular parsing for emergency voice/text requests.
- Alert upsert logic when risk is high or AI fallback is triggered.
- Real-time Socket.io `WARDEN_ALERT` broadcast for the dashboard.
- Transaction fallback state `PENDING_WARDEN_REVIEW` on Gemini timeout.

Primary files:

- `src/services/ai.service.js`
- `src/controllers/techController.js`
- `src/controllers/emergencyController.js`
- `src/routes/techRoutes.js`
- `src/routes/emergencyRoutes.js`
- `src/models/Alert.js`
- `src/models/Transaction.js`
- `src/server.js`
- `src/app.js`

## 2) Runtime Configuration

Required environment variables:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-1.5-flash`)
- `SARVAM_API_KEY`
- `SARVAM_API_URL`
- `AI_TIMEOUT_MS` (default: `9000`)

Related server config:

- CORS origins are read from `CORS_ORIGINS`.
- JSON body size limit is `15mb`.

## 3) AI Service Contracts

All AI integrations are wrapped in `src/services/ai.service.js`.

### 3.1 Gemini Vision OCR

Function:

- `analyzeScaleImageWithGemini({ imageBuffer, prompt, mimeType })`

Output:

```json
{
  "detected_weight_kg": 21.45,
  "is_cylinder_visible": true
}
```

Implementation notes:

- Uses Gemini model from env.
- Uses `generationConfig.responseMimeType = "application/json"`.
- Performs timeout wrapping using `AI_TIMEOUT_MS`.
- Throws structured `AIServiceError` with `code` like `AI_TIMEOUT`, `INVALID_INPUT`, `INVALID_OUTPUT`, `PROVIDER_FAILURE`.

### 3.2 Gemini FraudGuard

Function:

- `scoreFraudRiskWithGemini({ transactionHistory, currentPayload })`

Input shape sent to Gemini:

```json
{
  "transaction_history_last_30_days": [
    {
      "transaction_id": "...",
      "contributor_id": "...",
      "technician_id": "...",
      "created_at": "2026-04-16T12:00:00.000Z",
      "status": "VERIFIED",
      "manual_weight_kg": 21.2
    }
  ],
  "current_payload": {
    "transaction_id": "...",
    "beneficiary_id": "...",
    "contributor_id": "...",
    "technician_id": "...",
    "manual_weight": 21.2,
    "detected_weight": 21.0,
    "is_cylinder_visible": true,
    "rule_metrics": {
      "technician_contributor_pair_count_14d": 4,
      "contributor_listings_72h": 3,
      "manual_detected_weight_diff_kg": 0.2
    },
    "captured_at": "2026-04-16T12:00:00.000Z"
  }
}
```

Output:

```json
{
  "combined_risk_score": 0,
  "flags": []
}
```

Rules encoded in prompt:

- Pairing > 3 times in 14 days => collusion risk.
- Contributor listings > 2 in 72h => hoarding risk.
- Manual vs detected weight diff > 0.2kg => tampering risk.

Implementation notes:

- Uses `generationConfig.responseMimeType = "application/json"`.
- Score is clamped to 0-100 server-side.

### 3.3 Sarvam Vernacular Parsing

Function:

- `parseVernacularEmergencyRequest({ inputText, language, audioBase64 })`

Output:

```json
{
  "intent": "CREATE_REQUEST",
  "urgency": "HIGH",
  "location_clue": "sector 12 near water tank"
}
```

Implementation notes:

- Uses Axios with `Authorization: Bearer <SARVAM_API_KEY>`.
- Timeout controlled by `AI_TIMEOUT_MS`.
- Accepts multiple response envelope shapes (`parsed_payload`, `result`, `output`, or raw).

## 4) API Endpoints for Frontend

## 4.1 Technician Verify (AI-Gated)

Route:

- `PATCH /api/tech/verify/:transactionId`

Auth:

- Required.
- Must be `TECHNICIAN` role (Bearer token).

Request body:

```json
{
  "beneficiary_user_id": "<optional ObjectId>",
  "serial_number": "BPC-DEL-7788",
  "physical_weight": 21.2,
  "tare_weight": 15.0,
  "safety_passed": true,
  "scale_image_base64": "<optional base64 or data-url>",
  "scale_image_mime_type": "image/jpeg",
  "scale_prompt": "optional custom OCR prompt"
}
```

Response variants:

1) Successful verification:

- HTTP `200`

```json
{
  "transaction": {
    "_id": "...",
    "status": "VERIFIED",
    "cylinder_evidence": {
      "serial_number": "BPC-DEL-7788",
      "physical_weight": 21.2,
      "tare_weight": 15.0,
      "actual_gas_kg": 6.2,
      "safety_passed": true
    }
  }
}
```

2) Gemini timeout fallback:

- HTTP `202`

```json
{
  "transaction": {
    "_id": "...",
    "status": "PENDING_WARDEN_REVIEW"
  },
  "fallback": "PENDING_WARDEN_REVIEW"
}
```

3) Safety failed:

- HTTP `200` with cancellation/refund payload.

4) Validation/state errors:

- HTTP `400`, `403`, `404`, `409` as applicable.

Frontend behavior recommendation:

- Treat `202 + fallback` as a non-fatal continuation state.
- Render a visible badge/state for `PENDING_WARDEN_REVIEW`.
- Do not assume every verify call ends in `VERIFIED`.

## 4.2 Emergency Voice Request

Route:

- `POST /api/emergency/voice-request`

Auth:

- Not required currently.

Request body:

```json
{
  "text": "मुझे गैस सिलेंडर तुरंत चाहिए",
  "language": "hi",
  "audio_base64": "<optional base64 audio>"
}
```

At least one of `text` or `audio_base64` must be present.

Response variants:

1) Parsed by Sarvam:

- HTTP `200`

```json
{
  "request": {
    "intent": "CREATE_REQUEST",
    "urgency": "HIGH",
    "location_clue": "..."
  }
}
```

2) Sarvam fallback path:

- HTTP `202`

```json
{
  "request": {
    "intent": "CREATE_REQUEST",
    "urgency": "HIGH",
    "location_clue": "original user text if available"
  },
  "fallback": "MANUAL_WARDEN_REVIEW"
}
```

3) Invalid payload:

- HTTP `400`

## 5) Socket.io Event Contract

Server emits event:

- `WARDEN_ALERT`

Emission source:

- During high-risk fraud detection.
- During Gemini/Sarvam fallback scenarios.

Payload shape:

```json
{
  "alert_id": "<ObjectId>",
  "transaction_id": "<ObjectId or null>",
  "combined_risk_score": 85,
  "flags": ["MANUAL_WARDEN_REVIEW_REQUIRED", "GEMINI_TIMEOUT"],
  "review_status": "OPEN",
  "review_reason": "Gemini: AI call timed out",
  "source": "GEMINI_TIMEOUT_FALLBACK",
  "created_at": "2026-04-16T12:00:00.000Z",
  "updated_at": "2026-04-16T12:00:00.000Z"
}
```

Socket bootstrap details:

- Socket.io server is attached in `src/server.js`.
- CORS for socket follows same `CORS_ORIGINS` list.

Frontend behavior recommendation:

- Subscribe to `WARDEN_ALERT` as a live notification stream.
- De-duplicate by `alert_id`.
- If `transaction_id` is present, deep-link to transaction details.

## 6) Alert Collection Schema

Mongoose model: `Alert`.

Fields:

- `transaction_id`: ObjectId ref Transaction, nullable.
- `alert_type`: string, indexed (default `FRAUD_GUARD`).
- `combined_risk_score`: number `0..100`.
- `flags`: string array.
- `source`: enum:
  - `GEMINI_FLASH`
  - `GEMINI_FALLBACK`
  - `GEMINI_TIMEOUT_FALLBACK`
  - `SARVAM_FALLBACK`
- `review_status`: enum `OPEN | UNDER_REVIEW | RESOLVED`.
- `review_reason`: string nullable.
- `context`: mixed JSON object.
- `createdAt`, `updatedAt` timestamps.

Indexes:

- `{ transaction_id: 1, alert_type: 1 }` unique sparse.

Important behavior:

- Fraud alerts are upserted by `(transaction_id, alert_type = FRAUD_GUARD)`.
- Voice fallback alerts use `alert_type = VOICE_AI_FAILURE` and create a new record.

## 7) Transaction Status Model Impact

`Transaction.status` enum now includes:

- `PAID_IN_ESCROW`
- `PENDING_WARDEN_REVIEW`
- `VERIFIED`
- `IN_TRANSIT`
- `COMPLETED`
- `CANCELLED`

Frontend impact:

- Existing status UIs must support `PENDING_WARDEN_REVIEW`.
- This status can be returned from technician verify when Gemini timeout occurs.

## 8) End-to-End Verify Flow (Backend)

1. Validate request and region authorization.
2. Compute `actual_gas_kg` from manual inputs.
3. Run Gemini Vision OCR if image present.
4. Build 30-day transaction history and rule metrics.
5. Run Gemini FraudGuard scoring.
6. If score > 75: upsert alert + emit `WARDEN_ALERT` (non-blocking).
7. If Gemini timeout: upsert fallback alert + emit event + set status `PENDING_WARDEN_REVIEW` + return `202`.
8. If safety failed: cancel and refund path.
9. Else proceed to standard verify state transition.

## 9) Error and Fallback Semantics

AI failures are not uniformly blocking:

- Gemini timeout in verify path: soft-stop into `PENDING_WARDEN_REVIEW`.
- Non-timeout AI errors (for example invalid AI output): alert is raised; transaction may still continue unless other business checks fail.
- Sarvam parsing failure: returns fallback `202`, creates alert, emits event.

Frontend should therefore treat AI fallback responses as actionable states, not generic failures.

## 10) Frontend Integration Checklist

- Add transaction status mapping for `PENDING_WARDEN_REVIEW`.
- Handle verify API response status `202` and `fallback` field.
- Add Socket.io client subscription for `WARDEN_ALERT`.
- Add alert toast/inbox UI model for fields in event payload.
- Update technician verify form to optionally send:
  - `scale_image_base64`
  - `scale_image_mime_type`
  - `scale_prompt`
- Add emergency voice/text form to call `/api/emergency/voice-request`.
- Handle both `200` and `202` response modes for emergency parsing.

## 11) Known Gaps (Current Backend)

- No dedicated REST endpoint is implemented yet for listing/querying `Alert` records.
- Live alerting currently relies on Socket.io events.
- A test setup issue exists in one integration test (`401` due to token user seeding), unrelated to API contracts documented here.

## 12) Suggested Next Backend Additions (Optional)

If frontend needs historical alert views:

- Add `GET /api/alerts` with filters by `review_status`, `source`, `city`, and date range.
- Add `PATCH /api/alerts/:id/review` for warden resolution actions.

These are not part of current implementation but are natural follow-ons.
