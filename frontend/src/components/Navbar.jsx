import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import logo from "../assets/logo.jpg";
import PositivePayRegistryModal from "./PositivePayRegistryModal";
import DynamicCollateralManagementModal from "./DynamicCollateralManagementModal";
import RbiCimsRegulatoryModal from "./RbiCimsRegulatoryModal";
import CoreBankingAdapterModal from "./CoreBankingAdapterModal";
import WhatsAppBankingModal from "./WhatsAppBankingModal";
import RegionalVoiceBankingModal from "./RegionalVoiceBankingModal";
import GeospatialTransitRadarModal from "./GeospatialTransitRadarModal";
import AutonomousSelfHealingModal from "./AutonomousSelfHealingModal";
import AcousticMeshOfflineModal from "./AcousticMeshOfflineModal";
import AutonomousLiquiditySwarmModal from "./AutonomousLiquiditySwarmModal";
import DeepfakeForensicLabModal from "./DeepfakeForensicLabModal";
import ProgrammableCbdcSplitterModal from "./ProgrammableCbdcSplitterModal";
import CrossBorderCorridorModal from "./CrossBorderCorridorModal";
import DeveloperSdkPortalModal from "./DeveloperSdkPortalModal";
import MuleHunterRadarModal from "./MuleHunterRadarModal";
import HourlyContinuousClearingModal from "./HourlyContinuousClearingModal";
import NeslSection138Modal from "./NeslSection138Modal";
import UliAccountAggregatorModal from "./UliAccountAggregatorModal";
import BhashiniVoiceBankingModal from "./BhashiniVoiceBankingModal";
import SrvaVostroSettlementModal from "./SrvaVostroSettlementModal";


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
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [showSelfHealingModal, setShowSelfHealingModal] = useState(false);
  const [showAcousticModal, setShowAcousticModal] = useState(false);
  const [showLiquiditySwarmModal, setShowLiquiditySwarmModal] = useState(false);
  const [showDeepfakeModal, setShowDeepfakeModal] = useState(false);
  const [showCbdcSplitterModal, setShowCbdcSplitterModal] = useState(false);
  const [showCrossBorderCorridorModal, setShowCrossBorderCorridorModal] = useState(false);
  const [showDeveloperSdkModal, setShowDeveloperSdkModal] = useState(false);
  const [showSovereignDropdown, setShowSovereignDropdown] = useState(false);
  const [showMuleHunterModal, setShowMuleHunterModal] = useState(false);
  const [showHourlyClearingModal, setShowHourlyClearingModal] = useState(false);
  const [showNeslModal, setShowNeslModal] = useState(false);
  const [showUliModal, setShowUliModal] = useState(false);
  const [showBhashiniModal, setShowBhashiniModal] = useState(false);
  const [showSrvaModal, setShowSrvaModal] = useState(false);
  const [showDpiDropdown, setShowDpiDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);
  const sovereignDropdownRef = useRef(null);
  const dpiDropdownRef = useRef(null);


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
      if (sovereignDropdownRef.current && !sovereignDropdownRef.current.contains(event.target)) {
        setShowSovereignDropdown(false);
      }
      if (dpiDropdownRef.current && !dpiDropdownRef.current.contains(event.target)) {
        setShowDpiDropdown(false);
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

            {/* WhatsApp Banking & SMS Multi-Channel Suite (100% Free) */}
            <button
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              title="Interactive WhatsApp Banking Bot & DLT SMS Suite (100% Free)"
            >
              <span>💬 WhatsApp & SMS</span>
            </button>

            {/* Regional AI Voice Banking Assistant */}
            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/40 cursor-pointer"
              title="Regional AI Voice Banking Assistant (Gujarati, Hindi, English)"
            >
              <span>🎙️ Voice AI</span>
            </button>

            {/* Geospatial Branch Radar & Armed CIT Escort */}
            <button
              type="button"
              onClick={() => setShowRadarModal(true)}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 hover:text-white hover:bg-emerald-900 text-xs font-bold transition-colors cursor-pointer"
              title="Geospatial Branch Radar & Armed CIT Transit Telemetry"
            >
              <span>🗺️ CIT Radar</span>
            </button>

            {/* Autonomous AI SRE Self-Healing Engine */}
            <button
              type="button"
              onClick={() => setShowSelfHealingModal(true)}
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 hover:text-white hover:bg-cyan-900 text-xs font-bold transition-colors cursor-pointer"
              title="Autonomous AI SRE Self-Healing Engine & Incident Auto-Remediation"
            >
              <span>🤖 AIOps</span>
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

            {/* Sovereign 6 Pillars ($1T FinTech Innovations Menu) */}
            <div className="relative" ref={sovereignDropdownRef}>
              <button
                type="button"
                onClick={() => setShowSovereignDropdown(!showSovereignDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 via-purple-600 to-cyan-600 hover:from-amber-500 hover:to-cyan-500 text-white text-xs font-black tracking-wide transition-all shadow-md shadow-cyan-950/50 cursor-pointer"
                title="6 World-First Sovereign FinTech Breakthroughs ($1T - $50T Scale)"
              >
                <span>⚡ Sovereign 6 Pillars</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono">NEW</span>
              </button>

              {showSovereignDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-cyan-500/50 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
                  <div className="px-3.5 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                      Sovereign FinTech Engines
                    </span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                      $1T Scale
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setShowAcousticModal(true); setShowSovereignDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition"
                    >
                      <span className="text-base">📡</span>
                      <div>
                        <div className="text-xs font-bold text-white">1. Acoustic Zero-Internet Offline Pay</div>
                        <div className="text-[11px] text-slate-400">18-20 kHz ultrasonic FSK + PQC Dilithium</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowLiquiditySwarmModal(true); setShowSovereignDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition"
                    >
                      <span className="text-base">⚡</span>
                      <div>
                        <div className="text-xs font-bold text-white">2. AI Liquidity Swarm & Tarjan LSM</div>
                        <div className="text-[11px] text-slate-400">100ms gridlock resolver with ₹0 cash + G-Sec repo</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowDeepfakeModal(true); setShowSovereignDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition"
                    >
                      <span className="text-base">🧬</span>
                      <div>
                        <div className="text-xs font-bold text-white">3. AI Deepfake & 365nm Optical Forensics</div>
                        <div className="text-[11px] text-slate-400">Acoustic throat tremor + Fourier kerning radar</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowCbdcSplitterModal(true); setShowSovereignDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition"
                    >
                      <span className="text-base">💎</span>
                      <div>
                        <div className="text-xs font-bold text-white">4. Programmable e-Rupee & Tax Splitter</div>
                        <div className="text-[11px] text-slate-400">18% GSTN + 1% TDS auto-split + Geofence escrow</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowCrossBorderCorridorModal(true); setShowSovereignDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition"
                    >
                      <span className="text-base">🌐</span>
                      <div>
                        <div className="text-xs font-bold text-white">5. De-Dollarized Cross-Border DvP</div>
                        <div className="text-[11px] text-slate-400">INR-AED / INR-SGD non-USD + sub-50ms sanctions</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowDeveloperSdkModal(true); setShowSovereignDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition"
                    >
                      <span className="text-base">🛠️</span>
                      <div>
                        <div className="text-xs font-bold text-white">6. Sovereign Developer SDK & APIs</div>
                        <div className="text-[11px] text-slate-400">@misdesc/sdk in 3 lines of code + API keys</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Indian DPI & RBI Innovation Rail Menu */}
            <div className="relative" ref={dpiDropdownRef}>
              <button
                type="button"
                onClick={() => setShowDpiDropdown(!showDpiDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white text-xs font-black tracking-wide transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
                title="6 RBI & DPI Sovereign Banking Breakthroughs"
              >
                <span>🏛️ RBI & DPI Rail</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono">2025</span>
              </button>

              {showDpiDropdown && (
                <div className="absolute right-0 mt-2 w-84 bg-slate-900 border border-emerald-500/50 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
                  <div className="px-3.5 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      RBI & NPCI Sovereign DPI Stack
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                      Dec 2024 / 2025
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setShowMuleHunterModal(true); setShowDpiDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition cursor-pointer"
                    >
                      <span className="text-base">🛡️</span>
                      <div>
                        <div className="text-xs font-bold text-white">1. MuleHunter.AI Graph Radar</div>
                        <div className="text-[11px] text-slate-400">RBIH mule account interception & 24h freeze</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowHourlyClearingModal(true); setShowDpiDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition cursor-pointer"
                    >
                      <span className="text-base">⏱️</span>
                      <div>
                        <div className="text-xs font-bold text-white">2. Hourly T+0 Realization Clock</div>
                        <div className="text-[11px] text-slate-400">RBI 10 AM-7 PM hourly batches + 60m credit SLA</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowNeslModal(true); setShowDpiDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition cursor-pointer"
                    >
                      <span className="text-base">⚖️</span>
                      <div>
                        <div className="text-xs font-bold text-white">3. NeSL DDE & Section 138 Notice</div>
                        <div className="text-[11px] text-slate-400">SHCIL e-Stamp + Sec 65B court certificate</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowUliModal(true); setShowDpiDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition cursor-pointer"
                    >
                      <span className="text-base">💳</span>
                      <div>
                        <div className="text-xs font-bold text-white">4. ULI & Account Aggregator JIT-OD</div>
                        <div className="text-[11px] text-slate-400">72h credit line on GST receivables (0% bounce)</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowBhashiniModal(true); setShowDpiDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition cursor-pointer"
                    >
                      <span className="text-base">🗣️</span>
                      <div>
                        <div className="text-xs font-bold text-white">5. Bhashini 22-Language Voice AI</div>
                        <div className="text-[11px] text-slate-400">Speech-to-Intent in Hindi, Gujarati, Tamil etc.</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowSrvaModal(true); setShowDpiDropdown(false); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition cursor-pointer"
                    >
                      <span className="text-base">🌐</span>
                      <div>
                        <div className="text-xs font-bold text-white">6. Special Rupee Vostro (SRVA) DvP</div>
                        <div className="text-[11px] text-slate-400">Direct AED/SGD/SAR DvP without SWIFT markups</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

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

      {showWhatsAppModal && (
        <WhatsAppBankingModal onClose={() => setShowWhatsAppModal(false)} />
      )}

      {showVoiceModal && (
        <RegionalVoiceBankingModal onClose={() => setShowVoiceModal(false)} />
      )}

      {showRadarModal && (
        <GeospatialTransitRadarModal onClose={() => setShowRadarModal(false)} />
      )}

      {showSelfHealingModal && (
        <AutonomousSelfHealingModal onClose={() => setShowSelfHealingModal(false)} />
      )}

      {showAcousticModal && (
        <AcousticMeshOfflineModal
          isOpen={showAcousticModal}
          onClose={() => setShowAcousticModal(false)}
        />
      )}

      {showLiquiditySwarmModal && (
        <AutonomousLiquiditySwarmModal
          isOpen={showLiquiditySwarmModal}
          onClose={() => setShowLiquiditySwarmModal(false)}
        />
      )}

      {showDeepfakeModal && (
        <DeepfakeForensicLabModal
          isOpen={showDeepfakeModal}
          onClose={() => setShowDeepfakeModal(false)}
        />
      )}

      {showCbdcSplitterModal && (
        <ProgrammableCbdcSplitterModal
          isOpen={showCbdcSplitterModal}
          onClose={() => setShowCbdcSplitterModal(false)}
        />
      )}

      {showCrossBorderCorridorModal && (
        <CrossBorderCorridorModal
          isOpen={showCrossBorderCorridorModal}
          onClose={() => setShowCrossBorderCorridorModal(false)}
        />
      )}

      {showDeveloperSdkModal && (
        <DeveloperSdkPortalModal
          isOpen={showDeveloperSdkModal}
          onClose={() => setShowDeveloperSdkModal(false)}
        />
      )}

      {showMuleHunterModal && <MuleHunterRadarModal onClose={() => setShowMuleHunterModal(false)} />}
      {showHourlyClearingModal && <HourlyContinuousClearingModal onClose={() => setShowHourlyClearingModal(false)} />}
      {showNeslModal && <NeslSection138Modal onClose={() => setShowNeslModal(false)} />}
      {showUliModal && <UliAccountAggregatorModal onClose={() => setShowUliModal(false)} />}
      {showBhashiniModal && <BhashiniVoiceBankingModal onClose={() => setShowBhashiniModal(false)} />}
      {showSrvaModal && <SrvaVostroSettlementModal onClose={() => setShowSrvaModal(false)} />}
    </>
  );
}

