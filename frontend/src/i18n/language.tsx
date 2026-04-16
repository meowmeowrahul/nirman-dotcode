import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLanguage = "en" | "hi" | "mr";

type TranslationParams = Record<string, string | number>;

const STORAGE_KEY = "sahaylpg.language";

const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    Hindi: "हिंदी",
    Marathi: "मराठी",
  },
  hi: {
    "City not set": "शहर सेट नहीं है",
    "Role navigation": "भूमिका नेविगेशन",
    Status: "स्थिति",
    Profile: "प्रोफ़ाइल",
    Logout: "लॉगआउट",
    "Open notifications": "सूचनाएँ खोलें",
    Hindi: "हिंदी",
    Marathi: "मराठी",
    "Emergency LPG Request": "आपातकालीन एलपीजी अनुरोध",
    "Allow location, find verified nearby contributors, then lock escrow.":
      "लोकेशन अनुमति दें, पास के सत्यापित योगदानकर्ताओं को ढूँढें, फिर एस्क्रो लॉक करें।",
    "Step 1: Location permission": "चरण 1: लोकेशन अनुमति",
    "Geolocation is mandatory. Manual latitude/longitude entry is disabled.":
      "जियोलोकेशन अनिवार्य है। मैन्युअल अक्षांश/देशांतर प्रविष्टि बंद है।",
    "Refresh location": "लोकेशन रीफ़्रेश करें",
    "Grant location permission": "लोकेशन अनुमति दें",
    "Permission denied": "अनुमति अस्वीकृत",
    "Step 2: Ripple contributor search": "चरण 2: रिपल योगदानकर्ता खोज",
    "Urgency score (0-10)": "तत्कालता स्कोर (0-10)",
    "Searching contributors...": "योगदानकर्ता खोजे जा रहे हैं...",
    "Run ripple search": "रिपल खोज चलाएँ",
    "No listed contributors found nearby.":
      "पास में कोई सूचीबद्ध योगदानकर्ता नहीं मिला।",
    "Retry search after location refresh or increase urgency score.":
      "लोकेशन रीफ़्रेश के बाद फिर खोजें या तत्कालता स्कोर बढ़ाएँ।",
    Contributor: "योगदानकर्ता",
    Distance: "दूरी",
    "Step 3: Confirm request and lock escrow":
      "चरण 3: अनुरोध की पुष्टि करें और एस्क्रो लॉक करें",
    "If no contributor is selected, request is still broadcast as a city notification and contributors can accept later.":
      "यदि कोई योगदानकर्ता चयनित नहीं है, तो भी अनुरोध शहर सूचना के रूप में प्रसारित होगा और योगदानकर्ता बाद में स्वीकार कर सकते हैं।",
    "Selected contributor": "चयनित योगदानकर्ता",
    "Locking escrow...": "एस्क्रो लॉक हो रहा है...",
    "Confirm emergency request": "आपातकालीन अनुरोध की पुष्टि करें",
    "Escrow locked": "एस्क्रो लॉक हो गया",
    "Transaction ID": "लेन-देन आईडी",
    Notifications: "सूचनाएँ",
    "Latest updates and workflow events for your account.":
      "आपके खाते के लिए नवीनतम अपडेट और वर्कफ़्लो घटनाएँ।",
    "All notifications are read": "सभी सूचनाएँ पढ़ी जा चुकी हैं",
    "unread notification": "अपठित सूचना",
    "unread notifications": "अपठित सूचनाएँ",
    "Marking...": "चिह्नित किया जा रहा है...",
    "Mark all as read": "सभी को पढ़ा हुआ चिह्नित करें",
    "Loading notifications...": "सूचनाएँ लोड हो रही हैं...",
    "No notifications yet.": "अभी कोई सूचना नहीं है।",
    Read: "पढ़ा",
    New: "नई",
    Type: "प्रकार",
    Transaction: "लेन-देन",
    City: "शहर",
    "Page not found": "पेज नहीं मिला",
    "The page does not exist or you do not have access.":
      "पेज मौजूद नहीं है या आपके पास पहुँच नहीं है।",
    "Back to dashboard": "डैशबोर्ड पर वापस जाएँ",
    "Complete Your KYC": "अपना केवाईसी पूरा करें",
    "Upload documents and capture a live selfie to submit verification.":
      "सत्यापन जमा करने के लिए दस्तावेज़ अपलोड करें और लाइव सेल्फी लें।",
    "Required: Aadhar, PAN, and a live camera selfie.":
      "आवश्यक: आधार, पैन और लाइव कैमरा सेल्फी।",
    "Aadhar Upload": "आधार अपलोड",
    "PAN Upload": "पैन अपलोड",
    "Selfie (Live Camera Only)": "सेल्फी (केवल लाइव कैमरा)",
    "Captured selfie": "कैप्चर की गई सेल्फी",
    "Restart Camera": "कैमरा पुनः शुरू करें",
    "Start Camera": "कैमरा शुरू करें",
    "Capture Selfie": "सेल्फी कैप्चर करें",
    Cancel: "रद्द करें",
    "Submitting...": "जमा किया जा रहा है...",
    "Submit KYC": "केवाईसी जमा करें",
    "User Profile": "उपयोगकर्ता प्रोफ़ाइल",
    "View your account details and keep verification up to date.":
      "अपने खाते का विवरण देखें और सत्यापन अद्यतन रखें।",
    User: "उपयोगकर्ता",
    "User ID": "उपयोगकर्ता आईडी",
    Role: "भूमिका",
    KYC: "केवाईसी",
    "Complete your KYC to unlock full account access.":
      "पूर्ण खाता पहुँच के लिए अपना केवाईसी पूरा करें।",
    "Complete KYC Form": "केवाईसी फ़ॉर्म पूरा करें",
    "Warden has approved your KYC submission.":
      "वार्डन ने आपका केवाईसी सबमिशन स्वीकृत कर दिया है।",
    "Warden rejected your KYC. Please resubmit updated documents.":
      "वार्डन ने आपका केवाईसी अस्वीकृत किया। कृपया अपडेटेड दस्तावेज़ फिर से जमा करें।",
    "Technician Verification": "तकनीशियन सत्यापन",
    "Submit evidence and safety result for PAID_IN_ESCROW transactions.":
      "PAID_IN_ESCROW लेन-देन के लिए साक्ष्य और सुरक्षा परिणाम जमा करें।",
    "City mismatch lockout": "शहर असंगति लॉकआउट",
    "This transaction cannot be edited because your technician city does not match.":
      "यह लेन-देन संपादित नहीं किया जा सकता क्योंकि आपका तकनीशियन शहर मेल नहीं खाता।",
    "Beneficiary User ID": "लाभार्थी उपयोगकर्ता आईडी",
    "Serial number": "सीरियल नंबर",
    "Physical weight (kg)": "भौतिक वजन (किग्रा)",
    "Gross cylinder weight. Must be greater than tare.":
      "सिलेंडर का कुल वजन। यह टेयर से अधिक होना चाहिए।",
    "Tare weight (kg)": "टेयर वजन (किग्रा)",
    "Expected shell/tare range: 14.0 to 17.0 kg.":
      "अपेक्षित शेल/टेयर रेंज: 14.0 से 17.0 किग्रा।",
    "Formula: actual gas = physical weight - tare weight (must be > 0 and <= 14.2).":
      "सूत्र: वास्तविक गैस = भौतिक वजन - टेयर वजन (0 से अधिक और 14.2 से कम/बराबर होना चाहिए)।",
    "Actual gas: enter both weights": "वास्तविक गैस: दोनों वजन दर्ज करें",
    "Actual gas": "वास्तविक गैस",
    "Example valid pair: tare 14.2, physical 20.5 gives actual gas 6.3 kg.":
      "उदाहरण: टेयर 14.2, भौतिक 20.5 देने पर वास्तविक गैस 6.3 किग्रा होती है।",
    "Safety check": "सुरक्षा जाँच",
    Pass: "पास",
    Fail: "फेल",
    "Overweight flagged": "अधिक वजन चिन्हित",
    "actual_gas_kg exceeds 14.2kg capacity.":
      "actual_gas_kg 14.2 किग्रा क्षमता से अधिक है।",
    "Capped payout": "सीमित भुगतान",
    "Verifying cylinder...": "सिलेंडर सत्यापित किया जा रहा है...",
    "Verify transaction": "लेन-देन सत्यापित करें",
    "Safety failed path completed; no handover required.":
      "सुरक्षा विफल पथ पूरा; हैंडओवर आवश्यक नहीं।",
    "Proceed to Handover screen when status is VERIFIED.":
      "स्थिति VERIFIED होने पर हैंडओवर स्क्रीन पर जाएँ।",
    "Technician Handover": "तकनीशियन हैंडओवर",
    "Move only VERIFIED transactions to IN_TRANSIT.":
      "केवल VERIFIED लेन-देन को IN_TRANSIT में ले जाएँ।",
    "Processing handover...": "हैंडओवर प्रोसेस हो रहा है...",
    "Complete handover": "हैंडओवर पूरा करें",
    "Region mismatch lockout": "क्षेत्र असंगति लॉकआउट",
    "Technician region does not match transaction region.":
      "तकनीशियन क्षेत्र लेन-देन क्षेत्र से मेल नहीं खाता।",
    "Escrow Closure / Return": "एस्क्रो समापन / वापसी",
    "Calculate payout from measured gas, then release escrow with serial validation.":
      "मापी गई गैस से भुगतान की गणना करें, फिर सीरियल सत्यापन के साथ एस्क्रो जारी करें।",
    "Step 1: Calculate final payout": "चरण 1: अंतिम भुगतान की गणना करें",
    "Actual gas (kg)": "वास्तविक गैस (किग्रा)",
    "Calculating...": "गणना की जा रही है...",
    "Calculate escrow": "एस्क्रो की गणना करें",
    "Capacity exceeded. Resolve before release.":
      "क्षमता पार हो गई। जारी करने से पहले समाधान करें।",
    "Step 2: Release escrow": "चरण 2: एस्क्रो जारी करें",
    "Serial number (required when backend has expected serial)":
      "सीरियल नंबर (जब बैकएंड में अपेक्षित सीरियल हो तब आवश्यक)",
    "Releasing escrow...": "एस्क्रो जारी हो रहा है...",
    "Release escrow": "एस्क्रो जारी करें",
    "Payout summary": "भुगतान सारांश",
    "Final gas payout": "अंतिम गैस भुगतान",
    "Refund to beneficiary": "लाभार्थी को रिफंड",
    "Warden KYC Governance": "वार्डन केवाईसी प्रशासन",
    "Review user KYC and update status to PENDING, VERIFIED, or REJECTED.":
      "उपयोगकर्ता केवाईसी की समीक्षा करें और स्थिति को PENDING, VERIFIED या REJECTED में अपडेट करें।",
    "KYC status": "केवाईसी स्थिति",
    "Mongo user id": "मोंगो उपयोगकर्ता आईडी",
    "Updating status...": "स्थिति अपडेट हो रही है...",
    "Update KYC status": "केवाईसी स्थिति अपडेट करें",
    "Permission issue detected. Return to dashboard and re-login with WARDEN role.":
      "अनुमति समस्या मिली। डैशबोर्ड पर लौटें और WARDEN भूमिका से पुनः लॉगिन करें।",
    "No user found for this ID. Verify and retry safely.":
      "इस आईडी के लिए कोई उपयोगकर्ता नहीं मिला। सत्यापित करें और पुनः प्रयास करें।",
    "KYC status updated": "केवाईसी स्थिति अपडेट हुई",
    "Audit timestamp": "ऑडिट समय",
    Welcome: "स्वागत",
    "Verified Citizen": "सत्यापित नागरिक",
    "Verification Rejected": "सत्यापन अस्वीकृत",
    "Verification Pending": "सत्यापन लंबित",
    "KYC approved by warden. You now have full access.":
      "वार्डन द्वारा केवाईसी स्वीकृत। अब आपके पास पूर्ण पहुँच है।",
    "KYC rejected by warden. Update your documents and resubmit.":
      "वार्डन द्वारा केवाईसी अस्वीकृत। दस्तावेज़ अपडेट करें और फिर जमा करें।",
    "KYC submitted and awaiting warden review.":
      "केवाईसी जमा हो चुका है और वार्डन समीक्षा की प्रतीक्षा में है।",
    "Lend LPG": "एलपीजी उधार दें",
    "Have an extra cylinder? Support a neighbor in need and earn community trust credits.":
      "अतिरिक्त सिलेंडर है? ज़रूरतमंद पड़ोसी की मदद करें और सामुदायिक भरोसा क्रेडिट अर्जित करें।",
    "Lend LPG Toggle": "एलपीजी उधार टॉगल",
    ON: "चालू",
    OFF: "बंद",
    "Toggle is ON. You may be temporarily unavailable while another active transaction is in progress.":
      "टॉगल चालू है। दूसरे सक्रिय लेन-देन के दौरान आप अस्थायी रूप से अनुपलब्ध हो सकते हैं।",
    "Request LPG": "एलपीजी अनुरोध करें",
    "Running low? Broadcast a request to nearby neighbors for immediate supply assistance.":
      "गैस कम है? तुरंत सहायता के लिए पास के पड़ोसियों को अनुरोध प्रसारित करें।",
    "Post Request": "अनुरोध पोस्ट करें",
    "Escrow Lock Acknowledgements": "एस्क्रो लॉक स्वीकृतियाँ",
    "Acknowledge lock": "लॉक स्वीकार करें",
    "Acknowledging...": "स्वीकार किया जा रहा है...",
    "Nearby Emergency Request Notifications":
      "पास के आपातकालीन अनुरोध नोटिफिकेशन",
    "Checking nearby request notifications...":
      "पास के अनुरोध नोटिफिकेशन जाँचे जा रहे हैं...",
    "Beneficiary ID": "लाभार्थी आईडी",
    "Accepting...": "स्वीकार किया जा रहा है...",
    "Accept Request & Lend": "अनुरोध स्वीकार करें और उधार दें",
    "No nearby open emergency requests right now.":
      "अभी पास में कोई खुला आपातकालीन अनुरोध नहीं है।",
    "Complaint Box": "शिकायत बॉक्स",
    "Report misconduct or safety issues directly to the warden queue.":
      "दुर्व्यवहार या सुरक्षा समस्याएँ सीधे वार्डन कतार में रिपोर्ट करें।",
    "Accused User ID": "आरोपित उपयोगकर्ता आईडी",
    Category: "श्रेणी",
    Description: "विवरण",
    "Enter user ID": "उपयोगकर्ता आईडी दर्ज करें",
    "Describe what happened": "जो हुआ उसका वर्णन करें",
    "Submitting complaint...": "शिकायत जमा हो रही है...",
    "Submit Complaint": "शिकायत जमा करें",
    "My Complaint History": "मेरी शिकायत इतिहास",
    "Loading your complaints...": "आपकी शिकायतें लोड हो रही हैं...",
    "No complaints filed yet.": "अभी तक कोई शिकायत दर्ज नहीं हुई।",
    "Transaction History": "लेन-देन इतिहास",
    "View All": "सभी देखें",
    "Loading transactions...": "लेन-देन लोड हो रहे हैं...",
    Neighbor: "पड़ोसी",
    "Lent to": "उधार दिया",
    "Borrowed from": "उधार लिया",
    "Local Hub": "स्थानीय हब",
    "No recent transactions.": "कोई हालिया लेन-देन नहीं।",
    "Live Supply Map": "लाइव सप्लाई मानचित्र",
    "Active Request": "सक्रिय अनुरोध",
    "Available Contributor": "उपलब्ध योगदानकर्ता",
    "Active Hub": "सक्रिय हब",
    Verification: "सत्यापन",
    Transactions: "लेन-देन",
    Technicians: "तकनीशियन",
    "Complaint Portal": "शिकायत पोर्टल",
    "KYC Verification Review": "केवाईसी सत्यापन समीक्षा",
    "Search a user by ID to review submitted KYC documents and update verification status.":
      "जमा किए गए केवाईसी दस्तावेज़ों की समीक्षा और स्थिति अपडेट के लिए उपयोगकर्ता आईडी से खोजें।",
    "Load Application": "आवेदन लोड करें",
    "Pending KYC Queue": "लंबित केवाईसी कतार",
    "Loading pending applications...": "लंबित आवेदन लोड हो रहे हैं...",
    "No pending KYC applications for this region.":
      "इस क्षेत्र के लिए कोई लंबित केवाईसी आवेदन नहीं हैं।",
    "Loading KYC form...": "केवाईसी फ़ॉर्म लोड हो रहा है...",
    "Citizen Applicant": "नागरिक आवेदक",
    Submitted: "जमा किया गया",
    Verify: "सत्यापित करें",
    Reject: "अस्वीकार करें",
    "Mark Pending": "लंबित चिह्नित करें",
    "View Aadhaar Document": "आधार दस्तावेज़ देखें",
    "View PAN Document": "पैन दस्तावेज़ देखें",
    "View Verification Selfie": "सत्यापन सेल्फी देखें",
    "Region Transactions": "क्षेत्रीय लेन-देन",
    "List of LPG transactions between Lenders and Receivers":
      "उधारदाताओं और प्राप्तकर्ताओं के बीच एलपीजी लेन-देन की सूची",
    "Loading regional transactions...": "क्षेत्रीय लेन-देन लोड हो रहे हैं...",
    "No regional transactions found.": "कोई क्षेत्रीय लेन-देन नहीं मिला।",
    Region: "क्षेत्र",
    Tech: "टेक",
    Manual: "मैन्युअल",
    "Area Technicians": "क्षेत्र के तकनीशियन",
    "List of all available technicians in the area and their information":
      "क्षेत्र के उपलब्ध सभी तकनीशियनों और उनकी जानकारी की सूची",
    "Loading technicians...": "तकनीशियन लोड हो रहे हैं...",
    "Not rated": "रेटिंग नहीं",
    "No technicians found for this region.":
      "इस क्षेत्र के लिए कोई तकनीशियन नहीं मिला।",
    "List of complaints against Users from other Users":
      "अन्य उपयोगकर्ताओं द्वारा दर्ज शिकायतों की सूची",
    "Loading complaints...": "शिकायतें लोड हो रही हैं...",
    Report: "रिपोर्ट",
    Reporter: "रिपोर्टर",
    Accused: "आरोपित",
    Filed: "दर्ज",
    "Under Review": "समीक्षा में",
    "Review Match": "समीक्षा करें",
    "No complaints found for this region.":
      "इस क्षेत्र के लिए कोई शिकायत नहीं मिली।",
    "WARDEN CONTROL CENTER": "वार्डन नियंत्रण केंद्र",
    "Welcome Warden": "स्वागत वार्डन",
    "Active Duty": "सक्रिय ड्यूटी",
    "Role Dashboard": "भूमिका डैशबोर्ड",
    "Use the top navigation to continue your assigned workflow.":
      "अपना निर्धारित वर्कफ़्लो जारी रखने के लिए ऊपर का नेविगेशन उपयोग करें।",
    "Region ID": "क्षेत्र आईडी",
    "Create an Account": "खाता बनाएँ",
    "Government Oversight Active": "सरकारी निगरानी सक्रिय",
    Citizen: "नागरिक",
    Warden: "वार्डन",
    "FULL NAME": "पूरा नाम",
    IDENTITY: "पहचान",
    "SECURITY KEY": "सुरक्षा कुंजी",
    CITY: "शहर",
    "OMC ID": "ओएमसी आईडी",
    "Select your city": "अपना शहर चुनें",
    "Enter name as on Aadhar Card": "आधार कार्ड के अनुसार नाम दर्ज करें",
    "Mobile number or email": "मोबाइल नंबर या ईमेल",
    "Create password": "पासवर्ड बनाएँ",
    "Enter password": "पासवर्ड दर्ज करें",
    "Forgot?": "भूल गए?",
    "Registering...": "पंजीकरण हो रहा है...",
    "Complete Registration": "पंजीकरण पूरा करें",
    "Already registered?": "पहले से पंजीकृत हैं?",
    "Secure Sign In": "सुरक्षित साइन इन",
    "New to SahayLPG?": "SahayLPG पर नए हैं?",
    Create: "बनाएँ",
    Account: "खाता",
    "Signing in...": "साइन इन हो रहा है...",
    VERIFIED: "सत्यापित",
    "Govt Secure": "सरकारी सुरक्षित",
    PRIVACY: "गोपनीयता",
    "End-to-End": "एंड-टू-एंड",
    "Privacy Policy": "गोपनीयता नीति",
    "Emergency Terms": "आपातकालीन शर्तें",
    Support: "सहायता",
    "Escrow Return": "एस्क्रो वापसी",
    "The transaction is completed and empty bottle return can be acknowledged.":
      "लेन-देन पूरा हो चुका है और खाली बोतल वापसी स्वीकार की जा सकती है।",
    "Acknowledge Empty Bottle Return": "खाली बोतल वापसी स्वीकार करें",
    "Return acknowledged successfully.": "वापसी सफलतापूर्वक स्वीकार हुई।",
    "Acknowledging return": "वापसी स्वीकार नहीं की जा सकी",
    "Listing Active: Waiting for an emergency request near your location...":
      "लिस्टिंग सक्रिय: आपकी लोकेशन के पास आपातकालीन अनुरोध की प्रतीक्षा...",
    "Verify Cylinder": "सिलेंडर सत्यापित करें",
    Handover: "हैंडओवर",
    "KYC Governance": "केवाईसी प्रशासन",
    "Full name is required": "पूरा नाम आवश्यक है",
    "Enter valid mobile or email": "मान्य मोबाइल या ईमेल दर्ज करें",
    "Password is required": "पासवर्ड आवश्यक है",
    "City is required": "शहर आवश्यक है",
    "OMC ID is required": "ओएमसी आईडी आवश्यक है",
    "OMC-1234": "OMC-1234",
    "Unable to login": "लॉगिन नहीं हो सका",
    "Registration failed": "पंजीकरण विफल हुआ",
    "Transaction ID is required": "लेन-देन आईडी आवश्यक है",
    "Beneficiary user ID is required": "लाभार्थी उपयोगकर्ता आईडी आवश्यक है",
    "Serial number is required": "सीरियल नंबर आवश्यक है",
    "Verification failed": "सत्यापन विफल हुआ",
    "Handover failed": "हैंडओवर विफल हुआ",
    "Unable to calculate escrow": "एस्क्रो की गणना नहीं हो सकी",
    "Unable to release escrow": "एस्क्रो जारी नहीं हो सका",
    "Next valid step: verify the transaction first, then handover if needed.":
      "अगला सही चरण: पहले लेन-देन सत्यापित करें, फिर आवश्यकता हो तो हैंडओवर करें।",
    "Next valid step: use calculate only when status is PAID_IN_ESCROW.":
      "अगला सही चरण: गणना केवल तब करें जब स्थिति PAID_IN_ESCROW हो।",
    "Invalid KYC status selection": "अमान्य केवाईसी स्थिति चयन",
    "Unable to update Lend LPG toggle": "एलपीजी उधार टॉगल अपडेट नहीं हो सका",
    "Location unavailable. Listing is active using your saved region.":
      "लोकेशन उपलब्ध नहीं है। आपकी सहेजी गई क्षेत्र जानकारी के साथ लिस्टिंग सक्रिय है।",
    "Unable to access location": "लोकेशन तक पहुँच नहीं हो सकी",
    "Unable to load nearby notifications": "आसपास की सूचनाएँ लोड नहीं हो सकीं",
    "Unable to submit KYC": "केवाईसी जमा नहीं हो सका",
    "Unable to process KYC documents": "केवाईसी दस्तावेज़ संसाधित नहीं हो सके",
    "Unable to access camera. Please allow camera permission and try again.":
      "कैमरा एक्सेस नहीं हो सका। कृपया कैमरा अनुमति दें और फिर प्रयास करें।",
    "Failed to capture selfie. Please try again.":
      "सेल्फी कैप्चर नहीं हो सकी। कृपया फिर प्रयास करें।",
    "Aadhar upload, PAN upload, and live selfie capture are required.":
      "आधार अपलोड, पैन अपलोड और लाइव सेल्फी कैप्चर आवश्यक हैं।",
    "Unable to load notifications": "सूचनाएँ लोड नहीं हो सकीं",
    "Unable to update KYC status": "केवाईसी स्थिति अपडेट नहीं हो सकी",
    "Unable to load pending KYC queue": "लंबित केवाईसी कतार लोड नहीं हो सकी",
    "Unable to load KYC form": "केवाईसी फ़ॉर्म लोड नहीं हो सका",
    "Unable to load regional activity": "क्षेत्रीय गतिविधि लोड नहीं हो सकी",
    "Unable to load technician availability":
      "तकनीशियन उपलब्धता लोड नहीं हो सकी",
    "Unable to load complaints": "शिकायतें लोड नहीं हो सकीं",
    "Unable to lock escrow": "एस्क्रो लॉक नहीं हो सका",
    "Unable to run ripple search": "रिपल खोज नहीं चल सकी",
    "Geolocation is not supported in this browser":
      "यह ब्राउज़र जियोलोकेशन समर्थित नहीं करता",
    "Location permission denied. Enable location and retry.":
      "लोकेशन अनुमति अस्वीकृत। लोकेशन सक्षम करें और पुनः प्रयास करें।",
    "Location is required before ripple search":
      "रिपल खोज से पहले लोकेशन आवश्यक है",
    "Missing beneficiary session. Login again.":
      "लाभार्थी सत्र उपलब्ध नहीं। कृपया फिर से लॉगिन करें।",
  },
  mr: {
    "City not set": "शहर सेट केलेले नाही",
    "Role navigation": "भूमिका नेव्हिगेशन",
    Status: "स्थिती",
    Profile: "प्रोफाइल",
    Logout: "लॉगआउट",
    "Open notifications": "सूचना उघडा",
    Hindi: "हिंदी",
    Marathi: "मराठी",
    "Emergency LPG Request": "आपत्कालीन एलपीजी विनंती",
    "Allow location, find verified nearby contributors, then lock escrow.":
      "लोकेशनला परवानगी द्या, जवळचे सत्यापित योगदानकर्ते शोधा, नंतर एस्क्रो लॉक करा.",
    "Step 1: Location permission": "पायरी 1: लोकेशन परवानगी",
    "Geolocation is mandatory. Manual latitude/longitude entry is disabled.":
      "जिओलोकेशन अनिवार्य आहे. मॅन्युअल अक्षांश/रेखांश नोंद बंद आहे.",
    "Refresh location": "लोकेशन रीफ्रेश करा",
    "Grant location permission": "लोकेशन परवानगी द्या",
    "Permission denied": "परवानगी नाकारली",
    "Step 2: Ripple contributor search": "पायरी 2: रिपल योगदानकर्ता शोध",
    "Urgency score (0-10)": "तातडी गुण (0-10)",
    "Searching contributors...": "योगदानकर्ते शोधले जात आहेत...",
    "Run ripple search": "रिपल शोध चालवा",
    "No listed contributors found nearby.":
      "जवळ कोणताही सूचीबद्ध योगदानकर्ता सापडला नाही.",
    "Retry search after location refresh or increase urgency score.":
      "लोकेशन रीफ्रेशनंतर पुन्हा शोधा किंवा तातडी गुण वाढवा.",
    Contributor: "योगदानकर्ता",
    Distance: "अंतर",
    "Step 3: Confirm request and lock escrow":
      "पायरी 3: विनंतीची पुष्टी करा आणि एस्क्रो लॉक करा",
    "If no contributor is selected, request is still broadcast as a city notification and contributors can accept later.":
      "कोणताही योगदानकर्ता निवडला नाही तरी विनंती शहर सूचना म्हणून प्रसारित होईल आणि नंतर स्वीकारता येईल.",
    "Selected contributor": "निवडलेला योगदानकर्ता",
    "Locking escrow...": "एस्क्रो लॉक होत आहे...",
    "Confirm emergency request": "आपत्कालीन विनंतीची पुष्टी करा",
    "Escrow locked": "एस्क्रो लॉक झाले",
    "Transaction ID": "व्यवहार आयडी",
    Notifications: "सूचना",
    "Latest updates and workflow events for your account.":
      "तुमच्या खात्यासाठी नवीनतम अपडेट्स आणि वर्कफ्लो इव्हेंट्स.",
    "All notifications are read": "सर्व सूचना वाचल्या आहेत",
    "unread notification": "न वाचलेली सूचना",
    "unread notifications": "न वाचलेल्या सूचना",
    "Marking...": "चिन्हांकित करत आहे...",
    "Mark all as read": "सर्व वाचल्याचे चिन्हांकित करा",
    "Loading notifications...": "सूचना लोड होत आहेत...",
    "No notifications yet.": "अजून सूचना नाहीत.",
    Read: "वाचले",
    New: "नवीन",
    Type: "प्रकार",
    Transaction: "व्यवहार",
    City: "शहर",
    "Page not found": "पृष्ठ सापडले नाही",
    "The page does not exist or you do not have access.":
      "पृष्ठ अस्तित्वात नाही किंवा तुम्हाला प्रवेश नाही.",
    "Back to dashboard": "डॅशबोर्डवर परत जा",
    "Complete Your KYC": "तुमचा KYC पूर्ण करा",
    "Upload documents and capture a live selfie to submit verification.":
      "सत्यापन सादर करण्यासाठी कागदपत्रे अपलोड करा आणि लाईव्ह सेल्फी घ्या.",
    "Required: Aadhar, PAN, and a live camera selfie.":
      "आवश्यक: आधार, पॅन आणि लाईव्ह कॅमेरा सेल्फी.",
    "Aadhar Upload": "आधार अपलोड",
    "PAN Upload": "पॅन अपलोड",
    "Selfie (Live Camera Only)": "सेल्फी (फक्त लाईव्ह कॅमेरा)",
    "Captured selfie": "कॅप्चर केलेली सेल्फी",
    "Restart Camera": "कॅमेरा पुन्हा सुरू करा",
    "Start Camera": "कॅमेरा सुरू करा",
    "Capture Selfie": "सेल्फी कॅप्चर करा",
    Cancel: "रद्द करा",
    "Submitting...": "सादर करत आहे...",
    "Submit KYC": "KYC सादर करा",
    "User Profile": "वापरकर्ता प्रोफाइल",
    "View your account details and keep verification up to date.":
      "तुमचे खाते तपशील पाहा आणि सत्यापन अद्ययावत ठेवा.",
    User: "वापरकर्ता",
    "User ID": "वापरकर्ता आयडी",
    Role: "भूमिका",
    KYC: "KYC",
    "Complete your KYC to unlock full account access.":
      "पूर्ण खाते प्रवेशासाठी तुमचा KYC पूर्ण करा.",
    "Complete KYC Form": "KYC फॉर्म पूर्ण करा",
    "Warden has approved your KYC submission.":
      "वार्डनने तुमचे KYC सबमिशन मंजूर केले आहे.",
    "Warden rejected your KYC. Please resubmit updated documents.":
      "वार्डनने तुमचा KYC नाकारला. कृपया अद्ययावत कागदपत्रे पुन्हा सादर करा.",
    "Verify Cylinder": "सिलेंडर पडताळा",
    Handover: "हँडओव्हर",
    "KYC Governance": "KYC प्रशासन",
    "Full name is required": "पूर्ण नाव आवश्यक आहे",
    "Enter valid mobile or email": "वैध मोबाइल किंवा ईमेल प्रविष्ट करा",
    "Password is required": "पासवर्ड आवश्यक आहे",
    "City is required": "शहर आवश्यक आहे",
    "OMC ID is required": "OMC आयडी आवश्यक आहे",
    "OMC-1234": "OMC-1234",
    "Unable to login": "लॉगिन करता आले नाही",
    "Registration failed": "नोंदणी अयशस्वी झाली",
    "Transaction ID is required": "व्यवहार आयडी आवश्यक आहे",
    "Beneficiary user ID is required": "लाभार्थी वापरकर्ता आयडी आवश्यक आहे",
    "Serial number is required": "सिरियल नंबर आवश्यक आहे",
    "Verification failed": "पडताळणी अयशस्वी झाली",
    "Handover failed": "हँडओव्हर अयशस्वी झाला",
    "Unable to calculate escrow": "एस्क्रो गणना करता आली नाही",
    "Unable to release escrow": "एस्क्रो सोडता आला नाही",
    "Next valid step: verify the transaction first, then handover if needed.":
      "पुढची योग्य पायरी: आधी व्यवहार पडताळा, नंतर गरज असल्यास हँडओव्हर करा.",
    "Next valid step: use calculate only when status is PAID_IN_ESCROW.":
      "पुढची योग्य पायरी: स्थिती PAID_IN_ESCROW असतानाच गणना वापरा.",
    "Invalid KYC status selection": "अवैध KYC स्थिती निवड",
    "Unable to update Lend LPG toggle": "एलपीजी उधार टॉगल अपडेट करता आला नाही",
    "Location unavailable. Listing is active using your saved region.":
      "लोकेशन उपलब्ध नाही. तुमच्या जतन केलेल्या क्षेत्रासह लिस्टिंग सक्रिय आहे.",
    "Unable to access location": "लोकेशन वापरता आली नाही",
    "Unable to load nearby notifications": "जवळच्या सूचना लोड करता आल्या नाहीत",
    "Unable to submit KYC": "KYC सादर करता आला नाही",
    "Unable to process KYC documents": "KYC कागदपत्रे प्रक्रिया करता आली नाहीत",
    "Unable to access camera. Please allow camera permission and try again.":
      "कॅमेरा वापरता आला नाही. कृपया कॅमेरा परवानगी द्या आणि पुन्हा प्रयत्न करा.",
    "Failed to capture selfie. Please try again.":
      "सेल्फी कॅप्चर करता आली नाही. कृपया पुन्हा प्रयत्न करा.",
    "Aadhar upload, PAN upload, and live selfie capture are required.":
      "आधार अपलोड, पॅन अपलोड आणि लाईव्ह सेल्फी कॅप्चर आवश्यक आहे.",
    "Unable to load notifications": "सूचना लोड करता आल्या नाहीत",
    "Unable to update KYC status": "KYC स्थिती अपडेट करता आली नाही",
    "Unable to load pending KYC queue": "प्रलंबित KYC यादी लोड करता आली नाही",
    "Unable to load KYC form": "KYC फॉर्म लोड करता आला नाही",
    "Unable to load regional activity":
      "प्रादेशिक क्रियाकलाप लोड करता आला नाही",
    "Unable to load technician availability":
      "तंत्रज्ञ उपलब्धता लोड करता आली नाही",
    "Unable to load complaints": "तक्रारी लोड करता आल्या नाहीत",
    "Unable to lock escrow": "एस्क्रो लॉक करता आले नाही",
    "Unable to run ripple search": "रिपल शोध चालवता आला नाही",
    "Geolocation is not supported in this browser":
      "या ब्राउझरमध्ये जिओलोकेशन उपलब्ध नाही",
    "Location permission denied. Enable location and retry.":
      "लोकेशन परवानगी नाकारली. लोकेशन सक्षम करून पुन्हा प्रयत्न करा.",
    "Location is required before ripple search":
      "रिपल शोधापूर्वी लोकेशन आवश्यक आहे",
    "Missing beneficiary session. Login again.":
      "लाभार्थी सेशन उपलब्ध नाही. कृपया पुन्हा लॉगिन करा.",
    "Warden KYC Governance": "वार्डन KYC प्रशासन",
    "Review user KYC and update status to PENDING, VERIFIED, or REJECTED.":
      "वापरकर्त्याचा KYC पाहून स्थिती PENDING, VERIFIED किंवा REJECTED मध्ये अपडेट करा.",
    "KYC status": "KYC स्थिती",
    "Mongo user id": "मोंगो वापरकर्ता आयडी",
    "Updating status...": "स्थिती अपडेट करत आहे...",
    "Update KYC status": "KYC स्थिती अपडेट करा",
    "Permission issue detected. Return to dashboard and re-login with WARDEN role.":
      "परवानगी समस्या आढळली. डॅशबोर्डवर परत जा आणि WARDEN भूमिकेत पुन्हा लॉगिन करा.",
    "No user found for this ID. Verify and retry safely.":
      "या आयडीसाठी वापरकर्ता सापडला नाही. पडताळा आणि पुन्हा सुरक्षितपणे प्रयत्न करा.",
    "KYC status updated": "KYC स्थिती अपडेट झाली",
    "Audit timestamp": "ऑडिट वेळ",
    Welcome: "स्वागत",
    "Verified Citizen": "सत्यापित नागरिक",
    "Verification Rejected": "पडताळणी नाकारली",
    "Verification Pending": "पडताळणी प्रलंबित",
    "KYC approved by warden. You now have full access.":
      "वार्डनने KYC मंजूर केले आहे. आता तुम्हाला पूर्ण प्रवेश आहे.",
    "KYC rejected by warden. Update your documents and resubmit.":
      "वार्डनने KYC नाकारले. कागदपत्रे अपडेट करून पुन्हा सादर करा.",
    "KYC submitted and awaiting warden review.":
      "KYC सादर झाले असून वार्डन पडताळणीची प्रतीक्षा आहे.",
    "Lend LPG": "एलपीजी उधार द्या",
    "Have an extra cylinder? Support a neighbor in need and earn community trust credits.":
      "अतिरिक्त सिलेंडर आहे? गरजू शेजाऱ्याला मदत करा आणि समुदाय विश्वास गुण मिळवा.",
    "Lend LPG Toggle": "एलपीजी उधार टॉगल",
    ON: "चालू",
    OFF: "बंद",
    "Toggle is ON. You may be temporarily unavailable while another active transaction is in progress.":
      "टॉगल चालू आहे. दुसरा सक्रिय व्यवहार सुरू असताना तुम्ही तात्पुरते अनुपलब्ध असू शकता.",
    "Request LPG": "एलपीजी विनंती करा",
    "Running low? Broadcast a request to nearby neighbors for immediate supply assistance.":
      "गॅस कमी आहे? त्वरित मदतीसाठी जवळच्या शेजाऱ्यांना विनंती पाठवा.",
    "Post Request": "विनंती पोस्ट करा",
    "Escrow Lock Acknowledgements": "एस्क्रो लॉक पुष्टीकरणे",
    "Acknowledge lock": "लॉक पुष्टी करा",
    "Acknowledging...": "पुष्टी करत आहे...",
    "Nearby Emergency Request Notifications": "जवळच्या आपत्कालीन विनंती सूचना",
    "Checking nearby request notifications...":
      "जवळच्या विनंती सूचना तपासत आहे...",
    "Beneficiary ID": "लाभार्थी आयडी",
    "Accepting...": "स्वीकारत आहे...",
    "Accept Request & Lend": "विनंती स्वीकारा आणि उधार द्या",
    "No nearby open emergency requests right now.":
      "सध्या जवळ कोणतीही उघडी आपत्कालीन विनंती नाही.",
    "Complaint Box": "तक्रार पेटी",
    "Report misconduct or safety issues directly to the warden queue.":
      "गैरवर्तन किंवा सुरक्षा समस्या थेट वार्डन यादीत नोंदवा.",
    "Accused User ID": "आरोपी वापरकर्ता आयडी",
    Category: "प्रकार",
    Description: "वर्णन",
    "Enter user ID": "वापरकर्ता आयडी टाका",
    "Describe what happened": "काय झाले ते लिहा",
    "Submitting complaint...": "तक्रार सादर करत आहे...",
    "Submit Complaint": "तक्रार सादर करा",
    "My Complaint History": "माझ्या तक्रारींचा इतिहास",
    "Loading your complaints...": "तुमच्या तक्रारी लोड होत आहेत...",
    "No complaints filed yet.": "अजून तक्रारी नोंदलेल्या नाहीत.",
    "Transaction History": "व्यवहार इतिहास",
    "View All": "सर्व पहा",
    "Loading transactions...": "व्यवहार लोड होत आहेत...",
    Neighbor: "शेजारी",
    "Lent to": "उधार दिले",
    "Borrowed from": "उधार घेतले",
    "Local Hub": "स्थानिक केंद्र",
    "No recent transactions.": "अलीकडील व्यवहार नाहीत.",
    "Live Supply Map": "लाईव्ह पुरवठा नकाशा",
    "Active Request": "सक्रिय विनंती",
    "Available Contributor": "उपलब्ध योगदानकर्ता",
    "Active Hub": "सक्रिय केंद्र",
    Verification: "पडताळणी",
    Transactions: "व्यवहार",
    Technicians: "तंत्रज्ञ",
    "Complaint Portal": "तक्रार पोर्टल",
    "KYC Verification Review": "KYC पडताळणी पुनरावलोकन",
    "Search a user by ID to review submitted KYC documents and update verification status.":
      "सादर केलेल्या KYC कागदपत्रांचे पुनरावलोकन करण्यासाठी वापरकर्ता आयडीने शोधा.",
    "Load Application": "अर्ज लोड करा",
    "Pending KYC Queue": "प्रलंबित KYC यादी",
    "Loading pending applications...": "प्रलंबित अर्ज लोड होत आहेत...",
    "No pending KYC applications for this region.":
      "या क्षेत्रात प्रलंबित KYC अर्ज नाहीत.",
    "Loading KYC form...": "KYC फॉर्म लोड होत आहे...",
    "Citizen Applicant": "नागरिक अर्जदार",
    Submitted: "सादर केले",
    Verify: "पडताळा",
    Reject: "नकार द्या",
    "Mark Pending": "प्रलंबित ठेवा",
    "View Aadhaar Document": "आधार दस्तऐवज पहा",
    "View PAN Document": "पॅन दस्तऐवज पहा",
    "View Verification Selfie": "पडताळणी सेल्फी पहा",
    "Region Transactions": "प्रादेशिक व्यवहार",
    "List of LPG transactions between Lenders and Receivers":
      "उधार देणारे आणि घेणारे यांच्यातील एलपीजी व्यवहारांची यादी",
    "Loading regional transactions...": "प्रादेशिक व्यवहार लोड होत आहेत...",
    "No regional transactions found.": "प्रादेशिक व्यवहार आढळले नाहीत.",
    Region: "प्रदेश",
    Tech: "तंत्रज्ञ",
    Manual: "मॅन्युअल",
    "Area Technicians": "क्षेत्रातील तंत्रज्ञ",
    "List of all available technicians in the area and their information":
      "क्षेत्रातील सर्व उपलब्ध तंत्रज्ञ आणि त्यांची माहिती",
    "Loading technicians...": "तंत्रज्ञ लोड होत आहेत...",
    "Not rated": "रेटिंग नाही",
    "No technicians found for this region.":
      "या क्षेत्रासाठी तंत्रज्ञ सापडले नाहीत.",
    "List of complaints against Users from other Users":
      "इतर वापरकर्त्यांनी केलेल्या तक्रारींची यादी",
    "Loading complaints...": "तक्रारी लोड होत आहेत...",
    Report: "अहवाल",
    Reporter: "तक्रारदार",
    Accused: "आरोपी",
    Filed: "नोंदवले",
    "Under Review": "पुनरावलोकनात",
    "Review Match": "पुनरावलोकन जुळवा",
    "No complaints found for this region.":
      "या क्षेत्रासाठी तक्रारी आढळल्या नाहीत.",
    "WARDEN CONTROL CENTER": "वार्डन नियंत्रण केंद्र",
    "Welcome Warden": "स्वागत वार्डन",
    "Active Duty": "सक्रिय ड्युटी",
    "Role Dashboard": "भूमिका डॅशबोर्ड",
    "Use the top navigation to continue your assigned workflow.":
      "तुमचा दिलेला कार्यप्रवाह सुरू ठेवण्यासाठी वरचे नेव्हिगेशन वापरा.",
    "Region ID": "प्रदेश आयडी",
    "Create an Account": "खाते तयार करा",
    "Government Oversight Active": "शासकीय देखरेख सक्रिय",
    Citizen: "नागरिक",
    Warden: "वार्डन",
    "FULL NAME": "पूर्ण नाव",
    IDENTITY: "ओळख",
    "SECURITY KEY": "सुरक्षा कळ",
    CITY: "शहर",
    "OMC ID": "OMC आयडी",
    "Select your city": "तुमचे शहर निवडा",
    "Enter name as on Aadhar Card": "आधार कार्डवरील नाव टाका",
    "Mobile number or email": "मोबाइल नंबर किंवा ईमेल",
    "Create password": "पासवर्ड तयार करा",
    "Enter password": "पासवर्ड टाका",
    "Forgot?": "विसरलात?",
    "Registering...": "नोंदणी करत आहे...",
    "Complete Registration": "नोंदणी पूर्ण करा",
    "Already registered?": "आधीच नोंदणीकृत आहात?",
    "Secure Sign In": "सुरक्षित साइन इन",
    "New to SahayLPG?": "SahayLPG मध्ये नवीन आहात?",
    Create: "तयार करा",
    Account: "खाते",
    "Signing in...": "साइन इन करत आहे...",
    VERIFIED: "सत्यापित",
    "Govt Secure": "शासकीय सुरक्षित",
    PRIVACY: "गोपनीयता",
    "End-to-End": "एंड-टू-एंड",
    "Privacy Policy": "गोपनीयता धोरण",
    "Emergency Terms": "आपत्कालीन अटी",
    Support: "मदत",
    "Escrow Return": "एस्क्रो परतावा",
    "The transaction is completed and empty bottle return can be acknowledged.":
      "व्यवहार पूर्ण झाला आहे आणि रिकाम्या बाटलीचा परतावा मान्य करता येईल.",
    "Acknowledge Empty Bottle Return": "रिकामी बाटली परतावा मान्य करा",
    "Return acknowledged successfully.": "परतावा यशस्वीपणे मान्य झाला.",
    "Acknowledging return": "परतावा मान्य करता आला नाही",
    "Listing Active: Waiting for an emergency request near your location...":
      "लिस्टिंग सक्रिय: तुमच्या ठिकाणाजवळ आपत्कालीन विनंतीची वाट पाहत आहे...",
  },
};

