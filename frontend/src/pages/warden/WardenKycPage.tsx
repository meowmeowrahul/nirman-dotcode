import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { updateKycStatus } from "../../api/endpoints";
import { getApiErrorMessage } from "../../api/error";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";
import type { KycStatus, User } from "../../types/domain";

const statuses: KycStatus[] = ["PENDING", "VERIFIED", "REJECTED"];

export function WardenKycPage() {
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
      setErrorMessage(getApiErrorMessage(error, "Unable to update KYC status"));
      setUpdatedUser(null);
    },
  });

  const submit = () => {
    if (!statuses.includes(status)) {
      setErrorMessage("Invalid KYC status selection");
      return;
    }

    if (!userId.trim()) {
      setErrorMessage("User ID is required");
      return;
    }

    mutation.mutate({ userId: userId.trim(), status });
  };

  return (
    <section className="card stack">
      <PageHeader
        title="Warden KYC Governance"
        subtitle="Review user KYC and update status to PENDING, VERIFIED, or REJECTED."
      />

      <label className="field">
        <span>User ID</span>
        <input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="Mongo user id"
        />
      </label>

      <label className="field">
        <span>KYC status</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as KycStatus)}
        >
          {statuses.map((item) => (
            <option value={item} key={item}>
              {item}
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
        {mutation.isPending ? "Updating status..." : "Update KYC status"}
      </button>

      {errorMessage && <p className="error-banner">{errorMessage}</p>}
      {(errorMessage?.includes("forbidden") ||
        errorMessage?.includes("missing role in token")) && (
        <p className="muted-text">
          Permission issue detected. Return to dashboard and re-login with
          WARDEN role.
        </p>
      )}
      {errorMessage?.includes("user not found") && (
        <p className="muted-text">
          No user found for this ID. Verify and retry safely.
        </p>
      )}

      {updatedUser && (
        <div className="success-panel stack">
          <h3>KYC status updated</h3>
          <div className="row gap-12">
            <StatusChip
              label={updatedUser.kyc?.status ?? status}
              tone={
                (updatedUser.kyc?.status ?? status) === "VERIFIED"
                  ? "success"
                  : (updatedUser.kyc?.status ?? status) === "REJECTED"
                    ? "error"
                    : "pending"
              }
            />
            {auditTime && (
              <span className="muted-text">Audit timestamp: {auditTime}</span>
            )}
          </div>
          <p className="mono">User: {updatedUser._id}</p>
        </div>
      )}
    </section>
  );
}
