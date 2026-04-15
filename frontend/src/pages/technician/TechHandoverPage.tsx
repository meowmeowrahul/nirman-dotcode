import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { handoverTransaction } from "../../api/endpoints";
import { getApiErrorMessage, getApiErrorPayload } from "../../api/error";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";
import { useTransactionStore } from "../../store/transactionStore";

export function TechHandoverPage() {
  const latestTransaction = useTransactionStore(
    (state) => state.latestTransaction,
  );
  const setLatestTransaction = useTransactionStore(
    (state) => state.setLatestTransaction,
  );

  const [transactionId, setTransactionId] = useState(
    latestTransaction?._id ?? "",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handoverMutation = useMutation({
    mutationFn: handoverTransaction,
    onSuccess: (response) => {
      setLatestTransaction(response.transaction);
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Handover failed"));
    },
  });

  const apiPayload = getApiErrorPayload(handoverMutation.error);
  const isRegionMismatch = apiPayload?.error === "forbidden: region mismatch";

  const submit = () => {
    if (!transactionId.trim()) {
      setErrorMessage("Transaction ID is required");
      return;
    }
    handoverMutation.mutate(transactionId.trim());
  };

  return (
    <section className="card stack">
      <PageHeader
        title="Technician Handover"
        subtitle="Move only VERIFIED transactions to IN_TRANSIT."
      />

      <label className="field">
        <span>Transaction ID</span>
        <input
          value={transactionId}
          onChange={(event) => setTransactionId(event.target.value)}
          disabled={isRegionMismatch}
        />
      </label>

      <button
        className="primary-btn"
        type="button"
        disabled={handoverMutation.isPending || isRegionMismatch}
        onClick={submit}
      >
        {handoverMutation.isPending
          ? "Processing handover..."
          : "Complete handover"}
      </button>

      {isRegionMismatch && (
        <div className="error-panel">
          <h3>Region mismatch lockout</h3>
          <p className="muted-text">
            Technician region does not match transaction region.
          </p>
        </div>
      )}

      {errorMessage && <p className="error-banner">{errorMessage}</p>}

      {handoverMutation.data?.transaction && (
        <div className="success-panel">
          <StatusChip
            label={handoverMutation.data.transaction.status}
            tone="info"
          />
          <p className="mono">
            Transaction: {handoverMutation.data.transaction._id}
          </p>
        </div>
      )}
    </section>
  );
}
