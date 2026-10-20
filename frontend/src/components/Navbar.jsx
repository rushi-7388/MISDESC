import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import logo from "../assets/logo.jpg";

// Modals for Institutional Services & Innovations
import PositivePayRegistryModal from "./PositivePayRegistryModal";
import DynamicCollateralManagementModal from "./DynamicCollateralManagementModal";
import RbiCimsRegulatoryModal from "./RbiCimsRegulatoryModal";
import CoreBankingAdapterModal from "./CoreBankingAdapterModal";
import WhatsAppBankingModal from "./WhatsAppBankingModal";
import RegionalVoiceBankingModal from "./RegionalVoiceBankingModal";
import GeospatialTransitRadarModal from "./GeospatialTransitRadarModal";
import AutonomousSelfHealingModal from "./AutonomousSelfHealingModal";

// Sovereign 6 Pillars Modals
import AcousticMeshOfflineModal from "./AcousticMeshOfflineModal";
import AutonomousLiquiditySwarmModal from "./AutonomousLiquiditySwarmModal";
import DeepfakeForensicLabModal from "./DeepfakeForensicLabModal";
import ProgrammableCbdcSplitterModal from "./ProgrammableCbdcSplitterModal";
import CrossBorderCorridorModal from "./CrossBorderCorridorModal";
import DeveloperSdkPortalModal from "./DeveloperSdkPortalModal";

// 2025 RBI & Digital Public Infrastructure (DPI) Modals
import MuleHunterRadarModal from "./MuleHunterRadarModal";
import HourlyContinuousClearingModal from "./HourlyContinuousClearingModal";
import NeslSection138Modal from "./NeslSection138Modal";
import UliAccountAggregatorModal from "./UliAccountAggregatorModal";
import BhashiniVoiceBankingModal from "./BhashiniVoiceBankingModal";
import SrvaVostroSettlementModal from "./SrvaVostroSettlementModal";

const DEMO_ROLES = [
  {
    role: "PRESENTING_BANK",
    label: "Presenting Clerk",
    sublabel: "SURAT PEOPLES CO OP (SNB)",
    email: "presenting@snb.com",
    path: "/presenting",
  },
  {
    role: "DRAWEE_BANK",
    label: "Drawee Verifier (Maker)",
    sublabel: "SURAT PEOPLES CO OP (HDB)",
    email: "drawee@hdb.com",
    path: "/drawee",
  },
  {
    role: "DRAWEE_BANK",
    label: "Approver (Checker)",
    sublabel: "SURAT PEOPLES CO OP (HDB)",
    email: "checker@hdb.com",
    path: "/drawee",
  },
  {
    role: "ADMIN",
    label: "Clearing Switch Admin",
    sublabel: "National Grid (MISDESC)",
    email: "admin@MISDESC.com",
    path: "/admin",
  },
  {
    role: "BRANCH_MANAGER",
    label: "Branch Manager",
    sublabel: "Athwa Branch Operations",
    email: "manager@snb.com",
    path: "/branch-manager",
  },
  {
    role: "IT_STAFF",
    label: "Core SRE & IT Ops",
    sublabel: "Switch Infrastructure",
    email: "itops@MISDESC.com",
    path: "/it-monitoring",
  },
  {
    role: "COMPLIANCE_AUDITOR",
    label: "Compliance Auditor",
    sublabel: "RBI Regulatory Wing",
    email: "auditor@rbi.org.in",
    path: "/auditor",
  },
  {
    role: "SETTLEMENT_OFFICER",
    label: "Treasury Officer",
    sublabel: "National Treasury Settlement",
    email: "treasury@MISDESC.com",
    path: "/settlement",
  },
];

