import { useEffect, useState } from "react";
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
  activateContributorListing,
  updateMyLocation,
  updateComplaintStatus,
  updateKycStatus,
} from "../../api/endpoints";
import { formatDistanceToNow } from "date-fns";
import { getApiErrorMessage } from "../../api/error";
import type { KycStatus } from "../../types/domain";

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
      () => reject(new Error("Location permission denied"))
    );
  });
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.userId);
  const city = useAuthStore((state) => state.city);
  const regionId = useAuthStore((state) => state.regionId);
  const username = useAuthStore((state) => state.username);
  const kycStatus = useAuthStore((state) => state.kycStatus);
  const setKycStatus = useAuthStore((state) => state.setKycStatus);
  const userStatus = useTransactionStore((state) => state.userStatus);
  const setUserStatus = useTransactionStore((state) => state.setUserStatus);
  const activeTransaction = useTransactionStore((state) => state.activeTransaction);
  const setActiveTransaction = useTransactionStore((state) => state.setActiveTransaction);
  const navigate = useNavigate();
  const welcomeName = username?.trim() || "User";

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
  const [complaintCreateError, setComplaintCreateError] = useState<string | null>(null);

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
    enabled: role === "CONTRIBUTOR",
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
        getApiErrorMessage(error, "Unable to update KYC status"),
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
        queryClient.invalidateQueries({ queryKey: ["contributorNotifications", userId] }),
      ]);
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: acceptOpenContributorRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["contributorNotifications", userId] }),
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
      setComplaintCreateError(getApiErrorMessage(error, "Unable to submit complaint"));
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: updateMyLocation,
  });

  const activateListingMutation = useMutation({
    mutationFn: activateContributorListing,
    onSuccess: () => {
      setListingError(null);
      setUserStatus("ACTIVE_CONTRIBUTOR");
    },
    onError: (error) => {
      setListingError(
        getApiErrorMessage(error, "Unable to activate contributor listing")
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
        ["PAID_IN_ESCROW", "VERIFIED", "IN_TRANSIT"].includes(tx?.status)
    );
    setActiveTransaction(contributorTx || null);

    if (contributorTx) {
      setUserStatus("IDLE");
    }
  }, [txData, userId, setActiveTransaction]);

  useEffect(() => {
    if (role !== "CONTRIBUTOR") {
      return;
    }

    const listingStatus = contributorListingData?.listing?.status;
    if (listingStatus === "LISTED") {
      setUserStatus("ACTIVE_CONTRIBUTOR");
      return;
    }

    if (listingStatus === "UNLISTED" && !activeTransaction) {
      setUserStatus("IDLE");
    }
  }, [role, contributorListingData, activeTransaction, setUserStatus]);

  const isContributorListed = contributorListingData?.listing?.status === "LISTED";

  const handleLendLpgClick = async () => {
    setUserStatus("ACTIVE_CONTRIBUTOR");
    setListingError(null);
    setListingNotice(null);

    try {
      let coords: { lat: number; lng: number } | null = null;

      try {
        coords = await getCurrentLocation();
      } catch (_error) {
        setListingNotice(
          "Location unavailable. Listing is active using your saved region."
        );
      }

      if (coords) {
        await updateLocationMutation.mutateAsync(coords);
      }

      await activateListingMutation.mutateAsync({
        lat: coords?.lat,
        lng: coords?.lng,
        city: city || regionId || undefined,
      });
    } catch (error) {
      setUserStatus("IDLE");
      setListingNotice(null);
      setListingError(getApiErrorMessage(error, "Unable to access location"));
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
            GOVERNMENT OVERSIGHT ACTIVE
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: "4px 0", fontSize: "2rem" }}>
              Welcome {welcomeName}
            </h1>
            {effectiveKycStatus === "VERIFIED" ? (
              <StatusChip label="Verified Citizen" tone="success" />
            ) : effectiveKycStatus === "REJECTED" ? (
              <StatusChip label="Verification Rejected" tone="error" />
            ) : (
              <StatusChip label="Verification Pending" tone="warning" />
            )}
          </div>
        </header>

        {(role === "BENEFICIARY" || role === "CONTRIBUTOR") && (
          <section className="card" style={{ padding: "0.9rem 1rem" }}>
            {effectiveKycStatus === "VERIFIED" && (
              <p style={{ margin: 0, color: "#166534", fontWeight: 600 }}>
                KYC approved by warden. You now have full access.
              </p>
            )}
            {effectiveKycStatus === "REJECTED" && (
              <p style={{ margin: 0, color: "#b91c1c", fontWeight: 600 }}>
                KYC rejected by warden. Update your documents and resubmit.
              </p>
            )}
            {effectiveKycStatus === "PENDING" && (
              <p style={{ margin: 0, color: "#92400e", fontWeight: 600 }}>
                KYC submitted and awaiting warden review.
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
              Lend LPG
            </h2>
            <p
              style={{
                maxWidth: "250px",
                opacity: 0.9,
                marginBottom: "2rem",
                lineHeight: "1.4",
              }}
            >
              Have an extra cylinder? Support a neighbor in need and earn
              community trust credits.
            </p>
            {!isContributorListed ? (
              <button
                onClick={handleLendLpgClick}
                style={{
                  backgroundColor: "white",
                  color: "#059669",
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
                Start Lending <span aria-hidden="true">&rarr;</span>
              </button>
            ) : (
              <ActiveListing isLoading={activateListingMutation.isPending} />
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
              Request LPG
            </h2>
            <p
              style={{
                maxWidth: "250px",
                opacity: 0.9,
                marginBottom: "2rem",
                lineHeight: "1.4",
              }}
            >
              Running low? Broadcast a request to nearby neighbors for immediate
              supply assistance.
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
              Post Request <span aria-hidden="true">&#9873;</span>
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
              <h3 style={{ marginTop: 0 }}>Escrow Lock Acknowledgements</h3>
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
                      Transaction ID: {item.transaction_id}
                    </p>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => contributorAckMutation.mutate(item.transaction_id)}
                      disabled={contributorAckMutation.isPending}
                    >
                      {contributorAckMutation.isPending
                        ? "Acknowledging..."
                        : "Acknowledge lock"}
                    </button>
                  </div>
                ))}
            </section>
          )}

        {role === "CONTRIBUTOR" && (
          <section className="card stack" style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>Nearby Emergency Request Notifications</h3>
            {contributorNotificationsLoading && (
              <p className="muted-text" style={{ margin: 0 }}>
                Checking nearby request notifications...
              </p>
            )}
            {!contributorNotificationsLoading && contributorNotificationsError && (
              <p className="error-banner">
                {getApiErrorMessage(
                  contributorNotificationsError,
                  "Unable to load nearby notifications",
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
                      Transaction ID: {request.transaction_id}
                    </p>
                    <p className="muted-text" style={{ margin: "0 0 0.25rem 0" }}>
                      Beneficiary ID: {request.beneficiary_user_id || "N/A"}
                    </p>
                    <p className="muted-text" style={{ margin: "0 0 0.6rem 0" }}>
                      City: {request.city || city || "N/A"}
                    </p>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => acceptRequestMutation.mutate(request.transaction_id)}
                      disabled={acceptRequestMutation.isPending}
                    >
                      {acceptRequestMutation.isPending ? "Accepting..." : "Accept Request & Lend"}
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted-text" style={{ margin: 0 }}>
                  No nearby open emergency requests right now.
                </p>
              ))}
          </section>
        )}

        {(role === "BENEFICIARY" || role === "CONTRIBUTOR") && (
          <section className="card stack" style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>Complaint Box</h3>
            <p className="muted-text" style={{ marginTop: 0 }}>
              Report misconduct or safety issues directly to the warden queue.
            </p>
            <div className="stack" style={{ gap: "0.65rem" }}>
              <label className="field">
                <span>Accused User ID</span>
                <input
                  value={complaintAccusedId}
                  onChange={(event) => setComplaintAccusedId(event.target.value)}
                  placeholder="Enter user ID"
                />
              </label>
              <label className="field">
                <span>Category</span>
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
                  <option value="OVERPRICING">Overpricing</option>
                  <option value="MISCONDUCT">Misconduct</option>
                  <option value="SAFETY">Safety</option>
                  <option value="FRAUD">Fraud</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="field">
                <span>Description</span>
                <textarea
                  value={complaintDescription}
                  onChange={(event) => setComplaintDescription(event.target.value)}
                  rows={3}
                  placeholder="Describe what happened"
                />
              </label>
            </div>
            {complaintCreateError && <p className="error-banner">{complaintCreateError}</p>}
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
              {createComplaintMutation.isPending ? "Submitting complaint..." : "Submit Complaint"}
            </button>

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0" }}>My Complaint History</h4>
              {myComplaintsLoading && (
                <p className="muted-text" style={{ margin: 0 }}>
                  Loading your complaints...
                </p>
              )}
              {!myComplaintsLoading &&
                (myComplaintData?.complaints?.length ? (
                  myComplaintData.complaints.slice(0, 5).map((item) => (
                    <div key={item.id} style={{ marginBottom: "0.55rem" }}>
                      <p className="mono" style={{ margin: "0 0 0.2rem 0" }}>
                        #{item.id.slice(-6)} • {item.category} • {item.status}
                      </p>
                      <p className="muted-text" style={{ margin: 0 }}>
                        {item.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="muted-text" style={{ margin: 0 }}>
                    No complaints filed yet.
                  </p>
                ))}
            </div>
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
                Transaction History
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
                View All
              </a>
            </div>
            <div
              className="transaction-list"
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {txLoading ? (
                <p style={{ color: "#666" }}>Loading transactions...</p>
              ) : txData?.transactions && txData.transactions.length > 0 ? (
                txData.transactions.slice(0, 5).map((tx: any) => {
                  const isLent = tx.contributor?.id === userId;
                  const partnerName = isLent
                    ? tx.beneficiary?.email ||
                      tx.beneficiary?.phone ||
                      "Neighbor"
                    : tx.contributor?.email ||
                      tx.contributor?.phone ||
                      "Neighbor";
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
                              ? `Lent to ${partnerName}`
                              : `Borrowed from ${partnerName}`}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.8rem",
                              color: "#666",
                            }}
                          >
                            {timeAgo} • {tx.city || tx.region_id || "Local Hub"}
                          </p>
                        </div>
                      </div>
                      <StatusChip
                        label={tx.status}
                        tone={tx.status === "COMPLETED" ? "success" : "pending"}
                      />
                    </div>
                  );
                })
              ) : (
                <p style={{ color: "#666" }}>No recent transactions.</p>
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
              Live Supply Map
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
                        <b>Active Request</b>
                        <br />
                        Status: {req.status}
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
                        <b>Available Contributor</b>
                      </Popup>
                    </Marker>
                  ))}

                {/* Default Pune marker if no data */}
                {(!mapData ||
                  (!mapData.active_requests?.length &&
                    !mapData.available_contributors?.length)) && (
                  <Marker position={[18.5204, 73.8567]}>
                    <Popup>
                      Pune <br /> Active Hub
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // WARDEN Dashboard
  if (role === "WARDEN") {
    const wardenTabs = [
      { id: "VERIFICATION", label: "Verification" },
      { id: "TRANSACTIONS", label: "Transactions" },
      { id: "TECHNICIANS", label: "Technicians" },
      { id: "COMPLAINTS", label: "Complaint Portal" },
    ];

    const renderWardenContent = () => {
      switch (wardenTab) {
        case "VERIFICATION":
          return (
            <div
              style={{
                backgroundColor: "#FFF3E0",
                padding: "1.5rem",
                borderRadius: "1rem",
              }}
            >
              <h3 style={{ color: "#E65100", marginTop: 0 }}>
                KYC Verification Review
              </h3>
              <p
                style={{
                  color: "#666",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                Search a user by ID to review submitted KYC documents and update
                verification status.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <input
                  value={kycLookupInput}
                  onChange={(event) => setKycLookupInput(event.target.value)}
                  placeholder="Enter user ID"
                  style={{
                    flex: 1,
                    padding: "0.7rem 0.9rem",
                    borderRadius: "0.6rem",
                    border: "1px solid #f59e0b",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setKycActionError(null);
                    const trimmed = kycLookupInput.trim();
                    setKycLookupTarget(trimmed || null);
                  }}
                  style={{
                    backgroundColor: "#F57C00",
                    color: "white",
                    border: "none",
                    padding: "0.7rem 1.2rem",
                    borderRadius: "0.6rem",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Load Application
                </button>
              </div>

              <div
                style={{
                  margin: "0 0 1rem 0",
                  backgroundColor: "#fff7ed",
                  border: "1px solid #fdba74",
                  borderRadius: "0.6rem",
                  padding: "0.7rem 0.9rem",
                }}
              >
                <p
                  style={{
                    margin: "0 0 0.5rem 0",
                    color: "#7c2d12",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                  }}
                >
                  Pending KYC Queue
                </p>
                {pendingKycLoading && (
                  <p
                    style={{ margin: 0, color: "#9a3412", fontSize: "0.85rem" }}
                  >
                    Loading pending applications...
                  </p>
                )}
                {!pendingKycLoading && pendingKycError && (
                  <p
                    style={{ margin: 0, color: "#C62828", fontSize: "0.85rem" }}
                  >
                    {getApiErrorMessage(
                      pendingKycError,
                      "Unable to load pending KYC queue",
                    )}
                  </p>
                )}
                {!pendingKycLoading &&
                  !pendingKycError &&
                  (pendingKycData?.items?.length ? (
                    <div style={{ display: "grid", gap: "0.45rem" }}>
                      {pendingKycData.items.slice(0, 3).map((item) => (
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
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: "1px solid #fdba74",
                            borderRadius: "0.45rem",
                            padding: "0.5rem 0.6rem",
                            backgroundColor: "#fff",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{ color: "#7c2d12", fontSize: "0.84rem" }}
                          >
                            {item.name} • {item.user_id}
                          </span>
                          <span
                            style={{ color: "#9a3412", fontSize: "0.8rem" }}
                          >
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
                        fontSize: "0.85rem",
                      }}
                    >
                      No pending KYC applications for this region.
                    </p>
                  ))}
              </div>

              {wardenKycLoading && (
                <p style={{ margin: 0, color: "#666" }}>Loading KYC form...</p>
              )}

              {!wardenKycLoading && wardenKycError && (
                <p style={{ margin: 0, color: "#C62828" }}>
                  {getApiErrorMessage(
                    wardenKycError,
                    "Unable to load KYC form",
                  )}
                </p>
              )}

              {!wardenKycLoading &&
                !wardenKycError &&
                wardenKycForm?.kyc_form && (
                  <div
                    style={{
                      display: "grid",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        backgroundColor: "white",
                        padding: "1.2rem",
                        borderRadius: "0.5rem",
                        borderLeft: "4px solid #F57C00",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            margin: "0 0 0.25rem 0",
                            color: "#333",
                            fontSize: "1.1rem",
                          }}
                        >
                          {wardenKycForm.kyc_form.user?.name ||
                            "Citizen Applicant"}
                        </h4>
                        <p
                          style={{
                            margin: 0,
                            color: "#777",
                            fontSize: "0.9rem",
                          }}
                        >
                          User ID: {wardenKycForm.kyc_form.user?.id || "N/A"}
                        </p>
                        <p
                          style={{
                            margin: "0.25rem 0 0 0",
                            color: "#777",
                            fontSize: "0.9rem",
                          }}
                        >
                          Submitted:{" "}
                          {formatDistanceToNow(
                            new Date(wardenKycForm.kyc_form.submitted_at),
                            { addSuffix: true },
                          )}
                        </p>
                        <div style={{ marginTop: "0.6rem" }}>
                          <StatusChip
                            label={
                              wardenKycForm.kyc_form.user?.kyc_status ||
                              "PENDING"
                            }
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
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            updateKycMutation.isPending ||
                            !wardenKycForm.kyc_form.user?.id
                          }
                          onClick={() =>
                            wardenKycForm.kyc_form.user?.id &&
                            updateKycMutation.mutate({
                              userId: wardenKycForm.kyc_form.user.id,
                              status: "VERIFIED",
                            })
                          }
                          style={{
                            backgroundColor: "#2E7D32",
                            color: "white",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "2rem",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          disabled={
                            updateKycMutation.isPending ||
                            !wardenKycForm.kyc_form.user?.id
                          }
                          onClick={() =>
                            wardenKycForm.kyc_form.user?.id &&
                            updateKycMutation.mutate({
                              userId: wardenKycForm.kyc_form.user.id,
                              status: "REJECTED",
                            })
                          }
                          style={{
                            backgroundColor: "#D32F2F",
                            color: "white",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "2rem",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={
                            updateKycMutation.isPending ||
                            !wardenKycForm.kyc_form.user?.id
                          }
                          onClick={() =>
                            wardenKycForm.kyc_form.user?.id &&
                            updateKycMutation.mutate({
                              userId: wardenKycForm.kyc_form.user.id,
                              status: "PENDING",
                            })
                          }
                          style={{
                            backgroundColor: "#f59e0b",
                            color: "white",
                            border: "none",
                            padding: "0.5rem 1rem",
                            borderRadius: "2rem",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Mark Pending
                        </button>
                      </div>
                    </div>

                    {kycActionError && (
                      <p style={{ margin: 0, color: "#C62828" }}>
                        {kycActionError}
                      </p>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gap: "0.6rem",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                      }}
                    >
                      <a
                        href={wardenKycForm.kyc_form.aadhar_doc_photo.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#1565C0" }}
                      >
                        View Aadhaar Document
                      </a>
                      <a
                        href={wardenKycForm.kyc_form.pan_doc_photo.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#1565C0" }}
                      >
                        View PAN Document
                      </a>
                      <a
                        href={wardenKycForm.kyc_form.verification_selfie.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#1565C0" }}
                      >
                        View Verification Selfie
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
                Region Transactions
              </h3>
              <p
                style={{
                  color: "#666",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                List of LPG transactions between Lenders and Receivers
              </p>
              <div style={{ display: "grid", gap: "1rem" }}>
                {regionalActivityLoading && (
                  <p style={{ margin: 0, color: "#666" }}>
                    Loading regional transactions...
                  </p>
                )}
                {!regionalActivityLoading && regionalActivityError && (
                  <p style={{ margin: 0, color: "#C62828" }}>
                    {getApiErrorMessage(
                      regionalActivityError,
                      "Unable to load regional activity",
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
                              Region {entry.region}
                            </span>
                            <span style={{ color: "#999" }}>&rarr;</span>
                            <span
                              style={{ fontWeight: "bold", color: "#006A4E" }}
                            >
                              Tech {entry.technicianName}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              color: "#777",
                              fontSize: "0.9rem",
                            }}
                          >
                            Manual {entry.manualWeightKg}kg • OCR{" "}
                            {entry.ocrWeightKg}kg
                          </p>
                        </div>
                        <StatusChip
                          label={entry.status}
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
                      No regional transactions found.
                    </p>
                  ))}
              </div>
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
                Area Technicians
              </h3>
              <p
                style={{
                  color: "#666",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                List of all available technicians in the area and their
                information
              </p>
              {technicianLoading && (
                <p style={{ margin: "0 0 1rem 0", color: "#166534" }}>
                  Loading technicians...
                </p>
              )}
              {!technicianLoading && technicianError && (
                <p style={{ margin: "0 0 1rem 0", color: "#C62828" }}>
                  {getApiErrorMessage(
                    technicianError,
                    "Unable to load technician availability",
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
                            label={item.status}
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
                              : "Not rated"}
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
                          City: {item.city || item.region_id || "N/A"}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, color: "#166534" }}>
                      No technicians found for this region.
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
                Complaint Portal
              </h3>
              <p
                style={{
                  color: "#666",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                List of complaints against Users from other Users
              </p>
              {complaintLoading && (
                <p style={{ margin: "0 0 1rem 0", color: "#991b1b" }}>
                  Loading complaints...
                </p>
              )}
              {!complaintLoading && complaintError && (
                <p style={{ margin: "0 0 1rem 0", color: "#C62828" }}>
                  {getApiErrorMessage(
                    complaintError,
                    "Unable to load complaints",
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
                            Report #{item.id.slice(-6)}: {item.category}
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
                              <b>Reporter:</b> {item.reporter_user_id}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "#555",
                                fontSize: "0.9rem",
                              }}
                            >
                              <b>Accused:</b> {item.accused_user_id}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "#555",
                                fontSize: "0.9rem",
                              }}
                            >
                              <b>Status:</b> {item.status}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "#555",
                                fontSize: "0.9rem",
                              }}
                            >
                              <b>Filed:</b>{" "}
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
                            ? "Under Review"
                            : "Review Match"}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, color: "#991b1b" }}>
                      No complaints found for this region.
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
            WARDEN CONTROL CENTER
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: "0", fontSize: "2rem", color: "#1e293b" }}>
              Welcome Warden {welcomeName}
            </h1>
            <StatusChip label="Active Duty" tone="info" />
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
  return (
    <section className="card">
      <PageHeader
        title="Role Dashboard"
        subtitle="Use the top navigation to continue your assigned workflow."
      />
      <div className="info-grid">
        <div>
          <p className="muted-text">Role</p>
          <p className="mono">{role}</p>
        </div>
        <div>
          <p className="muted-text">User ID</p>
          <p className="mono">{userId}</p>
        </div>
        <div>
          <p className="muted-text">Region ID</p>
          <p className="mono">{city || regionId || "N/A"}</p>
        </div>
      </div>
    </section>
  );
}
