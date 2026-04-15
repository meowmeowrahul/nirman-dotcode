# SecureLPG UI/UX Functionality and User Flows (Backend-Aligned)

**Scope:** Functional UX only (flows, states, API contracts, required integrations).  
**Out of scope for this file:** visual styling/theme/colors/animation details (covered in the next file after review).

---

## 1) Backend API Surface (Every API expected by current backend)

Base URL: `/api`  
Content-Type: `application/json`

### Shared Auth/RBAC behavior

- Protected APIs require `Authorization: Bearer <JWT>`
- Common auth errors:
  - `401 {"error":"missing token"}`
  - `401 {"error":"invalid token"}`
- Common RBAC errors:
  - `401 {"error":"missing role in token"}`
  - `403 {"error":"forbidden"}`
- Global errors:
  - `400 {"error":"<validation message>"}` for validation failures
  - `500 {"error":"internal server error"}` for unhandled errors

### Auth APIs

1. `POST /api/auth/register`
   - Purpose: register user (password hashed by backend)
   - Key body fields: `role`, `email|phone`, `password`, optional `kyc`, optional `location`
   - Success: `201 { user: ... }`
   - Important errors: `400 password is required`, `409 email or phone already exists`

2. `POST /api/auth/login`
   - Purpose: authenticate using `email` or `phone` + `password`
   - Success: `200 { token }`
   - Important errors: `400 email or phone and password are required`, `401 invalid credentials`

### User/KYC API

3. `PATCH /api/users/kyc/:id` (auth + role `WARDEN`)
   - Purpose: update KYC status to one of `PENDING | VERIFIED | REJECTED`
   - Body: `{ status }`
   - Success: `200 { user: ... }`
   - Important errors: `400 invalid kyc status`, `404 user not found`

### Ripple Search API

4. `POST /api/search/ripple`
   - Purpose: geospatial search for verified contributors

- UX input rule: UI must use browser geolocation; users should not manually type latitude/longitude
- Body: `{ lat, lng, urgency_score }`
- Success: `200 [contributors...]` (max 10, nearest first)
- Empty state: `200 []`
- Important errors: `400 lat and lng must be numbers`, `400 invalid latitude or longitude range`

### Escrow APIs

5. `POST /api/escrow/lock`
   - Purpose: create transaction and lock escrow with status `PAID_IN_ESCROW`
   - Body: `{ beneficiary_id, region_id? }`
   - Success: `201 { transaction: ... }`
   - Important errors: `400 valid beneficiary_id is required`, `409 active transaction already holds metal security deposit`

6. `POST /api/escrow/calculate`
   - Purpose: calculate final gas payout from measured gas
   - Body: `{ transaction_id, actual_gas_kg }`
   - Success: `200 { transaction: ... }` (status transitions to `VERIFIED`)
   - Important errors:
     - `400 valid transaction_id is required`
     - `400 actual_gas_kg is required`
     - `404 transaction not found`
     - `400 invalid state transition: calculation requires PAID_IN_ESCROW`
     - `400 actual_gas_kg exceeds 14.2kg capacity` (flagged response)

7. `POST /api/escrow/release`
   - Purpose: complete transaction and release escrow when criteria pass
   - Body: `{ transaction_id, serial_number? }`
   - Success: `200 { transaction: ... }` (status `COMPLETED`)
   - Important errors:
     - `400 valid transaction_id is required`
     - `404 transaction not found`
     - `400 invalid state transition: release requires VERIFIED or IN_TRANSIT`
     - `409 serial number mismatch`

### Technician APIs

8. `PATCH /api/tech/verify/:transactionId` (auth + role `TECHNICIAN` + region match)
   - Purpose: verify cylinder evidence and safety
   - Body: `{ serial_number, physical_weight, tare_weight, safety_passed }`
   - Success:
     - `200 { transaction }` when `safety_passed = true` (typically to `VERIFIED`)
     - `200 { transaction, refunded: true }` when `safety_passed = false` (status `CANCELLED`)
   - Important errors:
     - `400 valid transactionId is required`
     - `400 serial_number is required`
     - `400 physical_weight and tare_weight must be numbers`
     - `400 tare_weight must be between 14.0kg and 17.0kg`
     - `400 safety_passed must be boolean`
     - `403 forbidden: region mismatch`
     - `400 invalid state transition: verify requires PAID_IN_ESCROW`

9. `PATCH /api/tech/handover/:transactionId` (auth + role `TECHNICIAN` + region match)
   - Purpose: move verified transaction to `IN_TRANSIT`
   - Success: `200 { transaction }`
   - Important errors:
     - `400 valid transactionId is required`
     - `404 transaction not found`
     - `403 forbidden: region mismatch`
     - `400 invalid state transition: handover requires VERIFIED`

---

## 2) Functional UI Modules and User Flows

## 2.1 Auth and Session

- Screens:
  - Login (email/phone + password)
  - Registration (role + basic account inputs only)
  - Profile completion (KYC details capture)
