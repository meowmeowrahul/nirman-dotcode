import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export function ProfilePage() {
  const navigate = useNavigate();
  // Assuming KYC Status isn't easily grabbed from auth store since 'user' isn't on AuthState, let's use what we have or mock it.
  const role = useAuthStore((state) => state.role);
  const user = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: role,
    customClaims: { kycStatus: "PENDING" },
  }; // Mocking user details for UI flow

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
            {user?.firstName} {user?.lastName}
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
            Email
          </label>
          <div style={{ fontSize: "16px" }}>{user?.email}</div>
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
          <div style={{ fontSize: "16px" }}>{user?.role}</div>
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
                  user?.customClaims?.kycStatus === "VERIFIED"
                    ? "#DEF7EC"
                    : "#FEF3C7",
                color:
                  user?.customClaims?.kycStatus === "VERIFIED"
                    ? "#03543F"
                    : "#9B1C1C",
              }}
            >
              {user?.customClaims?.kycStatus || "PENDING"}
            </span>

            {user?.customClaims?.kycStatus !== "VERIFIED" && (
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
