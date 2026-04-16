import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleHomeRedirect } from "./components/RoleHomeRedirect";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { EmergencyRequestPage } from "./pages/beneficiary/EmergencyRequestPage";
import { DashboardPage } from "./pages/common/DashboardPage";
import { NotFoundPage } from "./pages/common/NotFoundPage";
import { ProfilePage } from "./pages/common/ProfilePage";
import { NotificationsPage } from "./pages/common/NotificationsPage";
import { KycCompletionPage } from "./pages/common/KycCompletionPage";
import { EscrowClosurePage } from "./pages/escrow/EscrowClosurePage";
import { TechHandoverPage } from "./pages/technician/TechHandoverPage";
import { TechVerifyPage } from "./pages/technician/TechVerifyPage";
import { WardenKycPage } from "./pages/warden/WardenKycPage";
import { useAuthStore } from "./store/authStore";

function LandingRedirect() {
  const token = useAuthStore((state) => state.token);
  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/home" element={<RoleHomeRedirect />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/kyc-completion" element={<KycCompletionPage />} />
          <Route
            path="/beneficiary/requests"
            element={
              <ProtectedRoute allowedRoles={["BENEFICIARY"]}>
                <EmergencyRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/beneficiary/request"
            element={<Navigate to="/beneficiary/requests" replace />}
          />
          <Route
            path="/technician/verify"
            element={
              <ProtectedRoute allowedRoles={["TECHNICIAN"]}>
                <TechVerifyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician/handover"
            element={
              <ProtectedRoute allowedRoles={["TECHNICIAN"]}>
                <TechHandoverPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warden/kyc"
            element={
              <ProtectedRoute allowedRoles={["WARDEN"]}>
                <WardenKycPage />
              </ProtectedRoute>
            }
          />
          <Route path="/escrow/closure" element={<EscrowClosurePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