export default function Navbar() {
  const { user, logout, switchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Modal States
  const [showPpsModal, setShowPpsModal] = useState(false);
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  const [showCimsModal, setShowCimsModal] = useState(false);
  const [showCbsModal, setShowCbsModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [showSelfHealingModal, setShowSelfHealingModal] = useState(false);

  // Sovereign 6 Pillars Modals
  const [showAcousticModal, setShowAcousticModal] = useState(false);
  const [showLiquiditySwarmModal, setShowLiquiditySwarmModal] = useState(false);
  const [showDeepfakeModal, setShowDeepfakeModal] = useState(false);
  const [showCbdcSplitterModal, setShowCbdcSplitterModal] = useState(false);
  const [showCrossBorderCorridorModal, setShowCrossBorderCorridorModal] = useState(false);
  const [showDeveloperSdkModal, setShowDeveloperSdkModal] = useState(false);

  // 2025 DPI Modals
  const [showMuleHunterModal, setShowMuleHunterModal] = useState(false);
  const [showHourlyClearingModal, setShowHourlyClearingModal] = useState(false);
  const [showNeslModal, setShowNeslModal] = useState(false);
  const [showUliModal, setShowUliModal] = useState(false);
  const [showBhashiniModal, setShowBhashiniModal] = useState(false);
  const [showSrvaModal, setShowSrvaModal] = useState(false);

  // UI States
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("sovereign"); // "sovereign" | "dpi" | "adapters"
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Refs for click outside
  const servicesMenuRef = useRef(null);
  const roleDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target)) {
        setShowServicesMenu(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
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

  const clearingDeskPath = {
    PRESENTING_BANK: "/presenting",
    DRAWEE_BANK: "/drawee",
    ADMIN: "/admin",
    BRANCH_MANAGER: "/branch-manager",
    IT_STAFF: "/it-monitoring",
    COMPLIANCE_AUDITOR: "/auditor",
    SETTLEMENT_OFFICER: "/settlement",
  }[user?.role] || "/admin";

  const currentRoleItem = DEMO_ROLES.find((r) => r.email === user?.email);
  const canManageRBAC = user?.role === "BRANCH_MANAGER" || user?.role === "ADMIN";

  // Catalog of services for clean rendering and search
  const sovereignItems = [
    {
      id: "acoustic",
      icon: "📡",
      name: "Acoustic Offline PQC Rail",
      desc: "18-20 kHz ultrasonic sound payments without internet",
      tag: "PQC Lattice",
      action: () => setShowAcousticModal(true),
    },
    {
      id: "swarm",
      icon: "⚡",
      name: "AI Liquidity Swarm & Tarjan",
      desc: "₹0 cash circular gridlock resolution engine",
      tag: "Cycle Elimination",
      action: () => setShowLiquiditySwarmModal(true),
    },
    {
      id: "deepfake",
      icon: "🧬",
      name: "Deepfake & 365nm Optical AI",
      desc: "Synthetic voice and chemical alteration defense",
      tag: "Forensic Vision",
      action: () => setShowDeepfakeModal(true),
    },
    {
      id: "cbdc",
      icon: "💎",
      name: "Programmable CBDC Splitter",
      desc: "18% GST + 1% TDS automatic smart-contract split",
      tag: "e-Rupee",
      action: () => setShowCbdcSplitterModal(true),
    },
    {
      id: "dvp",
      icon: "🌐",
      name: "De-Dollarized Bilateral DvP",
      desc: "Direct INR-AED cross-border corridor settlement",
      tag: "Cross-Border",
      action: () => setShowCrossBorderCorridorModal(true),
    },
    {
      id: "sdk",
      icon: "🛠️",
      name: "Sovereign Developer SDK",
      desc: "3-line CBS embedded clearing integration",
      tag: "Finacle Ready",
      action: () => setShowDeveloperSdkModal(true),
    },
  ];

  const dpiItems = [
    {
      id: "mule",
      icon: "🛡️",
      name: "MuleHunter.AI Graph Radar",
      desc: "RBIH graph centrality money mule hold advisor",
      tag: "RBIH Mandate",
      action: () => setShowMuleHunterModal(true),
    },
    {
      id: "hourly",
      icon: "⏱️",
      name: "Hourly Continuous T+0 Engine",
      desc: "10 AM - 7 PM rolling clearing with 60m credit SLA",
      tag: "T+0 Rolling",
      action: () => setShowHourlyClearingModal(true),
    },
    {
      id: "nesl",
      icon: "⚖️",
      name: "NeSL DDE & Sec 65B Dossier",
      desc: "30-day statutory demand notice + court affidavit",
      tag: "Section 138",
      action: () => setShowNeslModal(true),
    },
    {
      id: "uli",
      icon: "💳",
      name: "ULI JIT-OD Overdraft Bridge",
      desc: "Unified Lending GSTN backed 0% bounce guarantee",
      tag: "ULI / GSTN",
      action: () => setShowUliModal(true),
    },
    {
      id: "bhashini",
      icon: "🗣️",
      name: "Bhashini 22-Language Voice AI",
      desc: "Conversational regional voice biometrics & IVR",
      tag: "Voice AI",
      action: () => setShowBhashiniModal(true),
    },
    {
      id: "srva",
      icon: "🏦",
      name: "SRVA Rupee Vostro Clearing",
      desc: "Direct non-SWIFT cross-border DvP rupee settlement",
      tag: "SRVA Vostro",
      action: () => setShowSrvaModal(true),
    },
  ];

  const adapterItems = [
    {
      id: "pps",
      icon: "🛡️",
      name: "Positive Pay System (PPS)",
      desc: "High-value cheque pre-verification registry",
      tag: "PPS Registry",
      action: () => setShowPpsModal(true),
    },
    {
      id: "lms",
      icon: "💼",
      name: "Collateral & Liquidity (LMS)",
      desc: "Dynamic treasury collateral management portal",
      tag: "LMS Portal",
      action: () => setShowCollateralModal(true),
    },
    {
      id: "cbs",
      icon: "🌐",
      name: "Core Banking (CBS) Gateway",
      desc: "Finacle, BaNCS & Flexcube ISO 20022 adapter",
      tag: "ISO 20022",
      action: () => setShowCbsModal(true),
    },
    {
      id: "whatsapp",
      icon: "💬",
      name: "WhatsApp & DLT SMS Alert Rail",
      desc: "Instant customer notification & clearance receipts",
      tag: "DLT Alerts",
      action: () => setShowWhatsAppModal(true),
    },
    {
      id: "cit",
      icon: "🗺️",
      name: "Geospatial CIT Transit Radar",
      desc: "Live GPS escort & armored vault transit security",
      tag: "Armored CIT",
      action: () => setShowRadarModal(true),
    },
    {
      id: "aiops",
      icon: "🤖",
      name: "Autonomous SRE AIOps Console",
      desc: "Self-healing clearing node infrastructure",
      tag: "Self-Healing",
      action: () => setShowSelfHealingModal(true),
    },
    {
      id: "cims",
      icon: "🏛️",
      name: "Automated RBI CIMS Hub",
      desc: "One-click regulatory XML & XBRL filing pipeline",
      tag: "RBI CIMS",
      action: () => setShowCimsModal(true),
    },
    ...(canManageRBAC
      ? [
          {
            id: "rbac",
            icon: "🔐",
            name: "RBAC Governance & Branch Ops",
            desc: "Role permissions and dual-control approvals",
            tag: "Governance",
            action: () => navigate("/rbac"),
          },
        ]
      : []),
  ];

  // Filter items if user typed in search query
  const allServices = [...sovereignItems, ...dpiItems, ...adapterItems];
  const filteredServices = searchQuery.trim()
    ? allServices.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const currentTabItems =
    activeTab === "sovereign"
      ? sovereignItems
      : activeTab === "dpi"
      ? dpiItems
      : adapterItems;

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* 1. Left: Brand & Bank Identity */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src={logo}
                alt="MISDESC"
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700/80 group-hover:ring-cyan-500 transition shadow-sm"
              />
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base font-mono tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                    MISDESC
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-mono hidden sm:inline-block">
                    CTS
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline truncate max-w-[200px] lg:max-w-none">
                  Surat Peoples Co-op Bank · Clearing Switch
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Center: Sleek Minimal Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
            {/* Direct Link: Operations Desk */}
            <Link
              to={clearingDeskPath}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                location.pathname === clearingDeskPath
                  ? "bg-slate-800 text-white font-semibold border border-slate-700 shadow-xs"
                  : "hover:bg-slate-800/60 hover:text-white text-slate-400"
              }`}
            >
              <span>📋 Desk</span>
            </Link>

            {/* Direct Link: MIS Reports */}
            <Link
              to="/reports"
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                location.pathname === "/reports"
                  ? "bg-slate-800 text-white font-semibold border border-slate-700 shadow-xs"
                  : "hover:bg-slate-800/60 hover:text-white text-slate-400"
              }`}
            >
              <span>📊 Reports</span>
            </Link>

            {/* Unified Services Dropdown Menu */}
            <div className="relative" ref={servicesMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowServicesMenu(!showServicesMenu);
                  setShowRoleDropdown(false);
                  setSearchQuery("");
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  showServicesMenu
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold"
                    : "hover:bg-slate-800/60 hover:text-white text-slate-400"
                }`}
              >
                <span>⚡ Grid Services & Rails</span>
                <span className={`text-[9px] transition-transform duration-150 ${showServicesMenu ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {/* Clean Tabbed Services Dropdown */}
              {showServicesMenu && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150 text-slate-200">
                  {/* Top Search Input */}
                  <div className="p-2.5 border-b border-slate-800 bg-slate-950/60">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                        🔍
                      </span>
                      <input
                        type="text"
                        placeholder="Search 20+ rails, DPI & adapters (e.g. PQC, Mule, CBS)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Filtered Search Results OR Clean Tabs */}
                  {filteredServices ? (
                    <div className="p-2 max-h-[380px] overflow-y-auto space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                        Search Results ({filteredServices.length})
                      </div>
                      {filteredServices.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          No matching rails or services found.
                        </div>
                      ) : (
                        filteredServices.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              item.action();
                              setShowServicesMenu(false);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/90 transition text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shrink-0">
                                {item.icon}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {item.desc}
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 shrink-0 ml-2">
                              {item.tag}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Clean Segmented Tabs */}
                      <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/40 border-b border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveTab("sovereign")}
                          className={`py-1.5 px-2 rounded-lg font-semibold transition cursor-pointer text-center truncate ${
                            activeTab === "sovereign"
                              ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow-xs"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          ⚡ Sovereign 6
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("dpi")}
                          className={`py-1.5 px-2 rounded-lg font-semibold transition cursor-pointer text-center truncate ${
                            activeTab === "dpi"
                              ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow-xs"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          🇮🇳 RBI DPI (2025)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("adapters")}
                          className={`py-1.5 px-2 rounded-lg font-semibold transition cursor-pointer text-center truncate ${
                            activeTab === "adapters"
                              ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow-xs"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          ⚙️ Adapters
                        </button>
                      </div>

                      {/* Items List */}
                      <div className="p-2 max-h-[380px] overflow-y-auto space-y-1">
                        {currentTabItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              item.action();
                              setShowServicesMenu(false);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/90 transition text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
                                {item.icon}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {item.desc}
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 shrink-0 ml-2">
                              {item.tag}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* 3. Right: Live Pulse, Role Switcher & User Profile */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Live Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>e-Kuber Live</span>
            </div>

            {/* Role Switcher */}
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowRoleDropdown(!showRoleDropdown);
                  setShowServicesMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition font-medium cursor-pointer"
                title="Switch Active Clearing Persona"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="truncate max-w-[120px] font-semibold text-xs">
                  {currentRoleItem?.label || user?.role || "Switch Role"}
                </span>
                <span className={`text-[9px] text-slate-400 transition-transform ${showRoleDropdown ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 text-slate-200 animate-in fade-in duration-150">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800 mb-1">
                    Select Active Persona
                  </div>
                  <div className="max-h-[320px] overflow-y-auto space-y-0.5">
                    {DEMO_ROLES.map((roleItem) => {
                      const isCurrent = user?.email === roleItem.email;
                      return (
                        <button
                          key={roleItem.email}
                          type="button"
                          onClick={() => handleQuickSwitch(roleItem)}
                          disabled={switching}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                            isCurrent
                              ? "bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/80"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="truncate font-semibold">{roleItem.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{roleItem.sublabel}</div>
                          </div>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-mono shrink-0">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Sign Out */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div
                  className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs font-mono shadow-xs"
                  title={user.email}
                >
                  {user.name?.charAt(0) || "U"}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                  title="Sign out of session"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Toggle mobile menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-2 text-xs">
            <Link
              to={clearingDeskPath}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-slate-200 hover:text-cyan-300 font-semibold"
            >
              📋 Operations Desk
            </Link>
            <Link
              to="/reports"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-slate-200 hover:text-cyan-300 font-semibold"
            >
              📊 MIS Reports
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowServicesMenu(true);
              }}
              className="w-full text-left py-1.5 text-cyan-300 font-semibold"
            >
              ⚡ Grid Services & Rails (Open Launcher)
            </button>
          </div>
        )}
      </header>

      {/* Keep all Institutional Modals mounted & accessible */}
      {showPpsModal && <PositivePayRegistryModal onClose={() => setShowPpsModal(false)} />}
      {showCollateralModal && <DynamicCollateralManagementModal onClose={() => setShowCollateralModal(false)} />}
      {showCimsModal && <RbiCimsRegulatoryModal onClose={() => setShowCimsModal(false)} />}
      {showCbsModal && <CoreBankingAdapterModal onClose={() => setShowCbsModal(false)} />}
      {showWhatsAppModal && <WhatsAppBankingModal onClose={() => setShowWhatsAppModal(false)} />}
      {showVoiceModal && <RegionalVoiceBankingModal onClose={() => setShowVoiceModal(false)} />}
      {showRadarModal && <GeospatialTransitRadarModal onClose={() => setShowRadarModal(false)} />}
      {showSelfHealingModal && <AutonomousSelfHealingModal onClose={() => setShowSelfHealingModal(false)} />}

      {/* Sovereign 6 Pillars Modals */}
      {showAcousticModal && <AcousticMeshOfflineModal isOpen={showAcousticModal} onClose={() => setShowAcousticModal(false)} />}
      {showLiquiditySwarmModal && <AutonomousLiquiditySwarmModal isOpen={showLiquiditySwarmModal} onClose={() => setShowLiquiditySwarmModal(false)} />}
      {showDeepfakeModal && <DeepfakeForensicLabModal isOpen={showDeepfakeModal} onClose={() => setShowDeepfakeModal(false)} />}
      {showCbdcSplitterModal && <ProgrammableCbdcSplitterModal isOpen={showCbdcSplitterModal} onClose={() => setShowCbdcSplitterModal(false)} />}
      {showCrossBorderCorridorModal && <CrossBorderCorridorModal isOpen={showCrossBorderCorridorModal} onClose={() => setShowCrossBorderCorridorModal(false)} />}
      {showDeveloperSdkModal && <DeveloperSdkPortalModal isOpen={showDeveloperSdkModal} onClose={() => setShowDeveloperSdkModal(false)} />}

      {/* 2025 DPI Modals */}
      {showMuleHunterModal && <MuleHunterRadarModal onClose={() => setShowMuleHunterModal(false)} />}
      {showHourlyClearingModal && <HourlyContinuousClearingModal onClose={() => setShowHourlyClearingModal(false)} />}
      {showNeslModal && <NeslSection138Modal onClose={() => setShowNeslModal(false)} />}
      {showUliModal && <UliAccountAggregatorModal onClose={() => setShowUliModal(false)} />}
      {showBhashiniModal && <BhashiniVoiceBankingModal onClose={() => setShowBhashiniModal(false)} />}
      {showSrvaModal && <SrvaVostroSettlementModal onClose={() => setShowSrvaModal(false)} />}
    </>
  );
}
