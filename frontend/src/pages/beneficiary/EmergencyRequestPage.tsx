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

  const searchMutation = useMutation({
    mutationFn: rippleSearch,
    onSuccess: (data) => {
      setSearchError(null);
      setContributors(data);
      setSelectedContributorId(data[0]?._id ?? null);
    },
    onError: (error) => {
      setSearchError(
        getApiErrorMessage(error, t("Unable to run ripple search")),
      );
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

  return (
    <section className="card stack">
      <PageHeader
        title={t("Emergency LPG Request")}
        subtitle={t(
          "Allow location, find verified nearby contributors, then lock escrow.",
        )}
      />

      <div className="card subtle-card stack">
        <h2>{t("Step 1: Location permission")}</h2>
        <p className="muted-text">
          {t(
            "Geolocation is mandatory. Manual latitude/longitude entry is disabled.",
          )}
        </p>
        <div className="row gap-12">
          <button
            className="primary-btn"
            type="button"
            onClick={requestLocation}
          >
            {permissionState === "granted"
              ? t("Refresh location")
              : t("Grant location permission")}
          </button>
          {permissionState === "granted" && coords && (
            <StatusChip
              label={`Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`}
              tone="info"
            />
          )}
          {permissionState === "denied" && (
            <StatusChip label={t("Permission denied")} tone="error" />
          )}
        </div>
      </div>

      <div className="card stack">
        <h2>{t("Step 2: Ripple contributor search")}</h2>
        <label className="field">
          <span>{t("Urgency score (0-10)")}</span>
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
            ? t("Searching contributors...")
            : t("Run ripple search")}
        </button>

        {searchError && <p className="error-banner">{searchError}</p>}

        {contributors.length === 0 && !searchMutation.isPending && (
          <div className="empty-state">
            <p>{t("No listed contributors found nearby.")}</p>
            <p className="muted-text">
              {t(
                "Retry search after location refresh or increase urgency score.",
              )}
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
                  <p>{person.phone || person.email || t("Contributor")}</p>
                  <p className="metric-text">
                    {t("Distance")}: {distance} km
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="card stack">
        <h2>{t("Step 3: Confirm request and lock escrow")}</h2>
        <p className="muted-text">
          {t(
            "If no contributor is selected, request is still broadcast as a city notification and contributors can accept later.",
          )}
        </p>
        {selectedContributorId && (
          <p className="mono">
            {t("Selected contributor")}: {selectedContributorId}
          </p>
        )}

        <button
          className="primary-btn"
          type="button"
          onClick={confirmAndLock}
          disabled={lockMutation.isPending}
        >
          {lockMutation.isPending
            ? t("Locking escrow...")
            : t("Confirm emergency request")}
        </button>

        {lockError && <p className="error-banner">{lockError}</p>}

        {lockedTransaction && (
          <div className="success-panel">
            <h3>{t("Escrow locked")}</h3>
            <p className="mono">
              {t("Transaction ID")}: {lockedTransaction._id}
            </p>
            <StatusChip
              label={tStatus(lockedTransaction.status)}
              tone="success"
            />
          </div>
        )}
      </div>
    </section>
  );
}