const roleLabels: Record<string, Record<"hi" | "mr", string>> = {
  BENEFICIARY: { hi: "लाभार्थी", mr: "लाभार्थी" },
  CONTRIBUTOR: { hi: "योगदानकर्ता", mr: "योगदानकर्ता" },
  TECHNICIAN: { hi: "तकनीशियन", mr: "तंत्रज्ञ" },
  WARDEN: { hi: "वार्डन", mr: "वार्डन" },
  CITIZEN: { hi: "नागरिक", mr: "नागरिक" },
};

const statusLabels: Record<string, Record<"hi" | "mr", string>> = {
  PENDING: { hi: "लंबित", mr: "प्रलंबित" },
  VERIFIED: { hi: "सत्यापित", mr: "सत्यापित" },
  REJECTED: { hi: "अस्वीकृत", mr: "नाकारले" },
  COMPLETED: { hi: "पूर्ण", mr: "पूर्ण" },
  IN_TRANSIT: { hi: "परिवहन में", mr: "मार्गावर" },
  PAID_IN_ESCROW: { hi: "एस्क्रो में भुगतान", mr: "एस्क्रोमध्ये पेमेंट" },
  PENDING_WARDEN_REVIEW: {
    hi: "वार्डन समीक्षा लंबित",
    mr: "वार्डन पडताळणी प्रलंबित",
  },
  CANCELLED: { hi: "रद्द", mr: "रद्द" },
  IDLE: { hi: "निष्क्रिय", mr: "निष्क्रिय" },
  ACTIVE_CONTRIBUTOR: { hi: "सक्रिय योगदानकर्ता", mr: "सक्रिय योगदानकर्ता" },
  ACTIVE_BENEFICIARY: { hi: "सक्रिय लाभार्थी", mr: "सक्रिय लाभार्थी" },
  UNDER_REVIEW: { hi: "समीक्षा में", mr: "पडताळणीत" },
  LISTED: { hi: "सूचीबद्ध", mr: "सूचीबद्ध" },
  AVAILABLE: { hi: "उपलब्ध", mr: "उपलब्ध" },
  BUSY: { hi: "व्यस्त", mr: "व्यस्त" },
};

