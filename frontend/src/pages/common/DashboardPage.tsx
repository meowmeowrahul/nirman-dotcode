import { useAuthStore } from "../../store/authStore";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserTransactions, getLiveMapData } from "../../api/endpoints";
import { formatDistanceToNow } from "date-fns";

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

export function DashboardPage() {
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.userId);
  const regionId = useAuthStore((state) => state.regionId);
  const username = useAuthStore((state) => state.username);
  const kycStatus = useAuthStore((state) => state.kycStatus);
  const navigate = useNavigate();
  const welcomeName = username?.trim() || "User";

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", userId],
    queryFn: () => getUserTransactions(userId!),
    enabled: !!userId,
  });

  const { data: mapData } = useQuery({
    queryKey: ["liveMap", regionId],
    queryFn: () => getLiveMapData(regionId || undefined),
  });

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
            {kycStatus === "VERIFIED" ? (
              <StatusChip label="Verified Citizen" tone="success" />
            ) : kycStatus === "REJECTED" ? (
              <StatusChip label="Verification Rejected" tone="error" />
            ) : (
              <StatusChip label="Verification Pending" tone="warning" />
            )}
          </div>
        </header>

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
              backgroundColor: "#006A4E",
              color: "white",
              padding: "2rem",
              borderRadius: "1rem",
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
            <button
              onClick={() => navigate("/escrow/closure")}
              style={{
                backgroundColor: "white",
                color: "#006A4E",
                padding: "0.75rem 1.5rem",
                borderRadius: "2rem",
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
          </div>

          {/* Request LPG */}
          <div
            className="action-card request-card"
            style={{
              backgroundColor: "#D32F2F",
              color: "white",
              padding: "2rem",
              borderRadius: "1rem",
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
              onClick={() => navigate("/beneficiary/requests")}
              style={{
                backgroundColor: "white",
                color: "#D32F2F",
                padding: "0.75rem 1.5rem",
                borderRadius: "2rem",
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
                            {timeAgo} • {tx.region_id || "Local Hub"}
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

  // Fallback for WARDEN / TECHNICIAN (Since prompt only asked to combine citizen dashboards)
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
          <p className="mono">{regionId || "N/A"}</p>
        </div>
      </div>
    </section>
  );
}
