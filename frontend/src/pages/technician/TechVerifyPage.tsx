import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyTransaction } from "../../api/endpoints";
import { getApiErrorMessage, getApiErrorPayload } from "../../api/error";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";
import { useTransactionStore } from "../../store/transactionStore";
import { translateStatic, useI18n } from "../../i18n/language";

const verifySchema = z
  .object({
    transactionId: z
      .string()
      .min(1, translateStatic("Transaction ID is required")),
    beneficiary_user_id: z
      .string()
      .min(1, translateStatic("Beneficiary user ID is required")),
    serial_number: z
      .string()
      .min(1, translateStatic("Serial number is required")),
    physical_weight: z.coerce.number(),
    tare_weight: z.coerce.number().min(14).max(17),
    safety_passed: z.enum(["true", "false"]),
  })
  .superRefine((values, ctx) => {
    const actualGasKg = Number(
      (values.physical_weight - values.tare_weight).toFixed(3),
    );

    if (actualGasKg <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["physical_weight"],
        message: translateStatic(
          "Physical weight must be greater than tare weight.",
        ),
      });
    }

    if (actualGasKg > 14.2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["physical_weight"],
        message: translateStatic(
          "Actual gas cannot exceed 14.2kg (physical - tare <= 14.2).",
        ),
      });
    }
  });

type VerifyInputValues = z.input<typeof verifySchema>;
type VerifyOutputValues = z.output<typeof verifySchema>;

