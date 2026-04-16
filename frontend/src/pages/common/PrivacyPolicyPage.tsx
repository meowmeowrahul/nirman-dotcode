import { useI18n } from "../../i18n/language";
import { Link } from "react-router-dom";

export function PrivacyPolicyPage() {
  const { t } = useI18n();

  return (
    <div style={{ padding: "32px 20px", maxWidth: "820px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link to="/" style={{ color: "#2563EB", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
          &larr; {t("Back")}
        </Link>
      </div>
      <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", marginBottom: "16px" }}>
        {t("Privacy Policy")}
      </h1>
      <div style={{ backgroundColor: "white", borderRadius: "14px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 12px 28px rgba(17,24,39,0.06)" }}>
        <p style={{ fontSize: "15px", color: "#4B5563", lineHeight: "1.6", marginBottom: "16px" }}>
          Your privacy is important to us. SahayLPG is committed to protecting the privacy and security of our users.
        </p>
        <p style={{ fontSize: "15px", color: "#4B5563", lineHeight: "1.6", marginBottom: "16px" }}>
          We collect personal data such as your name, contact information, and address solely for the purpose of facilitating LPG cylinder sharing and resolving emergencies efficiently.
        </p>
        <p style={{ fontSize: "15px", color: "#4B5563", lineHeight: "1.6" }}>
          Your data is encrypted and securely stored. We do not sell your personal information to third parties.
        </p>
      </div>
    </div>
  );
}
