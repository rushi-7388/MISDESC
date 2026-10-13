import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LiveSettlementTicker from "./components/LiveSettlementTicker";
import LiveNotificationToast from "./components/LiveNotificationToast";

// Lazy-loaded page components for fast initial bundle delivery and route-level code splitting
const Login = lazy(() => import("./pages/Login"));
const PresentingBankDashboard = lazy(() => import("./pages/PresentingBankDashboard"));
const DraweeBankDashboard = lazy(() => import("./pages/DraweeBankDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BranchManagerDashboard = lazy(() => import("./pages/BranchManagerDashboard"));
const ITStaffDashboard = lazy(() => import("./pages/ITStaffDashboard"));
const ComplianceAuditorDashboard = lazy(() => import("./pages/ComplianceAuditorDashboard"));
const SettlementOfficerDashboard = lazy(() => import("./pages/SettlementOfficerDashboard"));
const RBACManagement = lazy(() => import("./pages/RBACManagement"));
const ReportingHub = lazy(() => import("./pages/ReportingHub"));

function PageLoader() {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
        Loading MISDESC Portal...
      </p>
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // MISDESC Primary Purpose: Bank MIS & Statutory Reporting Suite
  return <Navigate to="/reports" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {user && <LiveSettlementTicker />}
      <div className="flex-1 flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/presenting"
              element={
                <ProtectedRoute roles={["PRESENTING_BANK", "ADMIN"]}>
                  <PresentingBankDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/drawee"
              element={
                <ProtectedRoute roles={["DRAWEE_BANK", "ADMIN"]}>
                  <DraweeBankDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branch-manager"
              element={
                <ProtectedRoute roles={["BRANCH_MANAGER", "ADMIN"]}>
                  <BranchManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/it-monitoring"
              element={
                <ProtectedRoute roles={["IT_STAFF", "ADMIN"]}>
                  <ITStaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auditor"
              element={
                <ProtectedRoute roles={["COMPLIANCE_AUDITOR", "ADMIN"]}>
                  <ComplianceAuditorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settlement"
              element={
                <ProtectedRoute roles={["SETTLEMENT_OFFICER", "ADMIN"]}>
                  <SettlementOfficerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rbac"
              element={
                <ProtectedRoute roles={["BRANCH_MANAGER", "ADMIN"]}>
                  <RBACManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute
                  roles={[
                    "ADMIN",
                    "BRANCH_MANAGER",
                    "PRESENTING_BANK",
                    "DRAWEE_BANK",
                    "IT_STAFF",
                    "COMPLIANCE_AUDITOR",
                    "SETTLEMENT_OFFICER",
                  ]}
                >
                  <ReportingHub />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </div>
      {user && <LiveNotificationToast />}
    </div>
  );
}
