import { useI18n } from "../../i18n/language";
import { Link } from "react-router-dom";

export function EmergencyTermsPage() {
  const { t } = useI18n();

  return (
    <div style={{ padding: "32px 20px", maxWidth: "820px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link to="/" style={{ color: "#2563EB", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
          &larr; {t("Back")}
        </Link>
      </div>
      <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", marginBottom: "16px" }}>
        {t("Emergency Terms")}
      </h1>
      <div style={{ backgroundColor: "white", borderRadius: "14px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 12px 28px rgba(17,24,39,0.06)" }}>
        <p style={{ fontSize: "15px", color: "#4B5563", lineHeight: "1.6", marginBottom: "16px" }}>
          Emergency requests must only be made in genuine situations where an LPG cylinder is urgently required.
        </p>
        <p style={{ fontSize: "15px", color: "#4B5563", lineHeight: "1.6", marginBottom: "16px" }}>
          By accepting assistance, you agree to the escrow conditions and understand that replacing the cylinder is mandatory with the assigned technician's physical verification.
        </p>
        <p style={{ fontSize: "15px", color: "#4B5563", lineHeight: "1.6" }}>
          Misuse of the SahayLPG emergency system may result in immediate suspension and penal action.
        </p>
      </div>
    </div>
  );
}
