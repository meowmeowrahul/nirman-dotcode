import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { calculateEscrow, releaseEscrow } from "../../api/endpoints";
import { getApiErrorMessage, getApiErrorPayload } from "../../api/error";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";
import type { Transaction } from "../../types/domain";
import { useI18n } from "../../i18n/language";

function getStateGuidance(
  error: string,
  t: (text: string) => string,
): string | null {
  if (error.includes("release requires VERIFIED or IN_TRANSIT")) {
    return t(
      "Next valid step: verify the transaction first, then handover if needed.",
    );
  }
  if (error.includes("calculation requires PAID_IN_ESCROW")) {
    return t(
      "Next valid step: use calculate only when status is PAID_IN_ESCROW.",
    );
  }
  return null;
}

export function EscrowClosurePage() {
  const { t, tStatus } = useI18n();
  const [transactionId, setTransactionId] = useState("");
  const [actualGasKg, setActualGasKg] = useState<number>(0);
  const [serialNumber, setSerialNumber] = useState("");

  const [calcError, setCalcError] = useState<string | null>(null);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const calculateMutation = useMutation({
    mutationFn: calculateEscrow,
    onSuccess: (response) => {
      setTransaction(response.transaction);
      setCalcError(null);
    },
    onError: (error) => {
      setCalcError(getApiErrorMessage(error, t("Unable to calculate escrow")));
    },
  });

  const releaseMutation = useMutation({
    mutationFn: releaseEscrow,
    onSuccess: (response) => {
      setTransaction(response.transaction);
      setReleaseError(null);
    },
    onError: (error) => {
      setReleaseError(getApiErrorMessage(error, t("Unable to release escrow")));
    },
  });

  const calcPayload = getApiErrorPayload(calculateMutation.error);

  return (
    <section className="card stack">
      <PageHeader
        title={t("Escrow Closure / Return")}
        subtitle={t(
          "Calculate payout from measured gas, then release escrow with serial validation.",
        )}
      />

      <div className="card stack">
        <h2>{t("Step 1: Calculate final payout")}</h2>
        <label className="field">
          <span>{t("Transaction ID")}</span>
          <input
            value={transactionId}
            onChange={(event) => setTransactionId(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{t("Actual gas (kg)")}</span>
          <input
            type="number"
            step="0.001"
            value={actualGasKg}
            onChange={(event) => setActualGasKg(Number(event.target.value))}
          />
        </label>

        <button
          className="primary-btn"
          type="button"
          onClick={() =>
            calculateMutation.mutate({
              transaction_id: transactionId,
              actual_gas_kg: actualGasKg,
            })
          }
          disabled={calculateMutation.isPending}
        >
          {calculateMutation.isPending
            ? t("Calculating...")
            : t("Calculate escrow")}
        </button>

        {calcError && <p className="error-banner">{calcError}</p>}
        {calcError && getStateGuidance(calcError, t) && (
          <p className="muted-text">{getStateGuidance(calcError, t)}</p>
        )}

        {calcPayload?.flagged && (
          <div className="warning-panel">
            <h3>{t("Overweight flagged")}</h3>
            <p className="muted-text">
              {t("Capacity exceeded. Resolve before release.")}
            </p>
            <p className="mono">
              {t("Capped payout")}:{" "}
              {calcPayload.capped_final_gas_payout ?? "N/A"}
            </p>
          </div>
        )}
      </div>

      <div className="card stack">
        <h2>{t("Step 2: Release escrow")}</h2>
        <label className="field">
          <span>
            {t("Serial number (required when backend has expected serial)")}
          </span>
          <input
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
          />
        </label>

        <button
          className="primary-btn"
          type="button"
          onClick={() =>
            releaseMutation.mutate({
              transaction_id: transactionId,
              serial_number:
                serialNumber.trim().length > 0 ? serialNumber : undefined,
            })
          }
          disabled={releaseMutation.isPending}
        >
          {releaseMutation.isPending
            ? t("Releasing escrow...")
            : t("Release escrow")}
        </button>

        {releaseError && <p className="error-banner">{releaseError}</p>}
        {releaseError && getStateGuidance(releaseError, t) && (
          <p className="muted-text">{getStateGuidance(releaseError, t)}</p>
        )}
      </div>

      {transaction && (
        <div className="success-panel">
          <h3>{t("Payout summary")}</h3>
          <div className="info-grid">
            <div>
              <p className="muted-text">{t("Transaction")}</p>
              <p className="mono">{transaction._id}</p>
            </div>
            <div>
              <p className="muted-text">{t("Status")}</p>
              <StatusChip
                label={tStatus(transaction.status)}
                tone={transaction.status === "COMPLETED" ? "success" : "info"}
              />
            </div>
            <div>
              <p className="muted-text">{t("Final gas payout")}</p>
              <p className="success-text">
                {transaction.escrow.final_gas_payout ?? 0}
              </p>
            </div>
            <div>
              <p className="muted-text">{t("Refund to beneficiary")}</p>
              <p className="success-text">
                {transaction.escrow.refund_to_beneficiary ?? 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
