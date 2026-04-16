import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types/domain";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: ReactNode;
}

export function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const kycStatus = useAuthStore((state) => state.kycStatus);

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const isCitizenRole = role === "BENEFICIARY" || role === "CONTRIBUTOR";
  const canAccessWithoutKyc =
    location.pathname === "/profile" || location.pathname === "/kyc-completion";

  if (isCitizenRole && kycStatus !== "VERIFIED" && !canAccessWithoutKyc) {
    return <Navigate to="/profile" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
