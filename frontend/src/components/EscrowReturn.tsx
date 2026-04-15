import { useMutation } from "@tanstack/react-query";
import { releaseEscrow } from "../api/endpoints";
import { getApiErrorMessage } from "../api/error";
import type { UserTransactionView } from "../types/domain";

interface EscrowReturnProps {
  transaction: UserTransactionView;
  onAcknowledgeSuccess?: () => void;
}

export function EscrowReturn({
  transaction,
  onAcknowledgeSuccess,
}: EscrowReturnProps) {
  const acknowledgeMutation = useMutation({
    mutationFn: () =>
      releaseEscrow({
        transaction_id: transaction.id,
      }),
    onSuccess: () => {
      if (onAcknowledgeSuccess) {
        onAcknowledgeSuccess();
      }
    },
  });

  return (
    <section
      style={{
        background: "#FFFFFF",
        border: "1px solid #CBD5E1",
        borderRadius: 4,
        padding: "1rem",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#1E3A8A" }}>Escrow Return</h3>
      <p style={{ color: "#334155" }}>
        The transaction is completed and empty bottle return can be acknowledged.
      </p>
      <button
        type="button"
        onClick={() => acknowledgeMutation.mutate()}
        disabled={acknowledgeMutation.isPending}
        style={{
          background: "#059669",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 4,
          padding: "0.65rem 1rem",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {acknowledgeMutation.isPending
          ? "Acknowledging..."
          : "Acknowledge Empty Bottle Return"}
      </button>
      {acknowledgeMutation.isError && (
        <p style={{ color: "#B91C1C", marginBottom: 0 }}>
          {getApiErrorMessage(
            acknowledgeMutation.error,
            "Unable to acknowledge return"
          )}
        </p>
      )}
      {acknowledgeMutation.isSuccess && (
        <p style={{ color: "#065F46", marginBottom: 0 }}>
          Return acknowledged successfully.
        </p>
      )}
    </section>
  );
}
