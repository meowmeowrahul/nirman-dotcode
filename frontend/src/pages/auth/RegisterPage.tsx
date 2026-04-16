import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/endpoints";
import { getApiErrorMessage } from "../../api/error";
import type { Role } from "../../types/domain";
import { SUPPORTED_CITIES } from "../../constants/cities";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Shield,
  MapPin,
  Building,
} from "lucide-react";
import { translateStatic, useI18n } from "../../i18n/language";
import "./auth.css";

const registerSchema = z
  .object({
    role: z.enum(["BENEFICIARY", "CONTRIBUTOR", "TECHNICIAN", "WARDEN"]),
    name: z.string().trim().min(2, translateStatic("Full name is required")),
    identity: z
      .string()
      .trim()
      .min(3, translateStatic("Enter valid mobile or email")),
    password: z.string().min(1, translateStatic("Password is required")),
    city: z.string().trim().min(1, translateStatic("City is required")),
    omc_id: z.string().trim().optional(),
    locationLat: z.coerce.number().optional(),
    locationLng: z.coerce.number().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "BENEFICIARY" && !data.omc_id) {
        return false;
      }
      return true;
    },
    {
      message: translateStatic("OMC ID is required"),
      path: ["omc_id"],
    },
  );

type RegisterFormValues = z.input<typeof registerSchema>;
type RegisterSubmitValues = z.output<typeof registerSchema>;

export function RegisterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterSubmitValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "BENEFICIARY",
      name: "",
      identity: "",
      password: "",
      city: "",
      omc_id: "",
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
        message: getApiErrorMessage(error, t("Registration failed")),
      });
    },
  });

  const onSubmit = (values: RegisterSubmitValues) => {
    const isEmail = values.identity.includes("@");

    const payload: {
      role: Role;
      name: string;
      email?: string;
      phone?: string;
      password: string;
      city?: string;
      region_id?: string;
      kyc?: { omc_id?: string; masked_aadhar?: string };
      location?: { type: "Point"; coordinates: [number, number] };
    } = {
      role: values.role,
      name: values.name,
      email: isEmail ? values.identity : undefined,
      phone: !isEmail ? values.identity : undefined,
      password: values.password,
      city: values.city,
      region_id: values.city,
    };

    if (values.omc_id) {
      payload.kyc = {
        omc_id: values.omc_id,
      };
    }

    if (
      typeof values.locationLng === "number" &&
      typeof values.locationLat === "number" &&
      !isNaN(values.locationLng) &&
      !isNaN(values.locationLat)
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
      <div className="auth-header">
        <div className="auth-logo-box">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="auth-logo-icon"
          >
            <path
              d="M17 8C17 6.89543 16.1046 6 15 6H9C7.89543 6 7 6.89543 7 8V9H17V8Z"
              fill="currentColor"
            />
            <path
              d="M6 11C6 9.89543 6.89543 9 8 9H16C17.1046 9 18 9.89543 18 11V18C18 19.1046 17.1046 20 16 20H8C6.89543 20 6 19.1046 6 18V11Z"
              fill="currentColor"
            />
            <rect
              x="10"
              y="3"
              width="4"
              height="2"
              rx="1"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="auth-title">SahayLPG</h1>
        <p className="auth-subtitle">{t("Create an Account")}</p>
      </div>

      <main
        className="auth-card-modern"
        style={{ marginTop: 0, paddingTop: 24 }}
      >
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${role === "BENEFICIARY" ? "active" : ""}`}
            onClick={() => setValue("role", "BENEFICIARY")}
          >
            {t("Citizen")}
          </button>
          <button
            type="button"
            className={`auth-tab ${role === "WARDEN" ? "active" : ""}`}
            onClick={() => setValue("role", "WARDEN")}
          >
            {t("Warden")}
          </button>
          <button
            type="button"
            className={`auth-tab ${role === "TECHNICIAN" ? "active" : ""}`}
            onClick={() => setValue("role", "TECHNICIAN")}
          >
            {t("Tech")}
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {errors.root?.message && (
            <div className="auth-error-banner">{errors.root.message}</div>
          )}

          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-label">{t("FULL NAME")}</label>
            </div>
            <div className="auth-input-wrap">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                {...register("name")}
                className="auth-input"
                placeholder={t("Enter name as on Aadhar Card")}
              />
            </div>
            {errors.name && (
              <span className="auth-error">{errors.name.message}</span>
            )}
          </div>

          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-label">{t("IDENTITY")}</label>
            </div>
            <div className="auth-input-wrap">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                {...register("identity")}
                className="auth-input"
                placeholder={t("Mobile number or email")}
              />
            </div>
            {errors.identity && (
              <span className="auth-error">{errors.identity.message}</span>
            )}
          </div>

          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-label">{t("SECURITY KEY")}</label>
            </div>
            <div className="auth-input-wrap">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="auth-input"
                placeholder={t("Create password")}
              />
              <button
                type="button"
                className="auth-input-action"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="auth-error">{errors.password.message}</span>
            )}
          </div>

          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-label">{t("CITY")}</label>
            </div>
            <div className="auth-input-wrap">
              <MapPin size={18} className="auth-input-icon" />
              <select {...register("city")} className="auth-input">
                <option value="">{t("Select your city")}</option>
                {SUPPORTED_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            {errors.city && (
              <span className="auth-error">{errors.city.message}</span>
            )}
          </div>

          {role === "BENEFICIARY" && (
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label">{t("OMC ID")}</label>
              </div>
              <div className="auth-input-wrap">
                <Building size={18} className="auth-input-icon" />
                <input
                  type="text"
                  {...register("omc_id")}
                  className="auth-input"
                  placeholder={t("OMC-1234")}
                />
              </div>
              {errors.omc_id && (
                <span className="auth-error">{errors.omc_id.message}</span>
              )}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending
              ? t("Registering...")
              : t("Complete Registration")}
          </button>
        </form>

        <div className="auth-divider"></div>

        <p className="auth-signup-text">
          {t("Already registered?")}{" "}
          <Link to="/login" className="auth-signup-link">
            {t("Secure Sign In")}
          </Link>
        </p>
      </main>

      <div className="auth-badges" style={{ marginTop: 20 }}>
        <div className="auth-badge auth-badge-green">
          <div className="auth-badge-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="auth-badge-content">
            <span className="auth-badge-title">{t("VERIFIED")}</span>
            <span className="auth-badge-text">{t("Govt Secure")}</span>
          </div>
        </div>
        <div className="auth-badge auth-badge-gray">
          <div className="auth-badge-icon">
            <Shield size={20} />
          </div>
          <div className="auth-badge-content">
            <span className="auth-badge-title">{t("PRIVACY")}</span>
            <span className="auth-badge-text">{t("End-to-End")}</span>
          </div>
        </div>
      </div>

      <footer className="auth-footer">
        <p className="auth-footer-title">SahayLPG Ecosystem © 2024</p>
        <div className="auth-footer-links">
          <Link to="#" className="auth-footer-link">
            {t("Privacy Policy")}
          </Link>
          <Link to="#" className="auth-footer-link">
            {t("Emergency Terms")}
          </Link>
          <Link to="#" className="auth-footer-link">
            {t("Support")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
