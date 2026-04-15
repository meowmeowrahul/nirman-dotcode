import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../store/authStore";

const profileSchema = z.object({
  omcId: z.string().min(2, "OMC ID is required"),
  maskedAadhar: z.string().min(4, "Masked Aadhar is required"),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileCompletionPage() {
  const navigate = useNavigate();
  const completeProfile = useAuthStore((state) => state.completeProfile);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      omcId: "",
      maskedAadhar: "",
    },
  });

  const onSubmit = (values: ProfileValues) => {
    completeProfile(values);
    navigate("/dashboard");
  };

  return (
    <div className="auth-shell">
      <section className="card auth-card">
        <h1>Complete profile</h1>
        <p className="muted-text">
          Complete KYC details before dashboard access.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="stack">
          <label className="field">
            <span>OMC ID</span>
            <input {...register("omcId")} placeholder="OMC-1234" />
            {errors.omcId && (
              <small className="error-text">{errors.omcId.message}</small>
            )}
          </label>

          <label className="field">
            <span>Masked Aadhar</span>
            <input {...register("maskedAadhar")} placeholder="XXXX-XXXX-1234" />
            {errors.maskedAadhar && (
              <small className="error-text">
                {errors.maskedAadhar.message}
              </small>
            )}
          </label>

          <button className="primary-btn" type="submit">
            Save profile and continue
          </button>
        </form>
      </section>
    </div>
  );
}