- Flow:
  1. Submit login/register form
  2. On login success, store JWT securely (session/local store strategy)
  3. Decode role from token payload for route guard and menu shaping
  4. If KYC fields are incomplete, force redirect to Profile completion before dashboard access
  5. Redirect to role-specific dashboard after profile requirements are completed
- UX requirements:
  - Inline validation before submit
  - Clear API error surfacing (400/401/409)
  - Loading states on submit buttons

## 2.2 Beneficiary Emergency Request Flow

- Primary steps:
  1. Request browser geolocation permission (mandatory)
  2. Read browser location (latitude/longitude) on permission grant
  3. Submit ripple search using `POST /api/search/ripple`
  4. Show contributors list sorted by nearest distance
  5. User confirms request intent
  6. Lock escrow via `POST /api/escrow/lock`
- Required functional states:
  - Block search if geolocation permission is denied or unavailable (permission is mandatory)
  - Clear recovery guidance: enable location permission and retry
  - `[]` search result empty state with retry / expand-radius messaging
  - Existing active escrow conflict (`409`) state
  - Draft-preserving retry after transient failures

## 2.3 Technician Verification Flow

- Primary steps:
  1. Open assigned transaction details
  2. Enter cylinder evidence and safety outcome
  3. Call `PATCH /api/tech/verify/:transactionId`
  4. If safe and verified, complete handover via `PATCH /api/tech/handover/:transactionId`
- Required functional states:
  - Region mismatch lockout (`403`) with non-editable info view
  - Overweight flagged path from verify/calculate errors
  - Safety failed path (`refunded: true`) ends flow as cancelled

## 2.4 Escrow Closure / Return Flow

- Primary steps:
  1. On return event, submit release request `POST /api/escrow/release`
  2. If backend has expected serial, enforce strict serial match
  3. On success, mark transaction complete and show final payout/refund summary
- Required functional states:
  - Serial mismatch (`409`) with corrective retry UX
  - Invalid-state transition errors should show next valid step guidance

## 2.5 Warden KYC Governance Flow

- Primary steps:
  1. User enters/updates KYC details inside Profile module (not registration form)
  2. Warden reviews user profile and updates KYC status via `PATCH /api/users/kyc/:id`
  3. Persist status chip and audit timestamp in UI
- Required functional states:
  - Invalid status selection protection
  - Not-found and permission errors with safe fallback navigation

---

## 3) Frontend Package Requirements

## 3.1 Core packages (required to implement current backend-driven UX)

- `react` / `react-dom` (UI runtime)
- `react-router-dom` (role-gated route structure)
- `axios` (API client + interceptors for bearer token)
- `zustand` or `redux-toolkit` (auth/session + transaction flow state)
- `react-hook-form` + `zod` (robust form + schema validation)
- `jwt-decode` (read token role/region for UX gating)
- `@tanstack/react-query` (network caching/retries/loading/error states)

## 3.2 Helpful utility packages

- `date-fns` (timestamps and status timelines)
- `clsx` (conditional class composition)
- `sonner` or `react-hot-toast` (feedback toasts)

## 3.3 Additional UI enhancement packages (optional but useful)

- Animation: `framer-motion`
- Prebuilt components/themes: `shadcn/ui` (with Tailwind), `@radix-ui/react-*`
- Icons: `lucide-react`
- Data tables: `@tanstack/react-table`
- Command/search UX: `cmdk`

---

## 4) API Keys / Environment Variables

## 4.1 Required by current backend code

- `MONGO_URI` (backend database connection)
- `JWT_SECRET` (token signing/verification)
- `PORT` (optional runtime port)

## 4.2 Expected for production-grade UI/UX around this workflow (recommended)

These are **not currently required by backend code**, but are typically needed for the flows in this product:

- Maps/geolocation:
  - `GOOGLE_MAPS_API_KEY` **or** `MAPBOX_ACCESS_TOKEN`
- Geocoding / distance fallback:
  - `GOOGLE_GEOCODING_API_KEY` **or** `LOCATIONIQ_API_KEY`
- AI/OCR evidence validation (as referenced in technical spec anomaly flow):
  - `OPENAI_API_KEY` **or** `GOOGLE_VISION_API_KEY`

## 4.3 Frontend env suggestions

- `VITE_API_BASE_URL` (or framework equivalent)
- `VITE_MAP_PROVIDER` (`google`/`mapbox`)
- `VITE_MAPS_KEY`
- `VITE_ENABLE_AI_EVIDENCE_CHECK=true|false`

---

## 5) Functional Acceptance Checklist (UI/UX)

- Auth works with both email and phone login paths
- Role-based navigation gates WARDEN and TECHNICIAN actions correctly
- Ripple search handles success, empty list, and bad-coordinate errors
- Escrow lock/calculate/release transitions are reflected as backend truth
- Technician verify/handover enforces region mismatch and state mismatch behavior
- All backend error messages are surfaced as clear user feedback
- Critical actions show loading, success confirmation, and retry options
- No functional dependency on visual theme choices in this phase

---

## 6) Notes for Next Document (Aesthetic & Feel)

- Next file will define white + orange design system, per-component color usage, motion language, and feedback micro-interactions while preserving this functional flow.