export function TechVerifyPage() {
  const { t, tStatus } = useI18n();
  const setLatestTransaction = useTransactionStore(
    (state) => state.setLatestTransaction,
  );

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<VerifyInputValues, unknown, VerifyOutputValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      transactionId: "",
      serial_number: "",
      safety_passed: "true",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ transactionId, ...payload }: VerifyOutputValues) =>
      verifyTransaction(transactionId, {
        beneficiary_user_id: payload.beneficiary_user_id,
        serial_number: payload.serial_number,
        physical_weight: payload.physical_weight,
        tare_weight: payload.tare_weight,
        safety_passed: payload.safety_passed === "true",
      }),
    onSuccess: (data) => {
      setLatestTransaction(data.transaction);
      setError("root", { message: "" });
    },
    onError: (error) => {
      setLatestTransaction(null);
      setError("root", {
        message: getApiErrorMessage(error, t("Verification failed")),
      });
    },
  });

  const apiPayload = getApiErrorPayload(verifyMutation.error);
  const isRegionMismatch = apiPayload?.error === "forbidden: region mismatch";
  const physicalWeight = Number(watch("physical_weight"));
  const tareWeight = Number(watch("tare_weight"));
  const hasWeightInputs =
    Number.isFinite(physicalWeight) && Number.isFinite(tareWeight);
  const computedGas = hasWeightInputs
    ? Number((physicalWeight - tareWeight).toFixed(3))
    : null;

  const onSubmit = (values: VerifyOutputValues) => {
    verifyMutation.mutate(values);
  };

  return (
    <section className="card stack">
      <PageHeader
        title={t("Technician Verification")}
        subtitle={t(
          "Submit evidence and safety result for PAID_IN_ESCROW transactions.",
        )}
      />

      {isRegionMismatch && (
        <div className="error-panel">
          <h3>{t("City mismatch lockout")}</h3>
          <p className="muted-text">
            {t(
              "This transaction cannot be edited because your technician city does not match.",
            )}
          </p>
        </div>
      )}

      <form className="stack" onSubmit={handleSubmit(onSubmit)}>
        <label className="field">
          <span>{t("Beneficiary User ID")}</span>
          <input
            {...register("beneficiary_user_id")}
            disabled={isRegionMismatch}
          />
          {errors.beneficiary_user_id && (
            <small className="error-text">
              {errors.beneficiary_user_id.message}
            </small>
          )}
        </label>

        <label className="field">
          <span>{t("Transaction ID")}</span>
          <input {...register("transactionId")} disabled={isRegionMismatch} />
          {errors.transactionId && (
            <small className="error-text">{errors.transactionId.message}</small>
          )}
        </label>

        <label className="field">
          <span>{t("Serial number")}</span>
          <input {...register("serial_number")} disabled={isRegionMismatch} />
          {errors.serial_number && (
            <small className="error-text">{errors.serial_number.message}</small>
          )}
        </label>

        <div className="grid-2">
          <label className="field">
            <span>{t("Physical weight (kg)")}</span>
            <input
              type="number"
              step="0.001"
              {...register("physical_weight")}
              disabled={isRegionMismatch}
            />
            {errors.physical_weight && (
              <small className="error-text">
                {errors.physical_weight.message}
              </small>
            )}
            {!errors.physical_weight && (
              <small className="muted-text">
                {t("Gross cylinder weight. Must be greater than tare.")}
              </small>
            )}
          </label>

          <label className="field">
            <span>{t("Tare weight (kg)")}</span>
            <input
              type="number"
              step="0.001"
              {...register("tare_weight")}
              disabled={isRegionMismatch}
            />
            {errors.tare_weight && (
              <small className="error-text">{errors.tare_weight.message}</small>
            )}
            {!errors.tare_weight && (
              <small className="muted-text">
                {t("Expected shell/tare range: 14.0 to 17.0 kg.")}
              </small>
            )}
          </label>
        </div>

        <div className="subtle-card" style={{ padding: "0.75rem" }}>
          <p className="muted-text" style={{ margin: 0 }}>
            {t(
              "Formula: actual gas = physical weight - tare weight (must be > 0 and <= 14.2).",
            )}
          </p>
          <p className="mono" style={{ margin: "0.45rem 0 0 0" }}>
            {computedGas === null
              ? t("Actual gas: enter both weights")
              : `${t("Actual gas")}: ${computedGas} kg`}
          </p>
          <p className="muted-text" style={{ margin: "0.45rem 0 0 0" }}>
            {t(
              "Example valid pair: tare 14.2, physical 20.5 gives actual gas 6.3 kg.",
            )}
          </p>
        </div>

        <label className="field">
          <span>{t("Safety check")}</span>
          <select {...register("safety_passed")} disabled={isRegionMismatch}>
            <option value="true">{t("Pass")}</option>
            <option value="false">{t("Fail")}</option>
          </select>
        </label>

        {errors.root?.message && errors.root.message.trim().length > 0 && (
          <p className="error-banner">{errors.root.message}</p>
        )}

        {apiPayload?.flagged && (
          <div className="warning-panel">
            <h3>{t("Overweight flagged")}</h3>
            <p className="muted-text">
              {t("actual_gas_kg exceeds 14.2kg capacity.")}
            </p>
            <p className="mono">
              {t("Capped payout")}:{" "}
              {apiPayload.capped_final_gas_payout ?? "N/A"}
            </p>
          </div>
        )}

        <button
          className="primary-btn"
          type="submit"
          disabled={verifyMutation.isPending || isRegionMismatch}
        >
          {verifyMutation.isPending
            ? t("Verifying cylinder...")
            : t("Verify transaction")}
        </button>
      </form>

      {verifyMutation.data?.refunded && (
        <div className="success-panel">
          <StatusChip
            label={`${tStatus("CANCELLED")} + REFUNDED`}
            tone="warning"
          />
          <p className="muted-text">
            {t("Safety failed path completed; no handover required.")}
          </p>
        </div>
      )}

      {verifyMutation.data?.transaction && !verifyMutation.data.refunded && (
        <div className="success-panel">
          <StatusChip
            label={tStatus(verifyMutation.data.transaction.status)}
            tone="success"
          />
          <p className="mono">
            {t("Transaction")}: {verifyMutation.data.transaction._id}
          </p>
          <p className="muted-text">
            {t("Proceed to Handover screen when status is VERIFIED.")}
          </p>
        </div>
      )}
    </section>
  );
}
