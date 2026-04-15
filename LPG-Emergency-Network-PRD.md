# **Product Requirements Document (PRD)**

**Project Name:** SahayLPG (Community-Based Emergency LPG Sharing Platform)

**Target Audience:** Engineering AI Agents, Backend Developers, System Architects

**System Paradigm:** High-Trust Closed-Network Marketplace with Geospatial Event Sourcing.

## **1\. System Overview & Objective**

A secure, community-verified web platform enabling households to lend/borrow LPG cylinders during emergencies. To circumvent legal/safety liabilities, the system operates strictly within verified regional networks overseen by government-assigned Wardens. The core matching engine uses a dynamic-radius geospatial query (Ripple Effect), augmented by three specific AI microservices to automate safety compliance, urgency triage, and vernacular accessibility.

## **2\. Role-Based Access Control (RBAC) & User Entities**

### **2.1. Citizen Entity (Base User)**

Citizens are the primary end-users residing in a specific geo-fenced community.

- **Attributes:** user_id, name, phone, location_coords (GeoJSON Point), region_id, kyc_status (Enum: PENDING, VERIFIED, REJECTED).
- **KYC Requirement:** Must upload Aadhar Card and PAN Card. Cannot engage in platform transactions until kyc_status \== VERIFIED.
- **Sub-Roles (Contextual based on action):**
  - **Tenant (Requester):** Triggers the emergency geospatial query. Submits requests for LPG via text or voice.
  - **Lender (Supplier):** Lists surplus LPGs. Receives WebSocket pings when a nearby Tenant triggers a request. Approves the transaction.

### **2.2. Warden / Officer Entity**

Government-assigned regional administrators.

- **Attributes:** warden_id, assigned_region_id (Polygon bounding box), clearance_level.
- **Constraints:** Can ONLY access, read, or modify data where Entity.region_id \== Warden.assigned_region_id.
- **Responsibilities:**
  1. **KYC Verification:** Review Aadhar/PAN uploads and toggle Citizen kyc_status.
  2. **Transaction Monitoring:** View real-time logs of all LPG transfers (Lender \<-\> Tenant) within their region to prevent hoarding or black-market selling.
  3. **Dispute Resolution/Flagging:** Can freeze Citizen accounts for suspicious activity.

## **3\. Core Workflows & Logic**

### **3.1. The "Ripple Effect" Matching Engine (Backend Geospatial Logic)**

- **Trigger:** Tenant initiates a valid LPG request.
- **Execution:**
  1. **Phase 1 (T=0s):** Query MongoDB $geoNear for verified Citizens with active_listings within a **500m radius**.
  2. **Phase 2 (T=5mins):** If no Lender accepts, automatically expand radius to **2km**.
  3. **Phase 3 (T=15mins):** Expand radius to **5km**.
- **Notification:** Trigger Socket.io events to push immediate UI alerts to Lenders falling within the active radius.

### **3.2. Listing an LPG (Lender Flow)**

- **Trigger:** Verified Citizen wants to list an available cylinder.
- **Requirement:** Must upload an image of the physical cylinder showing the Expiry Ring (e.g., "B-26") and Valve Seal.
- **Validation:** Processed strictly through AI Wrapper \#1 (Vision API).

## **4\. AI Microservice Integrations (Contracts for AI Agents)**

### **4.1. AI Wrapper 1: Vision-Based Safety Verification**

- **Purpose:** Ensure cylinders listed by Lenders are legally safe to use and not expired.
- **Input Payload:** Base64 Image of LPG cylinder.
- **System Prompt Directive:** "Extract the painted expiry code (A, B, C, D followed by a 2-digit year) from the cylinder ring. Analyze the valve seal for tampering. Current date is \[Date\]. Evaluate if expired."
- **Expected Output (JSON):**  
  {  
   "is_valid": boolean,  
   "expiry_code_detected": "string",  
   "seal_intact": boolean,  
   "rejection_reason": "string | null"  
  }

- **System Action:** If is_valid \== false, block the listing.

### **4.2. AI Wrapper 2: Context-Aware Triage (LLM)**

- **Purpose:** Dynamically adjust the "Ripple Effect" matching engine based on emergency severity.
- **Input Payload:** User text prompt (e.g., "Cooking for infant, gas ran out suddenly").
- **System Prompt Directive:** "Analyze the context of this LPG outage. Score urgency from 1-10. Score \> 7 requires immediate wide-radius broadcast."
- **Expected Output (JSON):**  
  {  
   "urgency_score": integer,  
   "bypass_initial_radius": boolean,  
   "context_summary": "string"  
  }

- **System Action:** If bypass_initial_radius \== true, the backend instantly skips the 500m phase and broadcasts to 2km/5km to save time.

### **4.3. AI Wrapper 3: Vernacular Voice-to-Action**

- **Purpose:** frictionless emergency triggering via voice.
- **Input Payload:** Audio blob (various Indian languages).
- **Pipeline:** 1\. Whisper API (or equivalent) \-\> Transcript.  
  2\. LLM Intent Parser.
- **System Prompt Directive:** "Extract user intent for LPG request. Translate to English. Extract location context if mentioned."
- **Expected Output (JSON):**  
  {  
   "action_type": "CREATE_EMERGENCY_REQUEST",  
   "translated_text": "string",  
   "extracted_landmarks": \["string"\]  
  }

## **5\. System Architecture & Tech Stack Details**

- **Database:** MongoDB (Crucial for Geospatial indexes: 2dsphere).
- **Backend:** Node.js / Express.js.
- **Real-time Layer:** Socket.io (for instant Lender pings and Warden monitoring dashboards).
- **Frontend:** React.js (Component architecture required for Citizens vs. Warden Dashboard).
- **Storage:** AWS S3 or equivalent for storing KYC documents (encrypted) and Cylinder images.
- **AI Providers:** OpenAI / Gemini API (for LLM and Vision tasks).

## **6\. Security & Compliance Constraints (Strict Rules for Code Generators)**

1. **Data Isolation:** All database queries generated for the Warden dashboard MUST explicitly include a WHERE region_id \= warden.assigned_region_id clause.
2. **PII Encryption:** Aadhar and PAN card data must not be exposed to other Citizens. Only Wardens have read-access to PII.
3. **Transaction Immutability:** Once a Lender-Tenant transaction is completed, it must be written to an immutable log collection for Warden auditing.
