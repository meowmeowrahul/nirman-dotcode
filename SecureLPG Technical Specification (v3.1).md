# **Backend Technical Specification: SecureLPG (v3.1)**

**System Paradigm:** Government-Supervised Emergency LPG Exchange.

**Goal:** Zero-hallucination, legally-airtight P2P asset transfer with physical verification.

## **1\. Core Entities & Role-Based Access Control (RBAC)**

| Role | Description | Key Permissions |
| :---- | :---- | :---- |
| **BENEFICIARY** | Citizen in emergency. | CREATE\_REQUEST, MAKE\_ESCROW\_PAYMENT, ACKNOWLEDGE\_RECEIPT |
| **CONTRIBUTOR** | Citizen providing surplus. | LIST\_CYLINDER, REDEEM\_REIMBURSEMENT |
| **TECHNICIAN** | Field agent (Gov-certified). | VERIFY\_BOTTLE\_WEIGHT, EXECUTE\_SAFETY\_CHECK, START\_TRANSFER |
| **WARDEN** | Regional Govt Officer. | AUTHORIZE\_TRANSFER, SET\_REGIONAL\_PRICING, MONITOR\_LOGS |

## **2\. Database Schemas (MongoDB \- Crucial)**

### **2.1 User Collection**

{  
  "\_id": "ObjectId",  
  "role": "BENEFICIARY | CONTRIBUTOR | TECHNICIAN | WARDEN",  
  "kyc": {  
    "status": "PENDING | VERIFIED | REJECTED",  
    "omc\_id": "STRING\_SV\_NUMBER", // Mandatory for Citizens  
    "masked\_aadhar": "string"  
  },  
  "region\_id": "STRING\_CODE",  
  "location": { "type": "Point", "coordinates": \[lng, lat\] },  
  "active\_transaction": "ObjectId | null"   
}

### **2.2 Transaction Collection (The Immutable Log)**

{  
  "\_id": "ObjectId",  
  "beneficiary\_id": "ObjectId",  
  "contributor\_id": "ObjectId",  
  "technician\_id": "ObjectId | null",  
  "status": "REQUESTED | PAID\_IN\_ESCROW | TECH\_ASSIGNED | VERIFIED | IN\_TRANSIT | COMPLETED",  
  "escrow": {  
    "gas\_value\_deposited": 950.00, // Max buffer (price of full 14.2kg)  
    "metal\_security\_deposit": 2000.00, // REFUNDABLE deposit for the physical bottle  
    "service\_fee": 150.00, // Non-refundable technician/platform fee  
    "final\_gas\_payout": "Decimal128", // Calculated: (Actual\_Gas / 14.2) \* Rate  
    "refund\_to\_beneficiary": "Decimal128" // (Gas\_Value\_Deposited \- Final\_Gas\_Payout) \+ Metal\_Deposit (eventually)  
  },  
  "cylinder\_evidence": {  
    "serial\_number": "string",  
    "initial\_weight\_kg": "float",  
    "tare\_weight": "float",  
    "safety\_photo\_url": "S3\_URL"  
  },  
  "timestamps": { "created": "ISO", "verified": "ISO", "closed": "ISO" }  
}

## **3\. The "Technician-Verified" Workflow**

### **Step 1: Emergency Trigger & Max-Buffer Payment**

* **Action:** Beneficiary hits POST /api/emergency/request and pays the **Total Escrow** (₹3100).  
* **Why ₹3100?** \* ₹950 (Full Gas Buffer)  
  * ₹2000 (Bottle Security)  
  * ₹150 (Service Fee).  
* **Note:** We take the "Full Gas" price upfront so the Contributor is guaranteed payment even if the cylinder is 100% full.

### **Step 2: Dispatch & Proportional Calculation**

* **Action:** Technician visits Contributor. Inputs physical\_weight and tare\_weight.  
* **Calculation:** Actual\_Gas \= physical\_weight \- tare\_weight  
  Final\_Gas\_Price \= (Actual\_Gas / 14.2) \* 950  
* **System Action:** If Actual\_Gas is only 7.1kg (half-full), the system immediately flags a **₹475 refund** to be sent to the Beneficiary later.

### **Step 3: Handover & Transit**

* **Action:** Status \-\> IN\_TRANSIT. Technician delivers the bottle.  
* **Escrow State:** The ₹2000 Metal Deposit stays "Locked" in the platform.

### **Step 4: The "Close-Loop" Return**

* **The Rule:** The Beneficiary is essentially "borrowing" the metal and "buying" the gas.  
* **Closing:** When the Beneficiary returns the **empty metal bottle** to the Contributor:  
  1. Contributor clicks "Acknowledge Return."  
  2. Backend releases the **₹2000 Metal Deposit** back to the Beneficiary.  
  3. Backend releases the **calculated Gas Payout** to the Contributor.  
  4. Beneficiary has only spent: Final\_Gas\_Price \+ Service\_Fee.

## **4\. AI's New Role (Anomaly & Fraud Detection)**

* **Task:** Weight Verification Cross-Check.  
* **Logic:** AI Wrapper \#1 analyzes the Technician's photo of the scale. If the OCR-read weight on the scale differs from the Technician's manual entry by \> 200g, the transaction is auto-flagged for Warden review.

## **5\. Security & Legal Constraints**

1. **Anti-Hoarding:** No user can have more than one active\_transaction involving a "Security Deposit" at a time.  
2. **Technician GPS Log:** Every weight entry must be timestamped with a GPS coordinate matching the Contributor's registered address.