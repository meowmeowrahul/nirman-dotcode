import { Navigate, Outlet } from "react-router-dom";
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
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const profileCompleted = useAuthStore((state) => state.profileCompleted);

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!profileCompleted) {
    return <Navigate to="/profile-completion" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
