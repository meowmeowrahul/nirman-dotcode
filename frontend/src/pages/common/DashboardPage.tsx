import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ArrowRightLeft,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useTransactionStore } from "../../store/transactionStore";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";
import { ActiveListing } from "../../components/ActiveListing";
import { EscrowReturn } from "../../components/EscrowReturn";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acknowledgeContributorLock,
  acceptOpenContributorRequest,
  createComplaint,
  getContributorNotifications,
  setContributorListingToggle,
  getMyContributorListingStatus,
  getMyComplaints,
  getMyProfile,
  getComplaints,
  getLiveMapData,
  getPendingKycForms,
  getRegionalActivity,
  getTechnicianAvailability,
  getUserTransactions,
  getWardenKycForm,
  updateMyLocation,
  updateComplaintStatus,
  updateKycStatus,
} from "../../api/endpoints";
import { formatDistanceToNow } from "date-fns";
import { getApiErrorMessage } from "../../api/error";
import type { KycStatus } from "../../types/domain";
import { useI18n } from "../../i18n/language";

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => reject(new Error("Location permission denied")),
    );
  });
}

interface WardenAlertEvent {
  alert_id: string;
  transaction_id: string | null;
  combined_risk_score: number;
  flags: string[];
  review_status: string;
  review_reason: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeSocketTarget(rawValue?: string): string | undefined {
  if (!rawValue) {
    return undefined;
  }

  const trimmedValue = rawValue.trim();
  if (!trimmedValue || /[<>]/.test(trimmedValue)) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    const sanitizedPath = parsedUrl.pathname.replace(/\/api\/?$/, "");
    parsedUrl.pathname = sanitizedPath || "/";
    parsedUrl.search = "";
    parsedUrl.hash = "";
    return parsedUrl.toString().replace(/\/$/, "");
  } catch (_error) {
    return undefined;
  }
}

