import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { handoverTransaction } from "../../api/endpoints";
import { getApiErrorMessage, getApiErrorPayload } from "../../api/error";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";
import { useTransactionStore } from "../../store/transactionStore";
import { useI18n } from "../../i18n/language";

export function TechHandoverPage() {
  const { t, tStatus } = useI18n();
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
      setErrorMessage(getApiErrorMessage(error, t("Handover failed")));
    },
  });

  const apiPayload = getApiErrorPayload(handoverMutation.error);
  const isRegionMismatch = apiPayload?.error === "forbidden: region mismatch";

  const submit = () => {
    if (!transactionId.trim()) {
      setErrorMessage(t("Transaction ID is required"));
      return;
    }
    handoverMutation.mutate(transactionId.trim());
  };

  return (
    <section className="card stack">
      <PageHeader
        title={t("Technician Handover")}
        subtitle={t("Move only VERIFIED transactions to IN_TRANSIT.")}
      />

      <label className="field">
        <span>{t("Transaction ID")}</span>
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
          ? t("Processing handover...")
          : t("Complete handover")}
      </button>

      {isRegionMismatch && (
        <div className="error-panel">
          <h3>{t("Region mismatch lockout")}</h3>
          <p className="muted-text">
            {t("Technician region does not match transaction region.")}
          </p>
        </div>
      )}

      {errorMessage && <p className="error-banner">{errorMessage}</p>}

      {handoverMutation.data?.transaction && (
        <div className="success-panel">
          <StatusChip
            label={tStatus(handoverMutation.data.transaction.status)}
            tone="info"
          />
          <p className="mono">
            {t("Transaction")}: {handoverMutation.data.transaction._id}
          </p>
        </div>
      )}
    </section>
  );
}
