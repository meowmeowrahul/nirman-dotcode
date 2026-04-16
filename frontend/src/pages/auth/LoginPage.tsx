import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../api/endpoints";
import { getApiErrorMessage } from "../../api/error";
import { useAuthStore } from "../../store/authStore";
import { User, Lock, Eye, EyeOff, ShieldCheck, Shield } from "lucide-react";
import { translateStatic, useI18n } from "../../i18n/language";
import "./auth.css";

const loginSchema = z.object({
  identity: z
    .string()
    .trim()
    .min(3, translateStatic("Enter valid mobile or email")),
  password: z.string().min(1, translateStatic("Password is required")),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [activeTab, setActiveTab] = useState<"Citizen" | "Warden" | "Tech">(
    "Citizen",
  );
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identity: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (response) => {
      login(response.token);
      navigate("/dashboard");
    },
    onError: (error) => {
      setError("root", {
        message: getApiErrorMessage(error, t("Unable to login")),
      });
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    // Basic heuristics for email vs phone
    const isEmail = values.identity.includes("@");
    loginMutation.mutate({
      email: isEmail ? values.identity : undefined,
      phone: !isEmail ? values.identity : undefined,
      password: values.password,
    });
  };

  return (
    <div className="auth-shell">
      <div className="auth-header">
        <div className="auth-logo-box">
          <img
            src="/sahaylpg-logo.png"
            alt="SahayLPG logo"
            className="auth-logo-image"
          />
        </div>
        <h1 className="auth-title">SahayLPG</h1>
        <p className="auth-subtitle">{t("Government Oversight Active")}</p>
      </div>

      <main className="auth-card-modern">
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === "Citizen" ? "active" : ""}`}
            onClick={() => setActiveTab("Citizen")}
          >
            {t("Citizen")}
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "Warden" ? "active" : ""}`}
            onClick={() => setActiveTab("Warden")}
          >
            {t("Warden")}
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "Tech" ? "active" : ""}`}
            onClick={() => setActiveTab("Tech")}
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
              <Link to="#" className="auth-forgot">
                {t("Forgot?")}
              </Link>
            </div>
            <div className="auth-input-wrap">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="auth-input"
                placeholder={t("Enter password")}
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

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? t("Signing in...") : t("Secure Sign In")}
          </button>
        </form>

        <div className="auth-divider"></div>

        <p className="auth-signup-text">
          {t("New to SahayLPG?")}{" "}
          <Link to="/register" className="auth-signup-link">
            {t("Create")} {t(activeTab)} {t("Account")}
          </Link>
        </p>
      </main>

      <div className="auth-badges">
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
          <Link to="/privacy-policy" className="auth-footer-link">
            {t("Privacy Policy")}
          </Link>
          <Link to="/emergency-terms" className="auth-footer-link">
            {t("Emergency Terms")}
          </Link>
          <a
            href="https://github.com/meowmeowrahul/nirman-dotcode"
            target="_blank"
            rel="noopener noreferrer"
            className="auth-footer-link"
          >
            {t("Github")}
          </a>
        </div>
      </footer>
    </div>
  );
}
