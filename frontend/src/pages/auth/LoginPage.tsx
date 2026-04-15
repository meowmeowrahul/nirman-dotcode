import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../api/endpoints";
import { getApiErrorMessage } from "../../api/error";
import { useAuthStore } from "../../store/authStore";

const loginSchema = z
  .object({
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
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: "Either email or phone is required",
    path: ["email"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      phone: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (response) => {
      login(response.token);
      navigate("/profile-completion");
    },
    onError: (error) => {
      setError("root", {
        message: getApiErrorMessage(error, "Unable to login"),
      });
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      email: values.email || undefined,
      phone: values.phone || undefined,
      password: values.password,
    });
  };

  return (
    <div className="auth-shell">
      <section className="card auth-card">
        <h1>SecureLPG Login</h1>
        <p className="muted-text">
          Sign in with email or phone and continue your role flow.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="stack">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              {...register("email")}
              placeholder="you@example.com"
            />
            {errors.email && (
              <small className="error-text">{errors.email.message}</small>
            )}
          </label>

          <label className="field">
            <span>Phone</span>
            <input type="tel" {...register("phone")} placeholder="9876543210" />
            {errors.phone && (
              <small className="error-text">{errors.phone.message}</small>
            )}
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
            />
            {errors.password && (
              <small className="error-text">{errors.password.message}</small>
            )}
          </label>

          {errors.root?.message && (
            <p className="error-banner">{errors.root.message}</p>
          )}

          <button
            className="primary-btn"
            type="submit"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="helper-text">
          New user? <Link to="/register">Create account</Link>
        </p>
      </section>
    </div>
  );
}
