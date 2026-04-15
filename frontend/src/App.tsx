import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmergencyRequestPage from './pages/EmergencyRequestPage';
import KYCPage from './pages/KYCPage';
import LendPage from './pages/LendPage';
import MatchPage from './pages/MatchPage';
import ProfilePage from './pages/ProfilePage';
import WardenDashboardPage from './pages/warden/WardenDashboardPage';
import WardenKYCQueuePage from './pages/warden/WardenKYCQueuePage';
import AuditLogPage from './pages/warden/AuditLogPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Citizen */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/request" element={<EmergencyRequestPage />} />
        <Route path="/kyc" element={<KYCPage />} />
        <Route path="/lend" element={<LendPage />} />
        <Route path="/match" element={<MatchPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Warden */}
        <Route path="/warden" element={<WardenDashboardPage />} />
        <Route path="/warden/kyc" element={<WardenKYCQueuePage />} />
        <Route path="/warden/audit" element={<AuditLogPage />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
