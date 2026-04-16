import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { lockEscrow, rippleSearch, updateMyLocation } from "../../api/endpoints";
import { getApiErrorMessage } from "../../api/error";
import type { Contributor, Transaction } from "../../types/domain";
import { useAuthStore } from "../../store/authStore";
import { useTransactionStore } from "../../store/transactionStore";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";

interface Coordinates {
  lat: number;
  lng: number;
}

export function EmergencyRequestPage() {
  const userId = useAuthStore((state) => state.userId);
  const city = useAuthStore((state) => state.city);
  const setUserStatus = useTransactionStore((state) => state.setUserStatus);
  const setActiveTransaction = useTransactionStore((state) => state.setActiveTransaction);

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

  const searchMutation = useMutation({
    mutationFn: rippleSearch,
    onSuccess: (data) => {
      setSearchError(null);
      setContributors(data);
      setSelectedContributorId(data[0]?._id ?? null);
    },
    onError: (error) => {
      setSearchError(getApiErrorMessage(error, "Unable to run ripple search"));
      setContributors([]);
      setSelectedContributorId(null);
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
      setLockError(getApiErrorMessage(error, "Unable to lock escrow"));
      setLockedTransaction(null);
    },
  });

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setPermissionState("denied");
      setSearchError("Geolocation is not supported in this browser");
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
      },
      () => {
        setPermissionState("denied");
        setSearchError(
          "Location permission denied. Enable location and retry.",
        );
      },
    );
  };

  const runSearch = () => {
    if (!coords) {
      setSearchError("Location is required before ripple search");
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
      setLockError("Missing beneficiary session. Login again.");
      return;
    }

    lockMutation.mutate({
      beneficiary_id: userId,
      contributor_id: selectedContributorId || undefined,
    });
  };

  return (
    <section className="card stack">
      <PageHeader
        title="Emergency LPG Request"
        subtitle="Allow location, find verified nearby contributors, then lock escrow."
      />

      <div className="card subtle-card stack">
        <h2>Step 1: Location permission</h2>
        <p className="muted-text">
          Geolocation is mandatory. Manual latitude/longitude entry is disabled.
        </p>
        <div className="row gap-12">
          <button
            className="primary-btn"
            type="button"
            onClick={requestLocation}
          >
            {permissionState === "granted"
              ? "Refresh location"
              : "Grant location permission"}
          </button>
          {permissionState === "granted" && coords && (
            <StatusChip
              label={`Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`}
              tone="info"
            />
          )}
          {permissionState === "denied" && (
            <StatusChip label="Permission denied" tone="error" />
          )}
        </div>
      </div>

      <div className="card stack">
        <h2>Step 2: Ripple contributor search</h2>
        <label className="field">
          <span>Urgency score (0-10)</span>
          <input
            type="number"
            min={0}
            max={10}
            value={urgencyScore}
            onChange={(event) => setUrgencyScore(Number(event.target.value))}
          />
        </label>
        <button
          className="primary-btn"
          type="button"
          onClick={runSearch}
          disabled={permissionState !== "granted" || searchMutation.isPending}
        >
          {searchMutation.isPending
            ? "Searching contributors..."
            : "Run ripple search"}
        </button>

        {searchError && <p className="error-banner">{searchError}</p>}

        {contributors.length === 0 && !searchMutation.isPending && (
          <div className="empty-state">
            <p>No listed contributors found nearby.</p>
            <p className="muted-text">
              Retry search after location refresh or increase urgency score.
            </p>
          </div>
        )}

        {contributors.length > 0 && (
          <div className="list-grid">
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
                  onClick={() => setSelectedContributorId(person._id)}
                >
                  <p className="mono">{person._id}</p>
                  <p>{person.phone || person.email || "Contributor"}</p>
                  <p className="metric-text">Distance: {distance} km</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="card stack">
        <h2>Step 3: Confirm request and lock escrow</h2>
        <p className="muted-text">
          If no contributor is selected, request is still broadcast as a city
          notification and contributors can accept later.
        </p>
        {selectedContributorId && (
          <p className="mono">Selected contributor: {selectedContributorId}</p>
        )}

        <button
          className="primary-btn"
          type="button"
          onClick={confirmAndLock}
          disabled={lockMutation.isPending}
        >
          {lockMutation.isPending
            ? "Locking escrow..."
            : "Confirm emergency request"}
        </button>

        {lockError && <p className="error-banner">{lockError}</p>}

        {lockedTransaction && (
          <div className="success-panel">
            <h3>Escrow locked</h3>
            <p className="mono">Transaction ID: {lockedTransaction._id}</p>
            <StatusChip label={lockedTransaction.status} tone="success" />
          </div>
        )}
      </div>
    </section>
  );
}
