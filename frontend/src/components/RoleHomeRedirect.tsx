import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function RoleHomeRedirect() {
  const role = useAuthStore((state) => state.role);

  if (role === "BENEFICIARY") {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === "TECHNICIAN") {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === "WARDEN") {
    return <Navigate to="/warden/kyc" replace />;
  }

  return <Navigate to="/escrow/closure" replace />;
}
