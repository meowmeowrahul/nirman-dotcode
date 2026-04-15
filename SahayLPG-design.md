# **SahayLPG \- UI/UX Design Specification**

**Project:** SahayLPG

**Theme:** Light, Trustworthy, Accessible

**Target Audience:** Frontend Developers, UI/UX Designers, AI Integration Engineers

## **1\. Design System & Theming**

Given the platform's nature (emergency utility, government oversight, community trust), the UI utilizes a clean, "Light Shade" color scheme prioritizing readability, accessibility, and calmness during emergencies.

### **1.1. Color Palette**

* **Backgrounds:** \* App Background: \#F8FAFC (Light Slate)  
  * Card/Surface: \#FFFFFF (Pure White)  
* **Primary Accents (Trust & Actions):**  
  * Primary Brand: \#2563EB (Royal Blue)  
  * Secondary Brand: \#60A5FA (Soft Blue)  
* **Semantic Colors (States):**  
  * Emergency/Urgent (Need LPG): \#EF4444 (Soft Red) or \#F97316 (Orange)  
  * Safe/Verified (List LPG): \#10B981 (Emerald Green)  
  * Warning/Pending: \#F59E0B (Amber)  
* **Text & Typography:**  
  * Primary Text: \#1E293B (Dark Slate)  
  * Secondary Text: \#64748B (Cool Gray)  
  * Font Family: Inter or Roboto (Clean, sans-serif, high legibility).

### **1.2. Global Components**

* **Cards:** Slightly rounded corners (rounded-xl), soft drop shadows (shadow-sm or shadow-md on hover) to create depth on the light background.  
* **Buttons:** Solid filled for primary actions, outlined for secondary. Large touch targets (min 44px height) for accessibility on mobile devices.  
* **Modals:** White overlays with a 50% opacity slate backdrop (bg-slate-900/50).

## **2\. Authentication & Onboarding Screens**

### **2.1. Login / Signup Screen**

* **Layout:** Centered card on a light blue gradient background.  
* **Elements:**  
  * SecureLPG Logo.  
  * Role Selector toggle: "Citizen" vs "Warden" 

### **2.2. KYC Verification Screen (Citizen)**

* **Context:** Users must complete this before accessing the main dashboard.  
* **Elements:**  
  * **Status Banner:** "KYC Pending" (Amber) or "Action Required" (Red).  
  * **Upload Zones:** Two distinct dashed-border boxes for Aadhar Card and PAN Card.  
  * **Selfie:** To add selfie of User for verification , file upload is not allowed only capture real-time  
  * **Security Notice:** "Your data is encrypted and only visible to your regional government Warden." (Builds trust).  
  * **Submit Button:** Disabled until both files are uploaded.

## **3\. Citizen (Base User) Screens**

### **3.1. Citizen Main Dashboard**

* **Layout:** Bottom navigation bar for mobile (Home, Requests, Profile). Top app bar with user profile and regional community name (e.g., "Kothrud Region, Pune").  
* **Elements:**  
  * **Header:** Welcome message \+ KYC Status Badge (Green "Verified" allows actions).  
  * **Hero Section (Split Actions):**  
    * **Action 1 (Tenant):** Large, prominent Red/Orange button: **"Request LPG".**  
    * **Action 2 (Lender):** Large Green button: **"Lend LPG"**.  
  * **Recent Activity:** Small card showing recent successful community shares to build social proof.

### **3.2. Emergency Request Screen (Tenant Flow \- AI Wrappers 2 & 3\)**

* **Layout:** Focused, distraction-free screen.  
* **Elements:**  
  * **Input Area:** \* Large text area: "Describe your situation..."  
    * **Microphone Button:** Prominent floating action button for **Voice Input** (Triggers AI Wrapper 3: Vernacular Voice-to-Action).  
  * **AI Processing State (UI Feedback):**  
    * When voice/text is submitted, a pulsing skeleton loader appears: *"AI is translating and analyzing urgency..."*  
  * **Match Radar (The "Ripple Effect" UI):**  
    * A map view centered on the user.  
    * A pulsing blue circle overlay starting at **500m**.  
    * **Timer/Status:** "Searching nearby neighbors (500m)... expanding in 5:00".  
    * *If AI Wrapper 2 scores urgency \> 7:* UI instantly shows: *"High Urgency Detected. Expanding search to 2km immediately."* The circle expands in a fluid animation.

### **3.3. List LPG Screen (Lender Flow \- AI Wrapper 1\)**

* **Layout:** Step-by-step form.  
* **Elements:**  
  * **Camera Viewport:** Prominent area to capture the LPG cylinder.  
  * **Guidance Overlay:** An outline showing where to align the cylinder's "Expiry Ring" and "Valve Seal".  
  * **AI Verification State:** \* Spinner: *"Analyzing cylinder safety and expiry..."*  
    * **Success Card:** Green checkmark showing extracted data {"Expiry": "B-26", "Seal": "Intact"}.  
    * **Rejection Card:** Red alert if AI flags the cylinder as expired or tampered, blocking submission.

### **3.4. Match & Transaction Screen**

* **Context:** When a match is found between Tenant and Lender.  
* **Elements:**  
  * **Lender UI:** "Incoming Request\! neighbor 300m away needs gas for infant." \-\> \[Accept\] / \[Decline\].  
  * **Tenant UI:** "Match Found\! Ravi (300m away) has accepted."  
  * **Exchange Code:** A 4-digit secure pin to verify the physical handover.

## **4\. Warden (Administrator) Screens**

### **4.1. Warden Regional Dashboard**

* **Layout:** Desktop-first sidebar layout. Light gray sidebar, white main content area.  
* **Elements:**  
  * **Top Bar:** Warden Name, Assigned Region ID Tag (e.g., Region: MH-PUN-014).  
  * **KPI Cards:** "Pending KYCs", "Active Emergency Requests", "Total Cylinders Shared Today".  
  * **Live Map (Socket.io feed):** A real-time map restricted by warden.assigned\_region\_id polygon. Shows pulsing dots where active Ripple Effect searches are happening, and green lines connecting matched Lenders and Tenants.

### **4.2. KYC Verification Queue**

* **Layout:** Data table view.  
* **Elements:**  
  * **List:** Rows of Citizens with kyc\_status \== PENDING.  
  * **Detail Panel (Slide-out or Modal):**  
    * Shows decrypted Aadhar and PAN images.  
    * Buttons: **\[Approve KYC\]**, **\[Reject & Flag\]**.

### **4.3. Audit & Immutable Log Screen**

* **Layout:** Secure, uneditable ledger view.  
* **Elements:**  
  * Table listing all completed transactions.  
  * Columns: Date/Time, Lender ID, Tenant ID, AI Vision Log (Proof of cylinder validity), Exchange PIN used.  
  * **Action:** \[Flag Transaction\] (If suspicious behavior like repeated lending from one user is detected, implying black-market sales).

## **5\. Real-Time Interactions (UI/UX Motion)**

* **WebSocket Pings:** When a Tenant requests LPG, online Lenders in the radius receive a "Toast Notification" that slides down from the top center with an attention-grabbing (but not alarming) chime sound.  
* **Ripple Expansion:** The map UI for the Tenant must smoothly animate the radius expansion from 500m \-\> 2km \-\> 5km to provide visual feedback that the system is actively working.  
* **AI States:** Always use skeleton loaders or contextual text (e.g., "Reading expiry code...") rather than generic spinners when AI wrappers are being called, to set correct user expectations regarding latency.