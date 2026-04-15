import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export function ProfilePage() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.userId);
  const regionId = useAuthStore((state) => state.regionId);
  const username = useAuthStore((state) => state.username);
  const kycStatus = useAuthStore((state) => state.kycStatus);

  const displayName = username?.trim() || "User";
  const displayRole = role || "-";
  const displayUserId = userId || "-";
  const displayRegionId = regionId || "-";
  const displayKycStatus = kycStatus || "PENDING";

  return (
    <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}
      >
        User Profile
      </h1>

      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              color: "#6B7280",
              marginBottom: "4px",
            }}
          >
            Name
          </label>
          <div style={{ fontSize: "16px", fontWeight: "500" }}>
            {displayName}
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              color: "#6B7280",
              marginBottom: "4px",
            }}
          >
            User ID
          </label>
          <div style={{ fontSize: "16px" }}>{displayUserId}</div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              color: "#6B7280",
              marginBottom: "4px",
            }}
          >
            Role
          </label>
          <div style={{ fontSize: "16px" }}>{displayRole}</div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              color: "#6B7280",
              marginBottom: "4px",
            }}
          >
            Region ID
          </label>
          <div style={{ fontSize: "16px" }}>{displayRegionId}</div>
        </div>

        <div
          style={{
            marginBottom: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "14px",
              color: "#6B7280",
              marginBottom: "8px",
            }}
          >
            KYC Status
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: "500",
                backgroundColor:
                  displayKycStatus === "VERIFIED" ? "#DEF7EC" : "#FEF3C7",
                color: displayKycStatus === "VERIFIED" ? "#03543F" : "#9B1C1C",
              }}
            >
              {displayKycStatus}
            </span>

            {displayKycStatus !== "VERIFIED" && (
              <button
                onClick={() => navigate("/kyc-completion")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#2563EB",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Complete KYC Form
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
