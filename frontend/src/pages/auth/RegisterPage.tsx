import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/endpoints";
import { getApiErrorMessage } from "../../api/error";
import type { Role } from "../../types/domain";

const registerSchema = z
  .object({
    role: z.enum(["BENEFICIARY", "CONTRIBUTOR", "TECHNICIAN", "WARDEN"]),
    email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .min(10, "Enter valid phone number")
      .optional()
      .or(z.literal("")),
    password: z.string().min(1, "Password is required"),
    region_id: z.string().trim().optional(),
    omc_id: z.string().trim().optional(),
    masked_aadhar: z.string().trim().optional(),
    locationLat: z.coerce.number().optional(),
    locationLng: z.coerce.number().optional(),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: "Either email or phone is required",
    path: ["email"],
  });

type RegisterFormValues = z.input<typeof registerSchema>;
type RegisterSubmitValues = z.output<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterSubmitValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "BENEFICIARY",
      email: "",
      phone: "",
      password: "",
      region_id: "",
      omc_id: "",
      masked_aadhar: "",
    },
  });

  const role = watch("role");

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      navigate("/login");
    },
    onError: (error) => {
      setError("root", {
        message: getApiErrorMessage(error, "Registration failed"),
      });
    },
  });

  const onSubmit = (values: RegisterSubmitValues) => {
    const payload: {
      role: Role;
      email?: string;
      phone?: string;
      password: string;
      region_id?: string;
      kyc?: { omc_id?: string; masked_aadhar?: string };
      location?: { type: "Point"; coordinates: [number, number] };
    } = {
      role: values.role,
      email: values.email || undefined,
      phone: values.phone || undefined,
      password: values.password,
    };

    if (values.region_id) {
      payload.region_id = values.region_id;
    }

    if (values.omc_id || values.masked_aadhar) {
      payload.kyc = {
        omc_id: values.omc_id || undefined,
        masked_aadhar: values.masked_aadhar || undefined,
      };
    }

    if (
      typeof values.locationLng === "number" &&
      typeof values.locationLat === "number"
    ) {
      payload.location = {
        type: "Point",
        coordinates: [values.locationLng, values.locationLat],
      };
    }

    registerMutation.mutate(payload);
  };

  return (
    <div className="auth-shell">
      <section className="card auth-card">
        <h1>Create account</h1>
        <p className="muted-text">
          Register first, then login to start role-based workflows.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="stack">
          <label className="field">
            <span>Role</span>
            <select {...register("role")}>
              <option value="BENEFICIARY">Beneficiary</option>
              <option value="CONTRIBUTOR">Contributor</option>
              <option value="TECHNICIAN">Technician</option>
              <option value="WARDEN">Warden</option>
            </select>
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" {...register("email")} />
            {errors.email && (
              <small className="error-text">{errors.email.message}</small>
            )}
          </label>

          <label className="field">
            <span>Phone</span>
            <input type="tel" {...register("phone")} />
            {errors.phone && (
              <small className="error-text">{errors.phone.message}</small>
            )}
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" {...register("password")} />
            {errors.password && (
              <small className="error-text">{errors.password.message}</small>
            )}
          </label>

          {(role === "TECHNICIAN" || role === "WARDEN") && (
            <label className="field">
              <span>Region ID</span>
              <input {...register("region_id")} placeholder="R-01" />
            </label>
          )}

          {(role === "BENEFICIARY" || role === "CONTRIBUTOR") && (
            <>
              <label className="field">
                <span>OMC ID (optional)</span>
                <input {...register("omc_id")} placeholder="OMC-1234" />
              </label>
              <label className="field">
                <span>Masked Aadhar (optional)</span>
                <input
                  {...register("masked_aadhar")}
                  placeholder="XXXX-XXXX-1234"
                />
              </label>
            </>
          )}

          <details className="details-block">
            <summary>Optional location seed</summary>
            <div className="grid-2 mt-12">
              <label className="field">
                <span>Latitude</span>
                <input type="number" step="any" {...register("locationLat")} />
              </label>
              <label className="field">
                <span>Longitude</span>
                <input type="number" step="any" {...register("locationLng")} />
              </label>
            </div>
          </details>

          {errors.root?.message && (
            <p className="error-banner">{errors.root.message}</p>
          )}

          <button
            className="primary-btn"
            type="submit"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="helper-text">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </div>
  );
}
