import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  lockEscrow,
  rippleSearch,
  updateMyLocation,
} from "../../api/endpoints";
import { getApiErrorMessage } from "../../api/error";
import type { Contributor, Transaction } from "../../types/domain";
import { useAuthStore } from "../../store/authStore";
import { useTransactionStore } from "../../store/transactionStore";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";
import { useI18n } from "../../i18n/language";
import {
  MapPinOff,
  MapPin,
  MapPinned,
  Radio,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  
  ShieldCheck,
  FlameIcon
} from "lucide-react";

interface Coordinates {
  lat: number;
  lng: number;
}

export function EmergencyRequestPage() {
  const { t, tStatus } = useI18n();
  const userId = useAuthStore((state) => state.userId);
  const city = useAuthStore((state) => state.city);
  const setUserStatus = useTransactionStore((state) => state.setUserStatus);
  const setActiveTransaction = useTransactionStore(
    (state) => state.setActiveTransaction,
  );

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [permissionState, setPermissionState] = useState<
    "idle" | "granted" | "denied"
  >("idle");
  const [urgencyScore, setUrgencyScore] = useState<number>(5);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [selectedContributorId, setSelectedContributorId] = useState<
    string | null
  >(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);
  const [lockedTransaction, setLockedTransaction] =
    useState<Transaction | null>(null);
  
  const [hasSearched, setHasSearched] = useState(false);

  const searchMutation = useMutation({
    mutationFn: rippleSearch,
    onSuccess: (data) => {
      setSearchError(null);
      setContributors(data);
      setSelectedContributorId(data[0]?._id ?? null);
      setHasSearched(true);
    },
    onError: (error) => {
      setSearchError(
        getApiErrorMessage(error, t("Unable to run ripple search")),
      );
      setContributors([]);
      setSelectedContributorId(null);
      setHasSearched(true);
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: updateMyLocation,
  });

  const lockMutation = useMutation({
    mutationFn: lockEscrow,
    onSuccess: (data) => {
      setLockedTransaction(data.transaction);
      setLockError(null);
      setActiveTransaction({
        id: data.transaction._id,
        status: data.transaction.status,
      });
    },
    onError: (error) => {
      setLockError(getApiErrorMessage(error, t("Unable to lock escrow")));
      setLockedTransaction(null);
    },
  });

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setPermissionState("denied");
      setSearchError(t("Geolocation is not supported in this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPermissionState("granted");
        setSearchError(null);
        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(nextCoords);
        updateLocationMutation.mutate(nextCoords);
        // Reset subsequent steps if location changes
        setHasSearched(false);
        setContributors([]);
      },
      () => {
        setPermissionState("denied");
        setSearchError(
          t("Location permission denied. Enable location and retry."),
        );
      },
    );
  };

  const runSearch = () => {
    if (!coords) {
      setSearchError(t("Location is required before ripple search"));
      return;
    }

    setUserStatus("ACTIVE_BENEFICIARY");
    searchMutation.mutate({
      lat: coords.lat,
      lng: coords.lng,
      urgency_score: urgencyScore,
      city: city || undefined,
      requester_user_id: userId || undefined,
    });
  };

  const confirmAndLock = () => {
    if (!userId) {
      setLockError(t("Missing beneficiary session. Login again."));
      return;
    }

    lockMutation.mutate({
      beneficiary_id: userId,
      contributor_id: selectedContributorId || undefined,
      city: city || undefined,
    });
  };

  // derived state for steps
  const step1Complete = permissionState === "granted" && coords !== null;
  const step2Active = step1Complete && !lockedTransaction;
  const step2Complete = hasSearched && contributors.length > 0;
  const step3Active = step2Complete && !lockedTransaction;
  const isLocked = lockedTransaction !== null;

  return (
    <section className="card stack" style={{ padding: "0", overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <PageHeader
          title={t("Emergency LPG Request")}
          subtitle={t(
            "Allow location, find verified nearby contributors, then lock escrow.",
          )}
        />
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* STEP 1: LOCATION */}
        <div style={{
          display: "flex", 
          flexDirection: "column", 
          gap: "16px",
          opacity: isLocked ? 0.6 : 1,
          transition: "opacity 0.2s"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "36px", height: "36px", borderRadius: "50%", 
              display: "flex", alignItems: "center", justifyContent: "center",
              background: step1Complete ? "var(--success)" : "var(--brand-100)",
              color: step1Complete ? "#fff" : "var(--brand-700)"
            }}>
              {step1Complete ? <CheckCircle2 size={20} /> : 1}
            </div>
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPinned size={22} className="muted-text"/>
              {t("Step 1: Location permission")}
            </h2>
          </div>
          
          <div className="card subtle-card" style={{ marginLeft: "18px", borderLeft: step1Complete ? "2px solid var(--success)" : "2px solid var(--border-default)" }}>
            <p className="muted-text" style={{ marginTop: 0 }}>
              {t("Geolocation is mandatory. Manual latitude/longitude entry is disabled.")}
            </p>
            <div className="row gap-12" style={{ alignItems: "center" }}>
              <button
                className={step1Complete ? "secondary-btn" : "primary-btn"}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                type="button"
                onClick={requestLocation}
                disabled={isLocked}
              >
                {step1Complete ? <RefreshCw size={16} /> : <MapPinOff size={16} />}
                {step1Complete ? t("Refresh location") : t("Grant location permission")}
              </button>
              {step1Complete && coords && (
                <StatusChip
                  label={`Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`}
                  tone="success"
                />
              )}
              {permissionState === "denied" && (
                <StatusChip label={t("Permission denied")} tone="error" />
              )}
            </div>
          </div>
        </div>

        {/* STEP 2: SEARCH */}
        <div style={{
          display: "flex", 
          flexDirection: "column", 
          gap: "16px",
          opacity: step2Active ? (isLocked ? 0.6 : 1) : 0.4,
          pointerEvents: step2Active && !isLocked ? "auto" : "none",
          transition: "opacity 0.2s"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "36px", height: "36px", borderRadius: "50%", 
              display: "flex", alignItems: "center", justifyContent: "center",
              background: step2Complete ? "var(--success)" : (step2Active ? "var(--brand-100)" : "var(--bg-base)"),
              color: step2Complete ? "#fff" : (step2Active ? "var(--brand-700)" : "var(--text-secondary)"),
              border: step2Active || step2Complete ? "none" : "1px solid var(--border-default)"
            }}>
              {step2Complete ? <CheckCircle2 size={20} /> : 2}
            </div>
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={22} className="muted-text"/>
              {t("Step 2: Ripple contributor search")}
            </h2>
          </div>

          <div className="card" style={{ marginLeft: "18px", borderLeft: step2Complete ? "2px solid var(--success)" : (step2Active ? "2px solid var(--brand-400)" : "2px solid transparent") }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "400px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                    <FlameIcon size={16} color="var(--brand-600)"/> 
                    {t("Urgency score (0-10)")}
                  </label>
                  <span style={{ 
                    background: "var(--brand-100)", color: "var(--brand-800)", 
                    padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" 
                  }}>
                    {urgencyScore}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={urgencyScore}
                  onChange={(event) => setUrgencyScore(Number(event.target.value))}
                  style={{ width: "100%", accentColor: "var(--brand-600)", cursor: "pointer", height: "6px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  <span>Low</span>
                  <span>Critical</span>
                </div>
              </div>

              <div>
                <button
                  className="primary-btn"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  type="button"
                  onClick={runSearch}
                  disabled={!step1Complete || searchMutation.isPending}
                >
                  {searchMutation.isPending ? (
                    <RefreshCw size={18} className="spin" style={{ animation: "spin 1s linear infinite" }}/>
                  ) : (
                    <Search size={18} />
                  )}
                  {searchMutation.isPending
                    ? t("Searching contributors...")
                    : step2Complete ? t("Search Again") : t("Run ripple search")}
                </button>
              </div>

              {searchError && (
                <div className="error-banner" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={18} />
                  <p style={{ margin: 0 }}>{searchError}</p>
                </div>
              )}

              {hasSearched && contributors.length === 0 && !searchMutation.isPending && !searchError && (
                <div className="empty-state" style={{ background: "var(--bg-subtle)", border: "1px dashed var(--border-default)" }}>
                  <Radio size={32} color="var(--text-secondary)" style={{ opacity: 0.5, margin: "0 auto" }}/>
                  <p style={{ textAlign: "center", margin: 0, fontWeight: 500 }}>{t("No listed contributors found nearby.")}</p>
                  <p className="muted-text" style={{ textAlign: "center", margin: 0 }}>
                    {t("Retry search after location refresh or increase urgency score.")}
                  </p>
                </div>
              )}

              {contributors.length > 0 && (
                <div className="list-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                  {contributors.map((person) => {
                    const isSelected = selectedContributorId === person._id;
                    const distance =
                      typeof person.distance_km === "number"
                        ? person.distance_km.toFixed(2)
                        : "N/A";

                    return (
                      <button
                        type="button"
                        key={person._id}
                        className={`contributor-card ${isSelected ? "selected-card" : ""}`}
                        style={{ 
                          display: "flex", flexDirection: "column", gap: "4px", textAlign: "left",
                          border: isSelected ? "2px solid var(--brand-600)" : "1px solid var(--border-default)",
                          background: isSelected ? "var(--brand-100)" : "var(--bg-base)",
                          position: "relative",
                          overflow: "hidden"
                        }}
                        onClick={() => setSelectedContributorId(person._id)}
                      >
                        {isSelected && (
                          <div style={{ position: "absolute", top: "8px", right: "8px", color: "var(--brand-600)" }}>
                            <CheckCircle2 size={20} />
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <div style={{ background: "var(--bg-subtle)", padding: "6px", borderRadius: "50%" }}>
                            <User size={16} color="var(--text-secondary)"/>
                          </div>
                          <span style={{ fontWeight: 600 }}>{person.phone || person.email || t("Contributor")}</span>
                        </div>
                        <p className="mono" style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>ID: {person._id.split("-")[0]}...</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                          <MapPin size={14} color="var(--brand-600)"/>
                          <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{distance} km away</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STEP 3: LOCK ESCROW */}
        <div style={{
          display: "flex", 
          flexDirection: "column", 
          gap: "16px",
          opacity: step3Active || isLocked ? 1 : 0.4,
          pointerEvents: step3Active || isLocked ? "auto" : "none",
          transition: "opacity 0.2s"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "36px", height: "36px", borderRadius: "50%", 
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isLocked ? "var(--success)" : (step3Active ? "var(--brand-100)" : "var(--bg-base)"),
              color: isLocked ? "#fff" : (step3Active ? "var(--brand-700)" : "var(--text-secondary)"),
              border: step3Active || isLocked ? "none" : "1px solid var(--border-default)"
            }}>
              {isLocked ? <CheckCircle2 size={20} /> : 3}
            </div>
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={22} className={isLocked ? "success-text" : "muted-text"}/>
              {t("Step 3: Confirm request & lock escrow")}
            </h2>
          </div>

          <div style={{ marginLeft: "18px", borderLeft: isLocked ? "2px solid var(--success)" : "2px solid transparent", paddingLeft: "20px" }}>
            {!isLocked ? (
              <div className="card subtle-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p className="muted-text" style={{ margin: 0 }}>
                  {t("If no contributor is selected, request is still broadcast as a city notification and contributors can accept later.")}
                </p>
                {selectedContributorId && (
                  <div style={{ background: "var(--brand-100)", padding: "12px", borderRadius: "8px", border: "1px solid var(--brand-600)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--brand-800)", fontWeight: 600, textTransform: "uppercase" }}>
                      {t("Selected Contributor")}
                    </span>
                    <span className="mono" style={{ color: "var(--brand-800)" }}>{selectedContributorId}</span>
                  </div>
                )}

                <div>
                  <button
                    className="primary-btn"
                    style={{ 
                      width: "100%", padding: "14px", fontSize: "1.1rem", 
                      display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                      background: "var(--success)" 
                    }}
                    type="button"
                    onClick={confirmAndLock}
                    disabled={lockMutation.isPending || !step2Complete}
                  >
                    {lockMutation.isPending ? (
                      <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }}/> 
                    ) : (
                      <Lock size={20} />
                    )}
                    {lockMutation.isPending
                      ? t("Locking escrow...")
                      : t("Confirm emergency request")}
                  </button>
                </div>

                {lockError && (
                  <div className="error-banner" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={18} />
                    <p style={{ margin: 0 }}>{lockError}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="success-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 color="var(--success)" size={28} />
                  <h3 style={{ margin: 0, color: "var(--success)" }}>{t("Escrow locked successfully")}</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", background: "rgba(255,255,255,0.5)", padding: "12px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    {t("Transaction ID")}
                  </span>
                  <span className="mono" style={{ fontSize: "1rem" }}>{lockedTransaction._id}</span>
                </div>
                <div style={{ marginTop: "4px" }}>
                  <StatusChip
                    label={tStatus(lockedTransaction.status)}
                    tone="success"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
