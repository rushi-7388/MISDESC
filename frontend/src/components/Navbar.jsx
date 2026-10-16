import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import logo from "../assets/logo.jpg";
import PositivePayRegistryModal from "./PositivePayRegistryModal";
import DynamicCollateralManagementModal from "./DynamicCollateralManagementModal";
import RbiCimsRegulatoryModal from "./RbiCimsRegulatoryModal";
import CoreBankingAdapterModal from "./CoreBankingAdapterModal";

const DEMO_ROLES = [
  {
    role: "PRESENTING_BANK",
    label: "Presenting Bank Clerk",
    sublabel: "SURAT PEOPLES CO OP BANK (SNB)",
    email: "presenting@snb.com",
    path: "/presenting",
  },
  {
    role: "DRAWEE_BANK",
    label: "Drawee Bank Verifier (Maker)",
    sublabel: "SURAT PEOPLES CO OP BANK (HDB)",
    email: "drawee@hdb.com",
    path: "/drawee",
  },
  {
    role: "DRAWEE_BANK",
    label: "Senior Approver (Checker)",
    sublabel: "SURAT PEOPLES CO OP BANK (HDB)",
    email: "checker@hdb.com",
    path: "/drawee",
  },
  {
    role: "ADMIN",
    label: "Clearing House Admin",
    sublabel: "National Clearing House (MISDESC)",
    email: "admin@MISDESC.com",
    path: "/admin",
  },
  {
    role: "BRANCH_MANAGER",
    label: "Branch Operations Manager",
    sublabel: "SURAT PEOPLES CO OP BANK (Athwa Branch)",
    email: "manager@snb.com",
    path: "/branch-manager",
  },
  {
    role: "IT_STAFF",
    label: "Core SRE & IT Staff",
    sublabel: "Central Switch Infrastructure",
    email: "itops@MISDESC.com",
    path: "/it-monitoring",
  },
  {
    role: "COMPLIANCE_AUDITOR",
    label: "Compliance & Audit Officer",
    sublabel: "Regulatory Oversight Wing",
    email: "auditor@rbi.org.in",
    path: "/auditor",
  },
  {
    role: "SETTLEMENT_OFFICER",
    label: "Settlement & Treasury Officer",
    sublabel: "National Treasury Settlement Desk",
    email: "treasury@MISDESC.com",
    path: "/settlement",
  },
];

