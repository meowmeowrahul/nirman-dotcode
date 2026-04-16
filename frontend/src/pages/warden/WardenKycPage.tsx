import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { updateKycStatus } from "../../api/endpoints";
import { getApiErrorMessage } from "../../api/error";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";
import type { KycStatus, User } from "../../types/domain";
import { useI18n } from "../../i18n/language";

const statuses: KycStatus[] = ["PENDING", "VERIFIED", "REJECTED"];

export function WardenKycPage() {
  const { t, tStatus } = useI18n();
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState<KycStatus>("PENDING");
  const [auditTime, setAuditTime] = useState<string | null>(null);
  const [updatedUser, setUpdatedUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: { userId: string; status: KycStatus }) =>
      updateKycStatus(payload.userId, payload.status),
    onSuccess: (response) => {
      setUpdatedUser(response.user);
      setAuditTime(format(new Date(), "yyyy-MM-dd HH:mm:ss"));
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(
        getApiErrorMessage(error, t("Unable to update KYC status")),
      );
      setUpdatedUser(null);
    },
  });

  const submit = () => {
    if (!statuses.includes(status)) {
      setErrorMessage(t("Invalid KYC status selection"));
      return;
    }

    if (!userId.trim()) {
      setErrorMessage(t("User ID is required"));
      return;
    }

    mutation.mutate({ userId: userId.trim(), status });
  };

  return (
    <section className="card stack">
      <PageHeader
        title={t("Warden KYC Governance")}
        subtitle={t(
          "Review user KYC and update status to PENDING, VERIFIED, or REJECTED.",
        )}
      />

      <label className="field">
        <span>{t("User ID")}</span>
        <input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder={t("Mongo user id")}
        />
      </label>

      <label className="field">
        <span>{t("KYC status")}</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as KycStatus)}
        >
          {statuses.map((item) => (
            <option value={item} key={item}>
              {tStatus(item)}
            </option>
          ))}
        </select>
      </label>

      <button
        className="primary-btn"
        type="button"
        onClick={submit}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? t("Updating status...") : t("Update KYC status")}
      </button>

      {errorMessage && <p className="error-banner">{errorMessage}</p>}
      {(errorMessage?.includes("forbidden") ||
        errorMessage?.includes("missing role in token")) && (
        <p className="muted-text">
          {t(
            "Permission issue detected. Return to dashboard and re-login with WARDEN role.",
          )}
        </p>
      )}
      {errorMessage?.includes("user not found") && (
        <p className="muted-text">
          {t("No user found for this ID. Verify and retry safely.")}
        </p>
      )}

      {updatedUser && (
        <div className="success-panel stack">
          <h3>{t("KYC status updated")}</h3>
          <div className="row gap-12">
            <StatusChip
              label={tStatus(updatedUser.kyc?.status ?? status)}
              tone={
                (updatedUser.kyc?.status ?? status) === "VERIFIED"
                  ? "success"
                  : (updatedUser.kyc?.status ?? status) === "REJECTED"
                    ? "error"
                    : "pending"
              }
            />
            {auditTime && (
              <span className="muted-text">
                {t("Audit timestamp")}: {auditTime}
              </span>
            )}
          </div>
          <p className="mono">
            {t("User")}: {updatedUser._id}
          </p>
        </div>
      )}
    </section>
  );
}
