import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../../api/endpoints";
import { useI18n } from "../../i18n/language";

export function ProfilePage() {
  const { t, tRole, tStatus } = useI18n();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.userId);
  const city = useAuthStore((state) => state.city);
  const username = useAuthStore((state) => state.username);
  const kycStatus = useAuthStore((state) => state.kycStatus);
  const setKycStatus = useAuthStore((state) => state.setKycStatus);

  const { data: myProfileData } = useQuery({
    queryKey: ["myProfile", userId],
    queryFn: getMyProfile,
    enabled: !!userId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    const liveStatus = myProfileData?.user?.kyc?.status;
    if (liveStatus) {
      setKycStatus(liveStatus);
    }
  }, [myProfileData, setKycStatus]);

  const displayName = username?.trim() || "User";
  const displayRole =
    role == "BENEFICIARY" || role == "CONTRIBUTOR" ? "CITIZEN" : role;
  const displayUserId = userId || "-";
  const displayCity = city || "-";
  const displayKycStatus =
    myProfileData?.user?.kyc?.status || kycStatus || "PENDING";
  const statusIsVerified = displayKycStatus === "VERIFIED";
  const statusBg = statusIsVerified ? "#DEF7EC" : "#FEF3C7";
  const statusText = statusIsVerified ? "#03543F" : "#9B1C1C";
  const profileInitial = displayName.charAt(0).toUpperCase() || "U";

  return (
    <div
      style={{
        padding: "32px 20px",
        maxWidth: "820px",
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827" }}>
          {t("User Profile")}
        </h1>
        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px" }}>
          {t("View your account details and keep verification up to date.")}
        </p>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "14px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 12px 28px rgba(17,24,39,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "22px 24px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "9999px",
                backgroundColor: "#DBEAFE",
                color: "#1E40AF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "700",
              }}
            >
              {profileInitial}
            </div>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                {displayName}
              </div>
              <div
                style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}
              >
                {tRole(displayRole)}
              </div>
            </div>
          </div>

          <span
            style={{
              padding: "6px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: "600",
              backgroundColor: statusBg,
              color: statusText,
              letterSpacing: "0.2px",
            }}
          >
            {t("KYC")} {tStatus(displayKycStatus)}
          </span>
        </div>

        <div
          style={{
            padding: "22px 24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          <div
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginBottom: "4px",
              }}
            >
              {t("User ID")}
            </div>
            <div
              style={{ fontSize: "15px", color: "#111827", fontWeight: "500" }}
            >
              {displayUserId}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginBottom: "4px",
              }}
            >
              {t("City")}
            </div>
            <div
              style={{ fontSize: "15px", color: "#111827", fontWeight: "500" }}
            >
              {displayCity}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginBottom: "4px",
              }}
            >
              {t("Role")}
            </div>
            <div
              style={{ fontSize: "15px", color: "#111827", fontWeight: "500" }}
            >
              {tRole(displayRole)}
            </div>
          </div>
        </div>

        {!statusIsVerified && (
          <div
            style={{
              padding: "18px 24px 24px",
              borderTop: "1px solid #E5E7EB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: "14px", color: "#4B5563", margin: 0 }}>
              {t("Complete your KYC to unlock full account access.")}
            </p>
            <button
              onClick={() => navigate("/kyc-completion")}
              style={{
                padding: "10px 14px",
                backgroundColor: "#2563EB",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "600",
                boxShadow: "0 8px 18px rgba(37,99,235,0.25)",
              }}
            >
              {t("Complete KYC Form")}
            </button>
          </div>
        )}

        {displayKycStatus === "VERIFIED" && (
          <div
            style={{
              padding: "14px 24px 20px",
              borderTop: "1px solid #E5E7EB",
            }}
          >
            <p style={{ margin: 0, color: "#065F46", fontWeight: 600 }}>
              {t("Warden has approved your KYC submission.")}
            </p>
          </div>
        )}

        {displayKycStatus === "REJECTED" && (
          <div
            style={{
              padding: "14px 24px 20px",
              borderTop: "1px solid #E5E7EB",
            }}
          >
            <p style={{ margin: 0, color: "#B91C1C", fontWeight: 600 }}>
              {t(
                "Warden rejected your KYC. Please resubmit updated documents.",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