const categoryLabels: Record<string, Record<"hi" | "mr", string>> = {
  OVERPRICING: { hi: "अधिक मूल्य", mr: "जास्त दर" },
  MISCONDUCT: { hi: "दुर्व्यवहार", mr: "गैरवर्तन" },
  SAFETY: { hi: "सुरक्षा", mr: "सुरक्षा" },
  FRAUD: { hi: "धोखाधड़ी", mr: "फसवणूक" },
  OTHER: { hi: "अन्य", mr: "इतर" },
};

function applyParams(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{${key}}}`, String(value));
  }, template);
}

export function getStoredLanguage(): AppLanguage {
  const fromStorage = localStorage.getItem(STORAGE_KEY);
  if (fromStorage === "en" || fromStorage === "hi" || fromStorage === "mr") {
    return fromStorage;
  }
  return "en";
}

export function translateStatic(
  text: string,
  params?: TranslationParams,
): string {
  const lang = getStoredLanguage();
  const translated = translations[lang][text] ?? text;
  return applyParams(translated, params);
}

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (text: string, params?: TranslationParams) => string;
  tRole: (value: string | null | undefined) => string;
  tStatus: (value: string | null | undefined) => string;
  tCategory: (value: string | null | undefined) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(() =>
    getStoredLanguage(),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (text, params) =>
        applyParams(translations[language][text] ?? text, params),
      tRole: (value) => {
        if (!value) {
          return "-";
        }
        if (language === "en") {
          return value;
        }
        return roleLabels[value]?.[language] ?? value;
      },
      tStatus: (value) => {
        if (!value) {
          return "-";
        }
        if (language === "en") {
          return value;
        }
        return statusLabels[value]?.[language] ?? value;
      },
      tCategory: (value) => {
        if (!value) {
          return "-";
        }
        if (language === "en") {
          return value;
        }
        return categoryLabels[value]?.[language] ?? value;
      },
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
