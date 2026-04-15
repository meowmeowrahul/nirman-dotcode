import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { calculateEscrow, releaseEscrow } from "../../api/endpoints";
import { getApiErrorMessage, getApiErrorPayload } from "../../api/error";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";
import type { Transaction } from "../../types/domain";

function getStateGuidance(error: string): string | null {
  if (error.includes("release requires VERIFIED or IN_TRANSIT")) {
    return "Next valid step: verify the transaction first, then handover if needed.";
  }
  if (error.includes("calculation requires PAID_IN_ESCROW")) {
    return "Next valid step: use calculate only when status is PAID_IN_ESCROW.";
  }
  return null;
}

export function EscrowClosurePage() {
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
      setCalcError(getApiErrorMessage(error, "Unable to calculate escrow"));
    },
  });

  const releaseMutation = useMutation({
    mutationFn: releaseEscrow,
    onSuccess: (response) => {
      setTransaction(response.transaction);
      setReleaseError(null);
    },
    onError: (error) => {
      setReleaseError(getApiErrorMessage(error, "Unable to release escrow"));
    },
  });

  const calcPayload = getApiErrorPayload(calculateMutation.error);

  return (
    <section className="card stack">
      <PageHeader
        title="Escrow Closure / Return"
        subtitle="Calculate payout from measured gas, then release escrow with serial validation."
      />

      <div className="card stack">
        <h2>Step 1: Calculate final payout</h2>
        <label className="field">
          <span>Transaction ID</span>
          <input
            value={transactionId}
            onChange={(event) => setTransactionId(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Actual gas (kg)</span>
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
          {calculateMutation.isPending ? "Calculating..." : "Calculate escrow"}
        </button>

        {calcError && <p className="error-banner">{calcError}</p>}
        {calcError && getStateGuidance(calcError) && (
          <p className="muted-text">{getStateGuidance(calcError)}</p>
        )}

        {calcPayload?.flagged && (
          <div className="warning-panel">
            <h3>Overweight flagged</h3>
            <p className="muted-text">
              Capacity exceeded. Resolve before release.
            </p>
            <p className="mono">
              Capped payout: {calcPayload.capped_final_gas_payout ?? "N/A"}
            </p>
          </div>
        )}
      </div>

      <div className="card stack">
        <h2>Step 2: Release escrow</h2>
        <label className="field">
          <span>Serial number (required when backend has expected serial)</span>
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
          {releaseMutation.isPending ? "Releasing escrow..." : "Release escrow"}
        </button>

        {releaseError && <p className="error-banner">{releaseError}</p>}
        {releaseError && getStateGuidance(releaseError) && (
          <p className="muted-text">{getStateGuidance(releaseError)}</p>
        )}
      </div>

      {transaction && (
        <div className="success-panel">
          <h3>Payout summary</h3>
          <div className="info-grid">
            <div>
              <p className="muted-text">Transaction</p>
              <p className="mono">{transaction._id}</p>
            </div>
            <div>
              <p className="muted-text">Status</p>
              <StatusChip
                label={transaction.status}
                tone={transaction.status === "COMPLETED" ? "success" : "info"}
              />
            </div>
            <div>
              <p className="muted-text">Final gas payout</p>
              <p className="success-text">
                {transaction.escrow.final_gas_payout ?? 0}
              </p>
            </div>
            <div>
              <p className="muted-text">Refund to beneficiary</p>
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
