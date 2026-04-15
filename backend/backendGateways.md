SecureLPG Backend API Gateways
Version: current workspace implementation
Base URL: /api
Content-Type: application/json

Shared Auth/RBAC Behavior
- Routes protected by auth middleware require header: Authorization: Bearer <JWT>
- Common auth errors:
  - 401 {"error":"missing token"}
  - 401 {"error":"invalid token"}
- Common RBAC errors:
  - 401 {"error":"missing role in token"}
  - 403 {"error":"forbidden"}

Global Error Contract
- ValidationError from Mongoose: 400 {"error":"<validation message>"}
- Unhandled server error: 500 {"error":"internal server error"}

================================================================
AUTH MODULE
================================================================

1) POST /api/auth/register
Purpose
- Register user with hashed password.

Request JSON
{
  "role": "BENEFICIARY",
  "email": "user@example.com",
  "password": "StrongPass@123",
  "kyc": {
    "status": "PENDING",
    "omc_id": "SV123456",
    "masked_aadhar": "XXXX-XXXX-1234"
  },
  "location": {
    "type": "Point",
    "coordinates": [77.1025, 28.7041]
  }
}

Success Response (201)
{
  "user": {
    "_id": "<objectId>",
    "role": "BENEFICIARY",
    "email": "user@example.com",
    "phone": null,
    "kyc": {
      "status": "PENDING",
      "omc_id": "SV123456",
      "masked_aadhar": "XXXX-XXXX-1234"
    },
    "region_id": null,
    "location": {
      "type": "Point",
      "coordinates": [77.1025, 28.7041]
    },
    "createdAt": "<iso>",
    "updatedAt": "<iso>"
  }
}

Expected Error Responses
- 400 {"error":"password is required"}
- 409 {"error":"email or phone already exists"}
- 400 {"error":"<mongoose validation message>"}


2) POST /api/auth/login
Purpose
- Authenticate by email or phone + password and issue JWT.

Request JSON (email login)
{
  "email": "user@example.com",
  "password": "StrongPass@123"
}

Request JSON (phone login)
{
  "phone": "+919999999999",
  "password": "StrongPass@123"
}

Success Response (200)
{
  "token": "<jwt containing userId, role, region_id>"
}

Expected Error Responses
- 400 {"error":"email or phone and password are required"}
- 401 {"error":"invalid credentials"}

================================================================
USER/KYC MODULE
================================================================

3) PATCH /api/users/kyc/:id
Authorization
- WARDEN only

Request JSON
{
  "status": "VERIFIED"
}

Success Response (200)
{
  "user": {
    "_id": "<objectId>",
    "role": "CONTRIBUTOR",
    "email": "contrib@example.com",
    "phone": "+919999999991",
    "kyc": {
      "status": "VERIFIED",
      "omc_id": "SV000001",
      "masked_aadhar": "XXXX-XXXX-1234"
    },
    "region_id": null,
    "location": {
      "type": "Point",
      "coordinates": [77.1025, 28.7041]
    },
    "createdAt": "<iso>",
    "updatedAt": "<iso>"
  }
}

Expected Error Responses
- 400 {"error":"invalid kyc status"}
- 404 {"error":"user not found"}
- 401/403 auth-rbac errors (see shared section)

================================================================
RIPPLE SEARCH MODULE
================================================================

4) POST /api/search/ripple
Purpose
- Geospatial contributor discovery using phased radius logic.
- Only VERIFIED CONTRIBUTORS are returned.
- Maximum 10 results sorted by nearest distance.

Request JSON
{
  "lat": 28.7041,
  "lng": 77.1025,
  "urgency_score": 5
}

Success Response (200)
[
  {
    "_id": "<objectId>",
    "role": "CONTRIBUTOR",
    "email": "c1@example.com",
    "phone": "+919900000001",
    "region_id": "R1",
    "location": {
      "type": "Point",
      "coordinates": [77.1030, 28.7043]
    },
    "kyc": {
      "status": "VERIFIED"
    },
    "distance_meters": 312.74
  }
]

Expected Error Responses
- 400 {"error":"lat and lng must be numbers"}
- 400 {"error":"invalid latitude or longitude range"}

Empty-State Response (200)
[]

================================================================
ESCROW & FINANCE MODULE
================================================================

5) POST /api/escrow/lock
Purpose
- Create a transaction and lock escrow funds with initial status PAID_IN_ESCROW.

Request JSON
{
  "beneficiary_id": "<objectId>",
  "region_id": "R-DEL-01"
}

Success Response (201)
{
  "transaction": {
    "_id": "<objectId>",
    "beneficiary_id": "<objectId>",
    "technician_id": null,
    "region_id": "R-DEL-01",
    "status": "PAID_IN_ESCROW",
    "escrow": {
      "gas_value_deposited": 950,
      "metal_security_deposit": 2000,
      "service_fee": 150,
      "final_gas_payout": null,
      "refund_to_beneficiary": null
    },
    "cylinder_evidence": {
      "serial_number": null,
      "physical_weight": null,
      "tare_weight": null,
      "actual_gas_kg": null,
      "safety_passed": null
    },
    "createdAt": "<iso>",
    "updatedAt": "<iso>"
  }
}

