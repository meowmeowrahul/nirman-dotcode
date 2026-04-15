import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function ProfileGuard() {
  const token = useAuthStore((state) => state.token);
  const profileCompleted = useAuthStore((state) => state.profileCompleted);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (profileCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