export default function Navbar() {
  const { user, logout, switchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [systemHealthy, setSystemHealthy] = useState(true);
  const [chaosActive, setChaosActive] = useState(false);
  const [showPpsModal, setShowPpsModal] = useState(false);
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  const [showCimsModal, setShowCimsModal] = useState(false);
  const [showCbsModal, setShowCbsModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await client.get("/devops/chaos");
        setChaosActive(res.data?.enabled);
        setSystemHealthy(true);
      } catch (err) {
        setSystemHealthy(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRoleDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleQuickSwitch(item) {
    if (user?.email === item.email) {
      setShowRoleDropdown(false);
      navigate(item.path);
      return;
    }
    setSwitching(true);
    try {
      await switchUser(item.email, "password123");
      setShowRoleDropdown(false);
      navigate(item.path);
    } catch (err) {
      console.error("Fast role switch failed:", err);
    } finally {
      setSwitching(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isAdmin = user?.role === "ADMIN";
  const canManageRBAC = user?.role === "BRANCH_MANAGER" || user?.role === "ADMIN";
  const clearingDeskPath = {
    PRESENTING_BANK: "/presenting",
    DRAWEE_BANK: "/drawee",
    ADMIN: "/admin",
    BRANCH_MANAGER: "/branch-manager",
    IT_STAFF: "/it-monitoring",
    COMPLIANCE_AUDITOR: "/auditor",
    SETTLEMENT_OFFICER: "/settlement",
  }[user?.role] || "/admin";

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-lg sticky top-0 z-40 backdrop-blur-md bg-slate-900/95">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <img
              src={logo}
              alt="MISDESC Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-slate-700"
            />
            <div className="flex flex-col">
              <div className="font-bold tracking-tight text-sm sm:text-base leading-none flex items-center gap-2">
                <span className="text-white font-extrabold">SURAT PEOPLES CO OP BANK</span>
                <span className="text-slate-600 font-light hidden sm:inline">|</span>
                <span className="text-xs font-semibold text-slate-300 hidden sm:inline tracking-normal">
                  MISDESC Reporting & CTS Portal
                </span>
              </div>
            </div>
          </div>

          {/* Cross-portal quick tabs for Admin */}
          {isAdmin && (
            <div className="hidden 2xl:flex items-center gap-1 ml-2 bg-slate-800/60 p-1 rounded-lg border border-slate-700/60 text-xs">
              <Link
                to="/presenting"
                className={`px-2 py-0.5 rounded-md transition-colors ${location.pathname === "/presenting"
                    ? "bg-brand-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                Presenting
              </Link>
              <Link
                to="/drawee"
                className={`px-2 py-0.5 rounded-md transition-colors ${location.pathname === "/drawee"
                    ? "bg-brand-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                Drawee
              </Link>
              <Link
                to="/admin"
                className={`px-2 py-0.5 rounded-md transition-colors ${location.pathname === "/admin"
                    ? "bg-brand-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                Switch
              </Link>
              <Link
                to="/branch-manager"
                className={`px-2 py-0.5 rounded-md transition-colors ${location.pathname === "/branch-manager"
                    ? "bg-brand-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                Branch
              </Link>
              <Link
                to="/it-monitoring"
                className={`px-2 py-0.5 rounded-md transition-colors ${location.pathname === "/it-monitoring"
                    ? "bg-brand-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                SRE
              </Link>
              <Link
                to="/auditor"
                className={`px-2 py-0.5 rounded-md transition-colors ${location.pathname === "/auditor"
                    ? "bg-brand-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                Audit
              </Link>
              <Link
                to="/settlement"
                className={`px-2 py-0.5 rounded-md transition-colors ${location.pathname === "/settlement"
                    ? "bg-brand-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                Settlement
              </Link>
              <Link
                to="/reports"
                className={`px-2 py-0.5 rounded-md transition-colors ${location.pathname === "/reports"
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-blue-300 hover:text-white"
                  }`}
              >
                Reports
              </Link>
              <Link
                to="/rbac"
                className={`px-2 py-0.5 rounded-md transition-colors ${location.pathname === "/rbac"
                    ? "bg-purple-600 text-white font-semibold"
                    : "text-purple-300 hover:text-white"
                  }`}
              >
                RBAC
              </Link>
            </div>
          )}
        </div>

        {/* Right: Actions & User Info */}
        {user && (
          <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
            {/* Primary MIS Reporting Desk */}
            <Link
              to="/reports"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === "/reports"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-800 border border-slate-700 text-blue-300 hover:text-white hover:bg-slate-750"
              }`}
              title="Bank MIS & Regulatory Reports"
            >
              <span>MIS Reports</span>
            </Link>

            {/* CTS Clearing Operations Desk */}
            <Link
              to={clearingDeskPath}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === clearingDeskPath
                  ? "bg-slate-700 text-white shadow-xs"
                  : "bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750"
              }`}
              title="CTS Cheque Clearing & Operational Desk"
            >
              <span>CTS Operations</span>
            </Link>

            {/* Dynamic Liquidity & Collateral (LMS) */}
            <button
              type="button"
              onClick={() => setShowCollateralModal(true)}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 hover:text-white hover:bg-emerald-900 text-xs font-bold transition-colors cursor-pointer"
              title="Dynamic Liquidity & Collateral Management (LMS)"
            >
              <span>💼 LMS</span>
            </button>

            {/* Automated RBI CIMS Hub */}
            <button
              type="button"
              onClick={() => setShowCimsModal(true)}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-300 hover:text-white hover:bg-blue-900 text-xs font-bold transition-colors cursor-pointer"
              title="Automated RBI CIMS & Section 138 Hub"
            >
              <span>🏛️ CIMS</span>
            </button>

            {/* Core Banking (CBS) Adapter */}
            <button
              type="button"
              onClick={() => setShowCbsModal(true)}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-950/80 border border-teal-800/80 text-teal-300 hover:text-white hover:bg-teal-900 text-xs font-bold transition-colors cursor-pointer"
              title="Core Banking (CBS) & Open Banking Adapter Suite"
            >
              <span>🌐 CBS</span>
            </button>

            {/* RBAC Portal Link for Managers and Admins */}
            {canManageRBAC && (
              <Link
                to="/rbac"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center ${
                  location.pathname === "/rbac"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-purple-950/70 border border-purple-800/80 text-purple-300 hover:text-white hover:bg-purple-900"
                }`}
                title="Manage RBAC, User Roles & Branch Limits"
              >
                <span>RBAC</span>
              </Link>
            )}

            {/* Role Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Switch active role"
              >
                <span>Switch Role</span>
                <span className="text-[10px] text-slate-400 font-mono">▼</span>
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-150">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 py-1 border-b border-slate-800 mb-1">
                    Select Active Role
                  </div>
                  {DEMO_ROLES.map((roleItem) => {
                    const isCurrent = user?.email === roleItem.email;
                    return (
                      <button
                        key={roleItem.email}
                        type="button"
                        onClick={() => handleQuickSwitch(roleItem)}
                        disabled={switching}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-start gap-2 cursor-pointer ${isCurrent
                            ? "bg-brand-600/20 text-brand-300 font-semibold border border-brand-500/30"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isCurrent ? "bg-brand-400" : "bg-slate-600"}`}></span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="truncate">{roleItem.label}</span>
                            {isCurrent && (
                              <span className="text-[10px] text-emerald-400 font-mono">Active</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{roleItem.sublabel}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Current User Card */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
              <div className="text-right">
                <div className="font-semibold text-slate-200 leading-none">{user.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{user.bank?.name}</div>
              </div>
              <span className="uppercase text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-brand-300 px-2 py-0.5 rounded">
                {user.role}
              </span>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        )}
      </nav>

      {showPpsModal && (
        <PositivePayRegistryModal onClose={() => setShowPpsModal(false)} />
      )}

      {showCollateralModal && (
        <DynamicCollateralManagementModal onClose={() => setShowCollateralModal(false)} />
      )}

      {showCimsModal && (
        <RbiCimsRegulatoryModal onClose={() => setShowCimsModal(false)} />
      )}

      {showCbsModal && (
        <CoreBankingAdapterModal onClose={() => setShowCbsModal(false)} />
      )}
    </>
  );
}