Expected Error Responses
- 400 {"error":"valid beneficiary_id is required"}
- 409 {"error":"active transaction already holds metal security deposit"}


6) POST /api/escrow/calculate
Purpose
- Compute final gas payout from actual gas.

Request JSON
{
  "transaction_id": "<objectId>",
  "actual_gas_kg": 7.1
}

Success Response (200)
{
  "transaction": {
    "_id": "<objectId>",
    "status": "VERIFIED",
    "escrow": {
      "gas_value_deposited": 950,
      "metal_security_deposit": 2000,
      "service_fee": 150,
      "final_gas_payout": 475,
      "refund_to_beneficiary": null
    }
  }
}

Expected Error Responses
- 400 {"error":"valid transaction_id is required"}
- 400 {"error":"actual_gas_kg is required"}
- 404 {"error":"transaction not found"}
- 400 {"error":"invalid state transition: calculation requires PAID_IN_ESCROW"}
- 400 {
    "error":"actual_gas_kg exceeds 14.2kg capacity",
    "flagged":true,
    "capped_final_gas_payout":950
  }


7) POST /api/escrow/release
Purpose
- Complete transaction after return, with optional strict serial check.

Request JSON
{
  "transaction_id": "<objectId>",
  "serial_number": "IOCL-DEL-0007"
}

Success Response (200)
{
  "transaction": {
    "_id": "<objectId>",
    "status": "COMPLETED",
    "escrow": {
      "gas_value_deposited": 950,
      "metal_security_deposit": 2000,
      "service_fee": 150,
      "final_gas_payout": 600,
      "refund_to_beneficiary": null
    }
  }
}

Expected Error Responses
- 400 {"error":"valid transaction_id is required"}
- 404 {"error":"transaction not found"}
- 400 {"error":"invalid state transition: release requires VERIFIED or IN_TRANSIT"}
- 409 {"error":"serial number mismatch"}

================================================================
TECHNICIAN VERIFICATION MODULE
================================================================

8) PATCH /api/tech/verify/:transactionId
Authorization
- TECHNICIAN only
- token.region_id must strictly equal transaction.region_id

Request JSON
{
  "serial_number": "HPCL-001-XYZ",
  "physical_weight": 21.2,
  "tare_weight": 15.0,
  "safety_passed": true
}

Success Response (200) when safety_passed=true
{
  "transaction": {
    "_id": "<objectId>",
    "technician_id": "<techObjectId>",
    "status": "VERIFIED",
    "escrow": {
      "final_gas_payout": 414.79
    },
    "cylinder_evidence": {
      "serial_number": "HPCL-001-XYZ",
      "physical_weight": 21.2,
      "tare_weight": 15,
      "actual_gas_kg": 6.2,
      "safety_passed": true
    }
  }
}

Success Response (200) when safety_passed=false
{
  "transaction": {
    "_id": "<objectId>",
    "status": "CANCELLED",
    "escrow": {
      "final_gas_payout": 0,
      "refund_to_beneficiary": 2950
    }
  },
  "refunded": true
}

Expected Error Responses
- 400 {"error":"valid transactionId is required"}
- 400 {"error":"serial_number is required"}
- 400 {"error":"physical_weight and tare_weight must be numbers"}
- 400 {"error":"tare_weight must be between 14.0kg and 17.0kg"}
- 400 {"error":"safety_passed must be boolean"}
- 404 {"error":"transaction not found"}
- 403 {"error":"forbidden: region mismatch"}
- 400 {"error":"invalid state transition: verify requires PAID_IN_ESCROW"}
- 400 {"error":"invalid weights: actual gas must be greater than zero"}
- 400 {
    "error":"actual_gas_kg exceeds 14.2kg capacity",
    "flagged":true,
    "capped_final_gas_payout":950
  }


9) PATCH /api/tech/handover/:transactionId
Authorization
- TECHNICIAN only
- token.region_id must strictly equal transaction.region_id

Request JSON
{}

Success Response (200)
{
  "transaction": {
    "_id": "<objectId>",
    "status": "IN_TRANSIT"
  }
}

Expected Error Responses
- 400 {"error":"valid transactionId is required"}
- 404 {"error":"transaction not found"}
- 403 {"error":"forbidden: region mismatch"}
- 400 {"error":"invalid state transition: handover requires VERIFIED"}

================================================================
Quick Gateway Index
================================================================
- POST /api/auth/register
- POST /api/auth/login
- PATCH /api/users/kyc/:id
- POST /api/search/ripple
- POST /api/escrow/lock
- POST /api/escrow/calculate
- POST /api/escrow/release
- PATCH /api/tech/verify/:transactionId
- PATCH /api/tech/handover/:transactionId