function resolveSocketBaseUrl(): string | undefined {
  const backendTarget = import.meta.env.VITE_BACKEND_TARGET as
    | string
    | undefined;
  const normalizedBackendTarget = normalizeSocketTarget(backendTarget);
  if (normalizedBackendTarget) {
    return normalizedBackendTarget;
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const normalizedApiBaseUrl = normalizeSocketTarget(apiBaseUrl);
  if (normalizedApiBaseUrl) {
    return normalizedApiBaseUrl;
  }

  return undefined;
}

export function DashboardPage() {
  const { t, tRole, tStatus, tCategory } = useI18n();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.userId);
  const city = useAuthStore((state) => state.city);
  const regionId = useAuthStore((state) => state.regionId);
  const username = useAuthStore((state) => state.username);
  const kycStatus = useAuthStore((state) => state.kycStatus);
  const setKycStatus = useAuthStore((state) => state.setKycStatus);
  const setUserStatus = useTransactionStore((state) => state.setUserStatus);
  const activeTransaction = useTransactionStore(
    (state) => state.activeTransaction,
  );
  const setActiveTransaction = useTransactionStore(
    (state) => state.setActiveTransaction,
  );
  const navigate = useNavigate();
  const welcomeName = username?.trim() || t("User");

  const [wardenTab, setWardenTab] = useState("VERIFICATION");
  const [kycLookupInput, setKycLookupInput] = useState("");
  const [kycLookupTarget, setKycLookupTarget] = useState<string | null>(null);
  const [kycActionError, setKycActionError] = useState<string | null>(null);
  const [listingError, setListingError] = useState<string | null>(null);
  const [listingNotice, setListingNotice] = useState<string | null>(null);
  const [complaintAccusedId, setComplaintAccusedId] = useState("");
  const [complaintCategory, setComplaintCategory] = useState<
    "OVERPRICING" | "MISCONDUCT" | "SAFETY" | "FRAUD" | "OTHER"
  >("OTHER");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintCreateError, setComplaintCreateError] = useState<
    string | null
  >(null);
  const [isComplaintBoxOpen, setIsComplaintBoxOpen] = useState(false);
  const [wardenAlerts, setWardenAlerts] = useState<WardenAlertEvent[]>([]);
  const [showMockAlerts, setShowMockAlerts] = useState(false);
  const [alertsConnectionState, setAlertsConnectionState] = useState<
    "CONNECTING" | "CONNECTED" | "DISCONNECTED"
  >("DISCONNECTED");

  const dummyWardenAlerts: WardenAlertEvent[] = [
    {
      alert_id: "mock-warden-alert-001",
      transaction_id: "680101010101010101010101",
      combined_risk_score: 88,
      flags: ["MANUAL_WARDEN_REVIEW_REQUIRED", "GEMINI_TIMEOUT"],
      review_status: "OPEN",
      review_reason: "Gemini: AI call timed out",
      source: "GEMINI_TIMEOUT_FALLBACK",
      created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    },
    {
      alert_id: "mock-warden-alert-002",
      transaction_id: "680202020202020202020202",
      combined_risk_score: 79,
      flags: ["COLLUSION_PATTERN_DETECTED", "PAIRING_14D_GT_3"],
      review_status: "UNDER_REVIEW",
      review_reason: "High combined risk score from FraudGuard",
      source: "GEMINI_FLASH",
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      alert_id: "mock-warden-alert-003",
      transaction_id: null,
      combined_risk_score: 80,
      flags: ["MANUAL_WARDEN_REVIEW_REQUIRED", "VOICE_AI_FAILURE"],
      review_status: "OPEN",
      review_reason:
        "Sarvam parsing provider fallback used for emergency request",
      source: "SARVAM_FALLBACK",
      created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    },
  ];

  const visibleWardenAlerts = showMockAlerts ? dummyWardenAlerts : wardenAlerts;

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", userId],
    queryFn: () => getUserTransactions(userId!),
    enabled: !!userId,
    refetchInterval: 5000,
  });

  const {
    data: contributorNotificationData,
    isLoading: contributorNotificationsLoading,
    error: contributorNotificationsError,
  } = useQuery({
    queryKey: ["contributorNotifications", userId],
    queryFn: getContributorNotifications,
    enabled: role === "CONTRIBUTOR",
    refetchInterval: 4000,
  });

  const { data: contributorListingData } = useQuery({
    queryKey: ["myContributorListing", userId],
    queryFn: getMyContributorListingStatus,
    enabled: role === "CONTRIBUTOR" || role === "BENEFICIARY",
    refetchInterval: 4000,
    retry: false,
  });

  const {
    data: myComplaintData,
    isLoading: myComplaintsLoading,
    refetch: refetchMyComplaints,
  } = useQuery({
    queryKey: ["myComplaints", userId],
    queryFn: getMyComplaints,
    enabled: role === "BENEFICIARY" || role === "CONTRIBUTOR",
  });

  const { data: myProfileData } = useQuery({
    queryKey: ["myProfile", userId],
    queryFn: getMyProfile,
    enabled: !!userId && (role === "BENEFICIARY" || role === "CONTRIBUTOR"),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const liveStatus = myProfileData?.user?.kyc?.status;
    if (liveStatus) {
      setKycStatus(liveStatus);
    }
  }, [myProfileData, setKycStatus]);

  const effectiveKycStatus = myProfileData?.user?.kyc?.status || kycStatus;

  useEffect(() => {
    if (role !== "WARDEN") {
      return;
    }

    const socket = io(resolveSocketBaseUrl(), {
      withCredentials: true,
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setAlertsConnectionState("CONNECTED");
    });

    socket.on("disconnect", () => {
      setAlertsConnectionState("DISCONNECTED");
    });

    socket.on("connect_error", () => {
      setAlertsConnectionState("DISCONNECTED");
    });

    socket.on("WARDEN_ALERT", (payload: Partial<WardenAlertEvent>) => {
      if (!payload?.alert_id) {
        return;
      }

      const nowIso = new Date().toISOString();
      const normalizedAlert: WardenAlertEvent = {
        alert_id: String(payload.alert_id),
        transaction_id: payload.transaction_id
          ? String(payload.transaction_id)
          : null,
        combined_risk_score: Number.isFinite(
          Number(payload.combined_risk_score),
        )
          ? Math.max(0, Math.min(100, Number(payload.combined_risk_score)))
          : 0,
        flags: Array.isArray(payload.flags)
          ? payload.flags.map((flag) => String(flag))
          : [],
        review_status: payload.review_status
          ? String(payload.review_status)
          : "OPEN",
        review_reason: payload.review_reason
          ? String(payload.review_reason)
          : null,
        source: payload.source ? String(payload.source) : null,
        created_at: payload.created_at ? String(payload.created_at) : nowIso,
        updated_at: payload.updated_at
          ? String(payload.updated_at)
          : payload.created_at
            ? String(payload.created_at)
            : nowIso,
      };

      setWardenAlerts((previousAlerts) => {
        const deduplicatedAlerts = previousAlerts.filter(
          (item) => item.alert_id !== normalizedAlert.alert_id,
        );
        return [normalizedAlert, ...deduplicatedAlerts].slice(0, 50);
      });
    });

    return () => {
      socket.disconnect();
      setAlertsConnectionState("DISCONNECTED");
    };
  }, [role]);

  const { data: mapData } = useQuery({
    queryKey: ["liveMap", city],
    queryFn: () => getLiveMapData(city || undefined),
  });

  const {
    data: regionalActivity,
    isLoading: regionalActivityLoading,
    error: regionalActivityError,
  } = useQuery({
    queryKey: ["wardenRegionalActivity", city],
    queryFn: getRegionalActivity,
    enabled: role === "WARDEN",
  });

  const {
    data: wardenKycForm,
    isLoading: wardenKycLoading,
    error: wardenKycError,
    refetch: refetchWardenKyc,
  } = useQuery({
    queryKey: ["wardenKycForm", kycLookupTarget],
    queryFn: () => getWardenKycForm(kycLookupTarget!),
    enabled: role === "WARDEN" && !!kycLookupTarget,
  });

  const {
    data: pendingKycData,
    isLoading: pendingKycLoading,
    error: pendingKycError,
  } = useQuery({
    queryKey: ["pendingKycForms", city],
    queryFn: () => getPendingKycForms(city || undefined),
    enabled: role === "WARDEN" && wardenTab === "VERIFICATION",
    retry: false,
  });

  const updateKycMutation = useMutation({
    mutationFn: (payload: { userId: string; status: KycStatus }) =>
      updateKycStatus(payload.userId, payload.status),
    onSuccess: async () => {
      setKycActionError(null);
      await refetchWardenKyc();
    },
    onError: (error) => {
      setKycActionError(
        getApiErrorMessage(error, t("Unable to update KYC status")),
      );
    },
  });

  const {
    data: technicianData,
    isLoading: technicianLoading,
    error: technicianError,
  } = useQuery({
    queryKey: ["technicianAvailability", city],
    queryFn: () => getTechnicianAvailability(city || undefined),
    enabled: role === "WARDEN" && wardenTab === "TECHNICIANS",
    retry: false,
  });

  const {
    data: complaintData,
    isLoading: complaintLoading,
    error: complaintError,
    refetch: refetchComplaints,
  } = useQuery({
    queryKey: ["complaints", city],
    queryFn: () => getComplaints({ city: city || undefined }),
    enabled: role === "WARDEN" && wardenTab === "COMPLAINTS",
    retry: false,
  });

  const complaintStatusMutation = useMutation({
    mutationFn: (complaintId: string) =>
      updateComplaintStatus(complaintId, "UNDER_REVIEW"),
    onSuccess: async () => {
      await refetchComplaints();
    },
  });

  const contributorAckMutation = useMutation({
    mutationFn: acknowledgeContributorLock,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["contributorNotifications", userId],
        }),
      ]);
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: acceptOpenContributorRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["contributorNotifications", userId],
        }),
        queryClient.invalidateQueries({ queryKey: ["transactions", userId] }),
      ]);
    },
  });

  const createComplaintMutation = useMutation({
    mutationFn: createComplaint,
    onSuccess: async () => {
      setComplaintCreateError(null);
      setComplaintAccusedId("");
      setComplaintDescription("");
      setComplaintCategory("OTHER");
      await refetchMyComplaints();
    },
    onError: (error) => {
      setComplaintCreateError(
        getApiErrorMessage(error, t("Unable to submit complaint")),
      );
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: updateMyLocation,
  });

  const listingToggleMutation = useMutation({
    mutationFn: setContributorListingToggle,
    onSuccess: () => {
      setListingError(null);
      queryClient.invalidateQueries({
        queryKey: ["myContributorListing", userId],
      });
    },
    onError: (error) => {
      setListingError(
        getApiErrorMessage(error, t("Unable to update Lend LPG toggle")),
      );
      setUserStatus("IDLE");
    },
  });

  useEffect(() => {
    if (!txData?.transactions || !userId) {
      return;
    }

    const contributorTx = txData.transactions.find(
      (tx: any) =>
        tx?.contributor?.id === userId &&
        ["PAID_IN_ESCROW", "VERIFIED", "IN_TRANSIT"].includes(tx?.status),
    );
    setActiveTransaction(contributorTx || null);

    if (contributorTx) {
      setUserStatus("IDLE");
    }
  }, [txData, userId, setActiveTransaction]);

  useEffect(() => {
    if (role !== "CONTRIBUTOR" && role !== "BENEFICIARY") {
      return;
    }

    const toggleEnabled = Boolean(
      contributorListingData?.listing?.toggle_enabled,
    );
    const listingStatus = contributorListingData?.listing?.status;
    if (toggleEnabled && listingStatus === "LISTED" && !activeTransaction) {
      setUserStatus("ACTIVE_CONTRIBUTOR");
      return;
    }

    if (!activeTransaction) {
      setUserStatus("IDLE");
    }
  }, [role, contributorListingData, activeTransaction, setUserStatus]);

  const isContributorListed =
    contributorListingData?.listing?.status === "LISTED";
  const isLendToggleEnabled = Boolean(
    contributorListingData?.listing?.toggle_enabled,
  );

  const handleLendLpgToggle = async (enabled: boolean) => {
    if (listingToggleMutation.isPending) {
      return;
    }

    setListingError(null);
    setListingNotice(null);

    try {
      if (!enabled) {
        await listingToggleMutation.mutateAsync({ enabled: false });
        setUserStatus("IDLE");
        return;
      }

      setUserStatus("ACTIVE_CONTRIBUTOR");
      let coords: { lat: number; lng: number } | null = null;

      try {
        coords = await getCurrentLocation();
      } catch (_error) {
        setListingNotice(
          t("Location unavailable. Listing is active using your saved region."),
        );
      }

      if (coords) {
        await updateLocationMutation.mutateAsync(coords);
      }

      await listingToggleMutation.mutateAsync({
        enabled: true,
        lat: coords?.lat,
        lng: coords?.lng,
        city: city || regionId || undefined,
      });
    } catch (error) {
      setUserStatus("IDLE");
      setListingNotice(null);
      setListingError(
        getApiErrorMessage(error, t("Unable to access location")),
      );
    }
  };

  const handleRequestLpgClick = () => {
    setUserStatus("ACTIVE_BENEFICIARY");
    navigate("/beneficiary/requests");
  };

  // We are creating the unified Citizen dashboard if role is BENEFICIARY or CONTRIBUTOR
  if (role === "BENEFICIARY" || role === "CONTRIBUTOR") {
    return (
      <div
        className="citizen-dashboard"
        style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
      >
        <header className="dashboard-header">
          <p
            className="oversight-text"
            style={{ fontSize: "0.8rem", color: "#2E7D32", fontWeight: 600 }}
          >
            {t("Government Oversight Active")}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: "4px 0", fontSize: "2rem" }}>
              {t("Welcome")} {welcomeName}
            </h1>
            {effectiveKycStatus === "VERIFIED" ? (
              <StatusChip label={t("Verified Citizen")} tone="success" />
            ) : effectiveKycStatus === "REJECTED" ? (
              <StatusChip label={t("Verification Rejected")} tone="error" />
            ) : (
              <StatusChip label={t("Verification Pending")} tone="warning" />
            )}
          </div>
        </header>

        {(role === "BENEFICIARY" || role === "CONTRIBUTOR") &&
          effectiveKycStatus !== "VERIFIED" && (
            <section className="card" style={{ padding: "0.9rem 1rem" }}>
              {effectiveKycStatus === "REJECTED" && (
                <p style={{ margin: 0, color: "#b91c1c", fontWeight: 600 }}>
                  {t(
                    "KYC rejected by warden. Update your documents and resubmit.",
                  )}
                </p>
              )}
              {effectiveKycStatus === "PENDING" && (
                <p style={{ margin: 0, color: "#92400e", fontWeight: 600 }}>
                  {t("KYC submitted and awaiting warden review.")}
                </p>
              )}
            </section>
          )}

        <section
          className="dashboard-actions"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
          }}
        >
          {/* Lend LPG */}
          <div
            className="action-card lend-card"
            style={{
              backgroundColor: "#059669",
              color: "white",
              padding: "2rem",
              borderRadius: 4,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <h2 style={{ fontSize: "1.75rem", margin: "0 0 1rem 0" }}>
              {t("Lend LPG")}
            </h2>
            <p
              style={{
                maxWidth: "250px",
                opacity: 0.9,
                marginBottom: "1rem",
                lineHeight: "1.4",
              }}
            >
              {t(
                "Have an extra cylinder? Support a neighbor in need and earn community trust credits.",
              )}
            </p>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
                fontWeight: 700,
                cursor: listingToggleMutation.isPending
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isLendToggleEnabled}
                onChange={(event) => {
                  handleLendLpgToggle(event.target.checked);
                }}
                disabled={listingToggleMutation.isPending}
                style={{
                  width: 18,
                  height: 18,
                  accentColor: "#0f172a",
                }}
              />
              <span>
                {t("Lend LPG Toggle")}:{" "}
                {isLendToggleEnabled ? t("ON") : t("OFF")}
              </span>
            </label>

            {isLendToggleEnabled && (
              <ActiveListing isLoading={listingToggleMutation.isPending} />
            )}

            {isLendToggleEnabled && !isContributorListed && (
              <p
                style={{
                  marginTop: "0.75rem",
                  color: "#D1FAE5",
                  fontWeight: 600,
                }}
              >
                {t(
                  "Toggle is ON. You may be temporarily unavailable while another active transaction is in progress.",
                )}
              </p>
            )}
            {listingError && (
              <p
                style={{
                  marginTop: "0.75rem",
                  color: "#FEE2E2",
                  fontWeight: 600,
                }}
              >
                {listingError}
              </p>
            )}
            {listingNotice && (
              <p
                style={{
                  marginTop: "0.75rem",
                  color: "#D1FAE5",
                  fontWeight: 600,
                }}
              >
                {listingNotice}
              </p>
            )}
          </div>

          {/* Request LPG */}
          <div
            className="action-card request-card"
            style={{
              backgroundColor: "#1E3A8A",
              color: "white",
              padding: "2rem",
              borderRadius: 4,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <h2 style={{ fontSize: "1.75rem", margin: "0 0 1rem 0" }}>
              {t("Request LPG")}
            </h2>
            <p
              style={{
                maxWidth: "250px",
                opacity: 0.9,
                marginBottom: "2rem",
                lineHeight: "1.4",
              }}
            >
              {t(
                "Running low? Broadcast a request to nearby neighbors for immediate supply assistance.",
              )}
            </p>
            <button
              onClick={handleRequestLpgClick}
              style={{
                backgroundColor: "white",
                color: "#1E3A8A",
                padding: "0.75rem 1.5rem",
                borderRadius: 4,
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {t("Post Request")} <span aria-hidden="true">&#9873;</span>
            </button>
          </div>
        </section>

        {activeTransaction?.status === "COMPLETED" &&
          activeTransaction?.contributor?.id === userId && (
            <EscrowReturn
              transaction={activeTransaction}
              onAcknowledgeSuccess={() => {
                setUserStatus("IDLE");
              }}
            />
          )}

        {role === "CONTRIBUTOR" &&
          contributorNotificationData?.notifications?.some(
            (item) => item.type === "LOCK_ACK_REQUIRED",
          ) && (
            <section className="card stack" style={{ padding: "1rem" }}>
              <h3 style={{ marginTop: 0 }}>
                {t("Escrow Lock Acknowledgements")}
              </h3>
              {contributorNotificationData.notifications
                .filter((item) => item.type === "LOCK_ACK_REQUIRED")
                .map((item) => (
                  <div
                    key={`ack-${item.transaction_id}`}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: "0.85rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600 }}>
                      {item.message}
                    </p>
                    <p className="mono" style={{ marginTop: 0 }}>
                      {t("Transaction ID")}: {item.transaction_id}
                    </p>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() =>
                        contributorAckMutation.mutate(item.transaction_id)
                      }
                      disabled={contributorAckMutation.isPending}
                    >
                      {contributorAckMutation.isPending
                        ? t("Acknowledging...")
                        : t("Acknowledge lock")}
                    </button>
                  </div>
                ))}
            </section>
          )}

        {role === "CONTRIBUTOR" && (
          <section className="card stack" style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>
              {t("Nearby Emergency Request Notifications")}
            </h3>
            {contributorNotificationsLoading && (
              <p className="muted-text" style={{ margin: 0 }}>
                {t("Checking nearby request notifications...")}
              </p>
            )}
            {!contributorNotificationsLoading &&
              contributorNotificationsError && (
                <p className="error-banner">
                  {getApiErrorMessage(
                    contributorNotificationsError,
                    t("Unable to load nearby notifications"),
                  )}
                </p>
              )}
            {!contributorNotificationsLoading &&
              !contributorNotificationsError &&
              (contributorNotificationData?.notifications?.filter(
                (item) => item.type === "OPEN_REQUEST_BROADCAST",
              ).length ? (
                contributorNotificationData.notifications
                  .filter((item) => item.type === "OPEN_REQUEST_BROADCAST")
                  .map((request) => (
                    <div
                      key={request.transaction_id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: "0.85rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600 }}>
                        {request.message}
                      </p>
                      <p className="mono" style={{ margin: "0 0 0.35rem 0" }}>
                        {t("Transaction ID")}: {request.transaction_id}
                      </p>
                      <p
                        className="muted-text"
                        style={{ margin: "0 0 0.25rem 0" }}
                      >
                        {t("Beneficiary ID")}:{" "}
                        {request.beneficiary_user_id || "N/A"}
                      </p>
                      <p
                        className="muted-text"
                        style={{ margin: "0 0 0.6rem 0" }}
                      >
                        {t("City")}: {request.city || city || "N/A"}
                      </p>
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() =>
                          acceptRequestMutation.mutate(request.transaction_id)
                        }
                        disabled={acceptRequestMutation.isPending}
                      >
                        {acceptRequestMutation.isPending
                          ? t("Accepting...")
                          : t("Accept Request & Lend")}
                      </button>
                    </div>
                  ))
              ) : (
                <p className="muted-text" style={{ margin: 0 }}>
                  {t("No nearby open emergency requests right now.")}
                </p>
              ))}
          </section>
        )}

        <section
          className="dashboard-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
          }}
        >
          <div
            className="card"
            style={{
              padding: "1.5rem",
              borderRadius: "1rem",
              backgroundColor: "white",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                {t("Transaction History")}
              </h3>
              <a
                href="#"
                style={{
                  color: "#ED6C02",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                }}
              >
                {t("View All")}
              </a>
            </div>
            <div
              className="transaction-list"
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {txLoading ? (
                <p style={{ color: "#666" }}>{t("Loading transactions...")}</p>
              ) : txData?.transactions && txData.transactions.length > 0 ? (
                txData.transactions.slice(0, 5).map((tx: any) => {
                  const isLent = tx.contributor?.id === userId;
                  const partnerName = isLent
                    ? tx.beneficiary?.email ||
                      tx.beneficiary?.phone ||
                      t("Neighbor")
                    : tx.contributor?.email ||
                      tx.contributor?.phone ||
                      t("Neighbor");
                  const timeAgo = formatDistanceToNow(
                    new Date(tx.created_at || new Date()),
                    { addSuffix: true },
                  );

                  return (
                    <div
                      key={tx.id}
                      className="transaction-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: "1rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: isLent ? "#E8F5E9" : "#FFF3E0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isLent ? "💸" : "🚚"}
                        </div>
                        <div>
                          <p
                            style={{
                              margin: "0 0 0.2rem 0",
                              fontWeight: "bold",
                            }}
                          >
                            {isLent
                              ? `${t("Lent to")} ${partnerName}`
                              : `${t("Borrowed from")} ${partnerName}`}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.8rem",
                              color: "#666",
                            }}
                          >
                            {timeAgo} •{" "}
                            {tx.city || tx.region_id || t("Local Hub")}
                          </p>
                        </div>
                      </div>
                      <StatusChip
                        label={tStatus(tx.status)}
                        tone={tx.status === "COMPLETED" ? "success" : "pending"}
                      />
                    </div>
                  );
                })
              ) : (
                <p style={{ color: "#666" }}>{t("No recent transactions.")}</p>
              )}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: "1.5rem",
              borderRadius: "1rem",
              backgroundColor: "white",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>
              {t("Live Supply Map")}
            </h3>
            <div
              style={{
                flexGrow: 1,
                minHeight: "300px",
                borderRadius: "0.5rem",
                overflow: "hidden",
              }}
            >
              <MapContainer
                center={[18.5204, 73.8567]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {mapData &&
                  mapData.active_requests &&
                  mapData.active_requests.map((req: any) => (
                    <Marker
                      key={`req-${req.transaction_id}`}
                      position={[req.lat, req.lng]}
                    >
                      <Popup>
                        <b>{t("Active Request")}</b>
                        <br />
                        {t("Status")}: {tStatus(req.status)}
                      </Popup>
                    </Marker>
                  ))}

                {mapData &&
                  mapData.available_contributors &&
                  mapData.available_contributors.map((contrib: any) => (
                    <Marker
                      key={`contrib-${contrib.user_id}`}
                      position={[contrib.lat, contrib.lng]}
                    >
                      <Popup>
                        <b>{t("Available Contributor")}</b>
                      </Popup>
                    </Marker>
                  ))}

                {/* Default Pune marker if no data */}
                {(!mapData ||
                  (!mapData.active_requests?.length &&
                    !mapData.available_contributors?.length)) && (
                  <Marker position={[18.5204, 73.8567]}>
                    <Popup>
                      Pune <br /> {t("Active Hub")}
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
        </section>

        {(role === "BENEFICIARY" || role === "CONTRIBUTOR") && (
          <section
            className="card stack"
            style={{ padding: "0", overflow: "hidden" }}
          >
            <div
              style={{
                padding: "1rem",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
              onClick={() => setIsComplaintBoxOpen(!isComplaintBoxOpen)}
            >
              <div>
                <h3 style={{ margin: 0 }}>{t("Complaint Box")}</h3>
                <p className="muted-text" style={{ margin: "0.25rem 0 0 0" }}>
                  {t(
                    "Report misconduct or safety issues directly to the warden queue.",
                  )}
                </p>
              </div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "0.25rem",
                }}
                aria-label={isComplaintBoxOpen ? t("Close") : t("Open")}
              >
                {isComplaintBoxOpen ? (
                  <ChevronUp size={24} />
                ) : (
                  <ChevronDown size={24} />
                )}
              </button>
            </div>

            {isComplaintBoxOpen && (
              <div
                style={{ padding: "0 1rem 1rem 1rem", marginTop: "-0.5rem" }}
                className="stack"
              >
                <div className="stack" style={{ gap: "0.65rem" }}>
                  <label className="field">
                    <span>{t("Accused User ID")}</span>
                    <input
                      value={complaintAccusedId}
                      onChange={(event) =>
                        setComplaintAccusedId(event.target.value)
                      }
                      placeholder={t("Enter user ID")}
                    />
                  </label>
                  <label className="field">
                    <span>{t("Category")}</span>
                    <select
                      value={complaintCategory}
                      onChange={(event) =>
                        setComplaintCategory(
                          event.target.value as
                            | "OVERPRICING"
                            | "MISCONDUCT"
                            | "SAFETY"
                            | "FRAUD"
                            | "OTHER",
                        )
                      }
                    >
                      <option value="OVERPRICING">
                        {tCategory("OVERPRICING")}
                      </option>
                      <option value="MISCONDUCT">
                        {tCategory("MISCONDUCT")}
                      </option>
                      <option value="SAFETY">{tCategory("SAFETY")}</option>
                      <option value="FRAUD">{tCategory("FRAUD")}</option>
                      <option value="OTHER">{tCategory("OTHER")}</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>{t("Description")}</span>
                    <textarea
                      value={complaintDescription}
                      onChange={(event) =>
                        setComplaintDescription(event.target.value)
                      }
                      rows={3}
                      placeholder={t("Describe what happened")}
                    />
                  </label>
                </div>
                {complaintCreateError && (
                  <p className="error-banner">{complaintCreateError}</p>
                )}
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setComplaintCreateError(null);
                    createComplaintMutation.mutate({
                      accused_user_id: complaintAccusedId.trim(),
                      category: complaintCategory,
                      description: complaintDescription.trim(),
                    });
                  }}
                  disabled={createComplaintMutation.isPending}
                >
                  {createComplaintMutation.isPending
                    ? t("Submitting complaint...")
                    : t("Submit Complaint")}
                </button>

                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "0.75rem",
                    marginTop: "1rem",
                  }}
                >
                  <h4 style={{ margin: "0 0 0.5rem 0" }}>
                    {t("My Complaint History")}
                  </h4>
                  {myComplaintsLoading && (
                    <p className="muted-text" style={{ margin: 0 }}>
                      {t("Loading your complaints...")}
                    </p>
                  )}
                  {!myComplaintsLoading &&
                    (myComplaintData?.complaints?.length ? (
                      myComplaintData.complaints.slice(0, 5).map((item) => (
                        <div key={item.id} style={{ marginBottom: "0.55rem" }}>
                          <p
                            className="mono"
                            style={{ margin: "0 0 0.2rem 0" }}
                          >
                            #{item.id.slice(-6)} • {tCategory(item.category)} •{" "}
                            {tStatus(item.status)}
                          </p>
                          <p className="muted-text" style={{ margin: 0 }}>
                            {item.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="muted-text" style={{ margin: 0 }}>
                        {t("No complaints filed yet.")}
                      </p>
                    ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  // WARDEN Dashboard
  if (role === "WARDEN") {
    const wardenTabs = [
      { id: "VERIFICATION", label: t("Verification") },
      { id: "TRANSACTIONS", label: t("Transactions") },
      { id: "ALERTS", label: t("Ai Alerts") },
      { id: "TECHNICIANS", label: t("Technicians") },
      { id: "COMPLAINTS", label: t("Complaint Portal") },
    ];

    const renderWardenContent = () => {
      switch (wardenTab) {
        case "VERIFICATION":
          return (
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                padding: "2rem",
                borderRadius: "1rem",
              }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <h3
                  style={{
                    color: "#1e293b",
                    margin: "0 0 0.5rem 0",
                    fontSize: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {t("KYC Verification Review")}
                </h3>
                <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
                  {t(
                    "Search a user by ID to review submitted KYC documents and update verification status.",
                  )}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                  marginBottom: "2rem",
                }}
              >
                <div
                  style={{ position: "relative", flex: 1, maxWidth: "500px" }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                  <input
                    value={kycLookupInput}
                    onChange={(event) => setKycLookupInput(event.target.value)}
                    placeholder={t("Enter User ID...")}
                    style={{
                      width: "100%",
                      padding: "0.8rem 1rem 0.8rem 2.8rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      fontSize: "1rem",
                      transition: "border-color 0.2s",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#F97316")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setKycActionError(null);
                    const trimmed = kycLookupInput.trim();
                    setKycLookupTarget(trimmed || null);
                  }}
                  style={{
                    backgroundColor: "#F97316",
                    color: "white",
                    border: "none",
                    padding: "0.8rem 1.5rem",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 2px 4px rgba(249, 115, 22, 0.2)",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ea580c")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#F97316")
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  {t("Load Application")}
                </button>
              </div>

              <div
                style={{
                  margin: "0 0 2rem 0",
                  backgroundColor: "#fff8f2",
                  border: "1px dashed #fdba74",
                  borderRadius: "0.75rem",
                  padding: "1.25rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p
                    style={{
                      margin: 0,
                      color: "#c2410c",
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {t("Pending KYC Queue")}
                  </p>
                </div>

                {pendingKycLoading && (
                  <p
                    style={{
                      margin: 0,
                      color: "#9a3412",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <svg
                      className="animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    {t("Loading pending applications...")}
                  </p>
                )}
                {!pendingKycLoading && pendingKycError && (
                  <p
                    style={{
                      margin: 0,
                      color: "#dc2626",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {getApiErrorMessage(
                      pendingKycError,
                      t("Unable to load pending KYC queue"),
                    )}
                  </p>
                )}
                {!pendingKycLoading &&
                  !pendingKycError &&
                  (pendingKycData?.items?.length ? (
                    <div
                      style={{
                        display: "grid",
                        gap: "0.75rem",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(280px, 1fr))",
                      }}
                    >
                      {pendingKycData.items.map((item) => (
                        <button
                          key={item.user_id}
                          type="button"
                          onClick={() => {
                            setKycActionError(null);
                            setKycLookupInput(item.user_id);
                            setKycLookupTarget(item.user_id);
                          }}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            border: "1px solid #fed7aa",
                            borderRadius: "0.5rem",
                            padding: "1rem",
                            backgroundColor: "white",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.2s ease",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "#f97316";
                            e.currentTarget.style.transform =
                              "translateY(-1px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "#fed7aa";
                            e.currentTarget.style.transform = "none";
                          }}
                        >
                          <span
                            style={{
                              color: "#1e293b",
                              fontSize: "1rem",
                              fontWeight: 600,
                              marginBottom: "0.25rem",
                            }}
                          >
                            {item.name}
                          </span>
                          <span
                            style={{
                              color: "#64748b",
                              fontSize: "0.85rem",
                              marginBottom: "0.5rem",
                              fontFamily: "monospace",
                            }}
                          >
                            {item.user_id}
                          </span>
                          <span
                            style={{
                              color: "#ea580c",
                              fontSize: "0.8rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {formatDistanceToNow(new Date(item.submitted_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        color: "#9a3412",
                        fontSize: "0.95rem",
                      }}
                    >
                      {t("No pending KYC applications for this region.")}
                    </p>
                  ))}
              </div>

              {wardenKycLoading && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "2rem 0",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "1rem",
                    }}
                  >
                    <svg
                      className="animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    {t("Loading KYC form...")}
                  </p>
                </div>
              )}

              {!wardenKycLoading && wardenKycError && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    borderLeft: "4px solid #dc2626",
                    padding: "1rem",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#b91c1c",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {getApiErrorMessage(
                      wardenKycError,
                      t("Unable to load KYC form"),
                    )}
                  </p>
                </div>
              )}

              {!wardenKycLoading &&
                !wardenKycError &&
                wardenKycForm?.kyc_form && (
                  <div
                    className="kyc-review-panel"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      padding: "1.5rem",
                      borderRadius: "0.75rem",
                    }}
                  >
                    {/* Header with Applicant Details & Actions */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "1rem",
                        paddingBottom: "1.5rem",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            backgroundColor: "#e0f2fe",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <div>
                          <h4
                            style={{
                              margin: "0 0 0.25rem 0",
                              color: "#0f172a",
                              fontSize: "1.2rem",
                              fontWeight: 700,
                            }}
                          >
                            {wardenKycForm.kyc_form.user?.name ||
                              t("Citizen Applicant")}
                          </h4>
                          <p
                            style={{
                              margin: "0 0 0.25rem 0",
                              color: "#475569",
                              fontSize: "0.9rem",
                              fontFamily: "monospace",
                            }}
                          >
                            ID: {wardenKycForm.kyc_form.user?.id || "N/A"}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              marginTop: "0.5rem",
                            }}
                          >
                            <StatusChip
                              label={tStatus(
                                wardenKycForm.kyc_form.user?.kyc_status ||
                                  "PENDING",
                              )}
                              tone={
                                wardenKycForm.kyc_form.user?.kyc_status ===
                                "VERIFIED"
                                  ? "success"
                                  : wardenKycForm.kyc_form.user?.kyc_status ===
                                      "REJECTED"
                                    ? "error"
                                    : "warning"
                              }
                            />
                            <span
                              style={{
                                color: "#64748b",
                                fontSize: "0.85rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {formatDistanceToNow(
                                new Date(wardenKycForm.kyc_form.submitted_at),
                                { addSuffix: true },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="kyc-action-btn verify-btn"
                          disabled={
                            updateKycMutation.isPending ||
                            !wardenKycForm.kyc_form.user?.id ||
                            wardenKycForm.kyc_form.user?.kyc_status ===
                              "VERIFIED"
                          }
                          onClick={() =>
                            wardenKycForm.kyc_form.user?.id &&
                            updateKycMutation.mutate({
                              userId: wardenKycForm.kyc_form.user.id,
                              status: "VERIFIED",
                            })
                          }
                          style={{
                            backgroundColor:
                              wardenKycForm.kyc_form.user?.kyc_status ===
                              "VERIFIED"
                                ? "#f1f5f9"
                                : "#16a34a",
                            color:
                              wardenKycForm.kyc_form.user?.kyc_status ===
                              "VERIFIED"
                                ? "#94a3b8"
                                : "white",
                            border: "none",
                            padding: "0.6rem 1.25rem",
                            borderRadius: "0.375rem",
                            cursor:
                              wardenKycForm.kyc_form.user?.kyc_status ===
                              "VERIFIED"
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            transition: "background-color 0.2s",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          {t("Verify")}
                        </button>
                        <button
                          type="button"
                          className="kyc-action-btn reject-btn"
                          disabled={
                            updateKycMutation.isPending ||
                            !wardenKycForm.kyc_form.user?.id ||
                            wardenKycForm.kyc_form.user?.kyc_status ===
                              "REJECTED"
                          }
                          onClick={() =>
                            wardenKycForm.kyc_form.user?.id &&
                            updateKycMutation.mutate({
                              userId: wardenKycForm.kyc_form.user.id,
                              status: "REJECTED",
                            })
                          }
                          style={{
                            backgroundColor:
                              wardenKycForm.kyc_form.user?.kyc_status ===
                              "REJECTED"
                                ? "#f1f5f9"
                                : "#dc2626",
                            color:
                              wardenKycForm.kyc_form.user?.kyc_status ===
                              "REJECTED"
                                ? "#94a3b8"
                                : "white",
                            border: "none",
                            padding: "0.6rem 1.25rem",
                            borderRadius: "0.375rem",
                            cursor:
                              wardenKycForm.kyc_form.user?.kyc_status ===
                              "REJECTED"
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            transition: "background-color 0.2s",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                          {t("Reject")}
                        </button>
                        <button
                          type="button"
                          disabled={
                            updateKycMutation.isPending ||
                            !wardenKycForm.kyc_form.user?.id ||
                            wardenKycForm.kyc_form.user?.kyc_status ===
                              "PENDING"
                          }
                          onClick={() =>
                            wardenKycForm.kyc_form.user?.id &&
                            updateKycMutation.mutate({
                              userId: wardenKycForm.kyc_form.user.id,
                              status: "PENDING",
                            })
                          }
                          style={{
                            backgroundColor: "white",
                            color:
                              wardenKycForm.kyc_form.user?.kyc_status ===
                              "PENDING"
                                ? "#94a3b8"
                                : "#64748b",
                            border: "1px solid",
                            borderColor:
                              wardenKycForm.kyc_form.user?.kyc_status ===
                              "PENDING"
                                ? "#e2e8f0"
                                : "#cbd5e1",
                            padding: "0.6rem 1.25rem",
                            borderRadius: "0.375rem",
                            cursor:
                              wardenKycForm.kyc_form.user?.kyc_status ===
                              "PENDING"
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          {t("Reset to Pending")}
                        </button>
                      </div>
                    </div>

                    {kycActionError && (
                      <div
                        style={{
                          backgroundColor: "#fef2f2",
                          color: "#b91c1c",
                          padding: "0.75rem 1rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #fecaca",
                          fontSize: "0.9rem",
                        }}
                      >
                        {kycActionError}
                      </div>
                    )}

                    {/* Document Grid */}
                    <div
                      style={{
                        display: "grid",
                        gap: "1.25rem",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(280px, 1fr))",
                      }}
                    >
                      <a
                        href={wardenKycForm.kyc_form.aadhar_doc_photo.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.75rem",
                          backgroundColor: "white",
                          padding: "1.5rem",
                          border: "1px solid #e2e8f0",
                          borderRadius: "0.75rem",
                          color: "#1e293b",
                          textDecoration: "none",
                          transition: "all 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.boxShadow =
                            "0 4px 6px -1px rgba(0,0,0,0.1)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.boxShadow =
                            "0 1px 3px rgba(0,0,0,0.05)";
                        }}
                      >
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: "#eff6ff",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                        </div>
                        <span style={{ fontWeight: 600 }}>
                          {t("Aadhaar Document")}
                        </span>
                        <span style={{ color: "#3b82f6", fontSize: "0.85rem" }}>
                          {t("Click to view full size")}
                        </span>
                      </a>

                      <a
                        href={wardenKycForm.kyc_form.pan_doc_photo.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.75rem",
                          backgroundColor: "white",
                          padding: "1.5rem",
                          border: "1px solid #e2e8f0",
                          borderRadius: "0.75rem",
                          color: "#1e293b",
                          textDecoration: "none",
                          transition: "all 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.boxShadow =
                            "0 4px 6px -1px rgba(0,0,0,0.1)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.boxShadow =
                            "0 1px 3px rgba(0,0,0,0.05)";
                        }}
                      >
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: "#eff6ff",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <path d="M8 14h.01" />
                            <path d="M12 14h.01" />
                            <path d="M16 14h.01" />
                            <path d="M8 18h.01" />
                            <path d="M12 18h.01" />
                            <path d="M16 18h.01" />
                          </svg>
                        </div>
                        <span style={{ fontWeight: 600 }}>
                          {t("PAN Document")}
                        </span>
                        <span style={{ color: "#3b82f6", fontSize: "0.85rem" }}>
                          {t("Click to view full size")}
                        </span>
                      </a>

                      <a
                        href={wardenKycForm.kyc_form.verification_selfie.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.75rem",
                          backgroundColor: "white",
                          padding: "1.5rem",
                          border: "1px solid #e2e8f0",
                          borderRadius: "0.75rem",
                          color: "#1e293b",
                          textDecoration: "none",
                          transition: "all 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.boxShadow =
                            "0 4px 6px -1px rgba(0,0,0,0.1)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.boxShadow =
                            "0 1px 3px rgba(0,0,0,0.05)";
                        }}
                      >
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: "#eff6ff",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                            <circle cx="12" cy="13" r="3" />
                          </svg>
                        </div>
                        <span style={{ fontWeight: 600 }}>
                          {t("Verification Selfie")}
                        </span>
                        <span style={{ color: "#3b82f6", fontSize: "0.85rem" }}>
                          {t("Click to view full size")}
                        </span>
                      </a>
                    </div>
                  </div>
                )}
            </div>
          );
        case "TRANSACTIONS":
          return (
            <div
              style={{
                backgroundColor: "#E3F2FD",
                padding: "1.5rem",
                borderRadius: "1rem",
              }}
            >
              <h3 style={{ color: "#1565C0", marginTop: 0 }}>
                {t("Region Transactions")}
              </h3>
              <p
                style={{
                  color: "#666",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {t("List of LPG transactions between Lenders and Receivers")}
              </p>
              <div style={{ display: "grid", gap: "1rem" }}>
                {regionalActivityLoading && (
                  <p style={{ margin: 0, color: "#666" }}>
                    {t("Loading regional transactions...")}
                  </p>
                )}
                {!regionalActivityLoading && regionalActivityError && (
                  <p style={{ margin: 0, color: "#C62828" }}>
                    {getApiErrorMessage(
                      regionalActivityError,
                      t("Unable to load regional activity"),
                    )}
                  </p>
                )}
                {!regionalActivityLoading &&
                  !regionalActivityError &&
                  (regionalActivity?.activity?.length ? (
                    regionalActivity.activity.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          backgroundColor: "white",
                          padding: "1.2rem",
                          borderRadius: "0.5rem",
                          borderLeft: "4px solid #1976D2",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.25rem",
                            }}
                          >
                            <span
                              style={{ fontWeight: "bold", color: "#1565C0" }}
                            >
                              {t("Region")} {entry.region}
                            </span>
                            <span style={{ color: "#999" }}>&rarr;</span>
                            <span
                              style={{ fontWeight: "bold", color: "#006A4E" }}
                            >
                              {t("Tech")} {entry.technicianName}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              color: "#777",
                              fontSize: "0.9rem",
                            }}
                          >
                            {t("Manual")} {entry.manualWeightKg}kg • OCR{" "}
                            {entry.ocrWeightKg}kg
                          </p>
                        </div>
                        <StatusChip
                          label={tStatus(entry.status)}
                          tone={
                            entry.status === "COMPLETED"
                              ? "success"
                              : entry.status === "IN_TRANSIT"
                                ? "info"
                                : "warning"
                          }
                        />
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, color: "#666" }}>
                      {t("No regional transactions found.")}
                    </p>
                  ))}
              </div>
            </div>
          );
        case "ALERTS":
          return (
            <div
              style={{
                backgroundColor: "#FEFCE8",
                padding: "1.5rem",
                borderRadius: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3 style={{ color: "#A16207", margin: "0 0 0.25rem 0" }}>
                    {t("Warden Ai Alerts")}
                  </h3>
                  <p
                    style={{
                      color: "#666",
                      margin: 0,
                      fontSize: "0.9rem",
                    }}
                  >
                    {t(
                      "Live stream of AI fraud/fallback alerts from technician verify and emergency voice flows.",
                    )}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      color: "#57534e",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showMockAlerts}
                      onChange={(event) =>
                        setShowMockAlerts(event.target.checked)
                      }
                    />
                    {t("Mock data")}
                  </label>
                  <StatusChip
                    label={
                      alertsConnectionState === "CONNECTED"
                        ? t("Live Connected")
                        : alertsConnectionState === "CONNECTING"
                          ? t("Connecting...")
                          : t("Disconnected")
                    }
                    tone={
                      alertsConnectionState === "CONNECTED"
                        ? "success"
                        : alertsConnectionState === "CONNECTING"
                          ? "warning"
                          : "error"
                    }
                  />
                </div>
              </div>

              {!visibleWardenAlerts.length ? (
                <div
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #fde68a",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                  }}
                >
                  <p style={{ margin: "0 0 0.25rem 0", color: "#854d0e" }}>
                    {t("No live alerts yet.")}
                  </p>
                  <p
                    style={{ margin: 0, color: "#78716c", fontSize: "0.85rem" }}
                  >
                    {t(
                      "Historical alert listing endpoint is not available yet; this panel currently shows live WARDEN_ALERT events only.",
                    )}
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {visibleWardenAlerts.map((item) => (
                    <div
                      key={item.alert_id}
                      style={{
                        backgroundColor: "white",
                        border: "1px solid #fef08a",
                        borderLeft: "4px solid #EAB308",
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.75rem",
                          flexWrap: "wrap",
                          marginBottom: "0.65rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <StatusChip
                            label={`${t("Risk")}: ${item.combined_risk_score}`}
                            tone={
                              item.combined_risk_score >= 75
                                ? "error"
                                : item.combined_risk_score >= 50
                                  ? "warning"
                                  : "info"
                            }
                          />
                          <StatusChip
                            label={tStatus(item.review_status)}
                            tone={
                              item.review_status === "RESOLVED"
                                ? "success"
                                : item.review_status === "UNDER_REVIEW"
                                  ? "info"
                                  : "warning"
                            }
                          />
                        </div>
                        <p
                          style={{
                            margin: 0,
                            color: "#78716c",
                            fontSize: "0.85rem",
                          }}
                        >
                          {formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      <p
                        style={{
                          margin: "0 0 0.35rem 0",
                          color: "#44403c",
                          fontSize: "0.9rem",
                        }}
                      >
                        <b>{t("Source")}:</b> {item.source || "N/A"}
                      </p>

                      {item.review_reason && (
                        <p
                          style={{
                            margin: "0 0 0.5rem 0",
                            color: "#57534e",
                            fontSize: "0.9rem",
                          }}
                        >
                          <b>{t("Reason")}:</b> {item.review_reason}
                        </p>
                      )}

                      <p
                        style={{
                          margin: "0 0 0.5rem 0",
                          color: "#57534e",
                          fontSize: "0.9rem",
                        }}
                      >
                        <b>{t("Alert ID")}:</b> {item.alert_id}
                      </p>

                      {item.transaction_id && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              color: "#57534e",
                              fontSize: "0.9rem",
                            }}
                          >
                            <b>{t("Transaction ID")}:</b> {item.transaction_id}
                          </p>
                          <button
                            type="button"
                            onClick={() => setWardenTab("TRANSACTIONS")}
                            style={{
                              backgroundColor: "transparent",
                              color: "#a16207",
                              border: "1px solid #facc15",
                              borderRadius: "999px",
                              padding: "0.25rem 0.7rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {t("Open transactions")}
                          </button>
                        </div>
                      )}

                      {item.flags.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.45rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {item.flags.map((flag) => (
                            <span
                              key={`${item.alert_id}-${flag}`}
                              style={{
                                fontSize: "0.75rem",
                                backgroundColor: "#FEF9C3",
                                color: "#854d0e",
                                border: "1px solid #FDE047",
                                borderRadius: "999px",
                                padding: "0.2rem 0.6rem",
                                fontWeight: 600,
                              }}
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        case "TECHNICIANS":
          return (
            <div
              style={{
                backgroundColor: "#E8F5E9",
                padding: "1.5rem",
                borderRadius: "1rem",
              }}
            >
              <h3 style={{ color: "#2E7D32", marginTop: 0 }}>
                {t("Area Technicians")}
              </h3>
              <p
                style={{
                  color: "#666",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {t(
                  "List of all available technicians in the area and their information",
                )}
              </p>
              {technicianLoading && (
                <p style={{ margin: "0 0 1rem 0", color: "#166534" }}>
                  {t("Loading technicians...")}
                </p>
              )}
              {!technicianLoading && technicianError && (
                <p style={{ margin: "0 0 1rem 0", color: "#C62828" }}>
                  {getApiErrorMessage(
                    technicianError,
                    t("Unable to load technician availability"),
                  )}
                </p>
              )}
              <div
                style={{
                  display: "grid",
                  gap: "1rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                }}
              >
                {!technicianLoading &&
                  !technicianError &&
                  (technicianData?.technicians?.length ? (
                    technicianData.technicians.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                          backgroundColor: "white",
                          padding: "1.2rem",
                          borderRadius: "0.5rem",
                          borderTop: "4px solid #2E7D32",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              color: "#006A4E",
                              fontSize: "1.1rem",
                            }}
                          >
                            {item.name}
                          </h4>
                          <StatusChip
                            label={tStatus(item.status)}
                            tone={
                              item.status === "AVAILABLE"
                                ? "success"
                                : item.status === "BUSY"
                                  ? "warning"
                                  : "pending"
                            }
                          />
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#555" }}>
                          <p
                            style={{
                              margin: "0 0 0.5rem 0",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span aria-hidden="true">&#9733;</span>{" "}
                            {item.rating !== null
                              ? `${item.rating.toFixed(1)} / 5.0`
                              : t("Not rated")}
                          </p>
                          <p
                            style={{
                              margin: "0",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span aria-hidden="true">&#9990;</span>{" "}
                            {item.phone || "N/A"}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled
                          style={{
                            backgroundColor: "#f1f5f9",
                            color: "#006A4E",
                            border: "1px solid #cbd5e1",
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            marginTop: "0.5rem",
                            opacity: 0.7,
                          }}
                        >
                          {t("City")}: {item.city || item.region_id || "N/A"}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, color: "#166534" }}>
                      {t("No technicians found for this region.")}
                    </p>
                  ))}
              </div>
            </div>
          );
        case "COMPLAINTS":
          return (
            <div
              style={{
                backgroundColor: "#FFEBEE",
                padding: "1.5rem",
                borderRadius: "1rem",
              }}
            >
              <h3 style={{ color: "#C62828", marginTop: 0 }}>
                {t("Complaint Portal")}
              </h3>
              <p
                style={{
                  color: "#666",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {t("List of complaints against Users from other Users")}
              </p>
              {complaintLoading && (
                <p style={{ margin: "0 0 1rem 0", color: "#991b1b" }}>
                  {t("Loading complaints...")}
                </p>
              )}
              {!complaintLoading && complaintError && (
                <p style={{ margin: "0 0 1rem 0", color: "#C62828" }}>
                  {getApiErrorMessage(
                    complaintError,
                    t("Unable to load complaints"),
                  )}
                </p>
              )}
              <div style={{ display: "grid", gap: "1rem" }}>
                {!complaintLoading &&
                  !complaintError &&
                  (complaintData?.complaints?.length ? (
                    complaintData.complaints.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          backgroundColor: "white",
                          padding: "1.2rem",
                          borderRadius: "0.5rem",
                          borderLeft: "4px solid #D32F2F",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: "0 0 0.5rem 0",
                              color: "#C62828",
                              fontSize: "1.1rem",
                            }}
                          >
                            {t("Report")} #{item.id.slice(-6)}:{" "}
                            {tCategory(item.category)}
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              gap: "1rem",
                              flexWrap: "wrap",
                            }}
                          >
                            <p
                              style={{
                                margin: "0 0 0.25rem 0",
                                color: "#555",
                                fontSize: "0.9rem",
                              }}
                            >
                              <b>{t("Reporter")}:</b> {item.reporter_user_id}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "#555",
                                fontSize: "0.9rem",
                              }}
                            >
                              <b>{t("Accused")}:</b> {item.accused_user_id}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "#555",
                                fontSize: "0.9rem",
                              }}
                            >
                              <b>{t("Status")}:</b> {tStatus(item.status)}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "#555",
                                fontSize: "0.9rem",
                              }}
                            >
                              <b>{t("Filed")}:</b>{" "}
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={
                            complaintStatusMutation.isPending ||
                            item.status === "UNDER_REVIEW"
                          }
                          onClick={() =>
                            complaintStatusMutation.mutate(item.id)
                          }
                          style={{
                            backgroundColor: "transparent",
                            color: "#D32F2F",
                            border: "1px solid #D32F2F",
                            padding: "0.5rem 1.5rem",
                            borderRadius: "2rem",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            opacity:
                              complaintStatusMutation.isPending ||
                              item.status === "UNDER_REVIEW"
                                ? 0.7
                                : 1,
                          }}
                        >
                          {item.status === "UNDER_REVIEW"
                            ? t("Under Review")
                            : t("Review Match")}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, color: "#991b1b" }}>
                      {t("No complaints found for this region.")}
                    </p>
                  ))}
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div
        className="dashboard-container"
        style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
      >
        <header
          className="dashboard-header"
          style={{ paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}
        >
          <p
            className="oversight-text"
            style={{
              fontSize: "0.85rem",
              color: "#1565C0",
              fontWeight: 700,
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            {t("WARDEN CONTROL CENTER")}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: "0", fontSize: "2rem", color: "#1e293b" }}>
              {t("Welcome Warden")} {welcomeName}
            </h1>
            <StatusChip label={t("Active Duty")} tone="info" />
          </div>
        </header>

        <section
          style={{
            display: "flex",
            gap: "0.75rem",
            overflowX: "auto",
            paddingBottom: "0.5rem",
          }}
        >
          {wardenTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setWardenTab(tab.id)}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "2rem",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
                whiteSpace: "nowrap",
                backgroundColor: wardenTab === tab.id ? "#006A4E" : "#f1f5f9",
                color: wardenTab === tab.id ? "white" : "#475569",
                boxShadow:
                  wardenTab === tab.id
                    ? "0 4px 6px -1px rgba(0, 106, 78, 0.2)"
                    : "none",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </section>

        <section style={{ paddingBottom: "2rem" }}>
          {renderWardenContent()}
        </section>
      </div>
    );
  }

  // Fallback for TECHNICIAN
  if (role === "TECHNICIAN") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          paddingBottom: "2rem",
        }}
      >
        <section className="card">
          <PageHeader
            title={`${t("Welcome")}, ${welcomeName}!`}
            subtitle={t("Your Technician Dashboard")}
          />
          <div className="info-grid" style={{ marginTop: "1rem" }}>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "0.5rem",
              }}
            >
              <p className="muted-text" style={{ marginBottom: "0.5rem" }}>
                {t("Role")}
              </p>
              <p
                className="mono"
                style={{
                  color: "var(--brand-700)",
                  fontWeight: "600",
                  fontSize: "1.1rem",
                }}
              >
                {tRole(role)}
              </p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "0.5rem",
              }}
            >
              <p className="muted-text" style={{ marginBottom: "0.5rem" }}>
                {t("User ID")}
              </p>
              <p className="mono" style={{ fontSize: "1.1rem" }}>
                {userId}
              </p>
            </div>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "0.5rem",
              }}
            >
              <p className="muted-text" style={{ marginBottom: "0.5rem" }}>
                {t("Region ID")}
              </p>
              <p
                className="mono"
                style={{ fontWeight: "600", fontSize: "1.1rem" }}
              >
                {city || regionId || "N/A"}
              </p>
            </div>
          </div>
        </section>

        <h3
          style={{
            fontSize: "1.25rem",
            color: "var(--text-primary)",
            fontWeight: "600",
            marginTop: "0.5rem",
          }}
        >
          {t("Quick Actions")}
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <button
            onClick={() => navigate("/technician/verify")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.25rem",
              padding: "2.5rem 1.5rem",
              backgroundColor: "white",
              border: "1px solid var(--border-default)",
              borderRadius: "1rem",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--brand-100)",
                borderRadius: "50%",
                color: "var(--brand-600)",
              }}
            >
              <ClipboardCheck size={40} />
            </div>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "block",
                  fontWeight: "600",
                  fontSize: "1.2rem",
                  marginBottom: "0.5rem",
                  color: "var(--text-primary)",
                }}
              >
                {t("Verify Cylinder")}
              </span>
              <span
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  lineHeight: "1.4",
                }}
              >
                {t(
                  "Verify cylinder evidence and safety for assigned deliveries",
                )}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigate("/technician/handover")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.25rem",
              padding: "2.5rem 1.5rem",
              backgroundColor: "white",
              border: "1px solid var(--border-default)",
              borderRadius: "1rem",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--brand-100)",
                borderRadius: "50%",
                color: "var(--brand-600)",
              }}
            >
              <ArrowRightLeft size={40} />
            </div>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "block",
                  fontWeight: "600",
                  fontSize: "1.2rem",
                  marginBottom: "0.5rem",
                  color: "var(--text-primary)",
                }}
              >
                {t("Process Handover")}
              </span>
              <span
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  lineHeight: "1.4",
                }}
              >
                {t("Transfer custody of cylinders and update system status")}
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // General fallback
  return (
    <section className="card">
      <PageHeader
        title={t("Role Dashboard")}
        subtitle={t(
          "Use the top navigation to continue your assigned workflow.",
        )}
      />
      <div className="info-grid">
        <div>
          <p className="muted-text">{t("Role")}</p>
          <p className="mono">{role ? tRole(role) : "-"}</p>
        </div>
        <div>
          <p className="muted-text">{t("User ID")}</p>
          <p className="mono">{userId}</p>
        </div>
        <div>
          <p className="muted-text">{t("Region ID")}</p>
          <p className="mono">{city || regionId || "N/A"}</p>
        </div>
      </div>
    </section>
  );
}
