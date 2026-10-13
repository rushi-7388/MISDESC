import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import ClearingStatusTable from "../components/ClearingStatusTable";
import VerificationPanel from "../components/VerificationPanel";
import DraweeVerificationCard from "../components/DraweeVerificationCard";
import ChequeViewerModal from "../components/ChequeViewerModal";
import EKuberAdviceModal from "../components/EKuberAdviceModal";
import StatutoryReturnMemoModal from "../components/StatutoryReturnMemoModal";
import { useClearingEvents } from "../hooks/useClearingEvents";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

function StatCard({ label, value, subtext, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 relative overflow-hidden transition-all shadow-xs">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 tracking-tight ${color || "text-slate-900"}`}>{value}</div>
      {subtext && <div className="text-[11px] text-slate-400 mt-0.5">{subtext}</div>}
    </div>
  );
}

export default function DraweeBankDashboard() {
  const { user } = useAuth();
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("action_needed"); // "action_needed", "awaiting_checker", "all", "cleared", "returned"
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // "cards" (Zero-scroll workbench) or "table" (Sticky actions table)

  // Interactive Modals
  const [viewerCheque, setViewerCheque] = useState(null);
  const [ekuberChequeId, setEkuberChequeId] = useState(null);
  const [returnMemoChequeId, setReturnMemoChequeId] = useState(null);

  // Clerk High-Speed Hotkey Navigation State (J/K, Space, S, R)
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hotkeyFeedback, setHotkeyFeedback] = useState(null);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(true);

  const showToast = (msg) => {
    setHotkeyFeedback(msg);
    setTimeout(() => setHotkeyFeedback(null), 3000);
  };

  async function load() {
    try {
      const { data } = await client.get("/cheques");
      setCheques(data);
    } catch (err) {
      console.error("Failed to load cheques:", err);
    } finally {
      setLoading(false);
    }
  }

  // Quick Approve/Clear Cheque via Hotkey [S]
  async function handleQuickApprove(targetCheque) {
    if (!targetCheque) return;
    try {
      showToast(`⚡ Passing & Clearing Cheque #${targetCheque.chequeNumber}...`);
      await client.patch(`/cheques/${targetCheque.id}/status`, {
        status: "CLEARED",
        remarks: "Fast-tracked & Cleared via Clerk Hotkey [S]",
      });
      showToast(`✓ Cheque #${targetCheque.chequeNumber} cleared successfully!`);
      await load();
    } catch (err) {
      showToast(`✗ Failed to clear: ${err.response?.data?.error || err.message}`);
    }
  }

  useEffect(() => {
    load();
  }, []);


  useClearingEvents(() => {
    load();
  });

  // Calculate Key Operational Metrics (Global)
  const metrics = useMemo(() => {
    const actionNeeded = cheques.filter((c) => ["PRESENTED", "AWAITING_CHECKER"].includes(c.status));
    const awaitingChecker = cheques.filter((c) => c.status === "AWAITING_CHECKER");
    const cleared = cheques.filter((c) => c.status === "CLEARED");
    const returned = cheques.filter((c) => c.status === "RETURNED");
    const pendingExposure = actionNeeded.reduce((acc, c) => acc + Number(c.amount || 0), 0);

    return {
      total: cheques.length,
      actionNeededCount: actionNeeded.length,
      awaitingCheckerCount: awaitingChecker.length,
      clearedCount: cleared.length,
      returnedCount: returned.length,
      pendingExposure,
    };
  }, [cheques]);

  // Robust search matcher checking Cheque ID, Batch ID, Session Code, Cheque Number, Payee, Account, IFSC, etc.
  const isMatch = (c, q) => {
    if (!q) return true;
    const query = q.toLowerCase();
    const id = (c.id || "").toLowerCase();
    const chequeNumber = (c.chequeNumber || "").toLowerCase();
    const batchId = (c.batchId || "").toLowerCase();
    const sessionCode = (c.batch?.sessionCode || "").toLowerCase();
    const sessionName = (c.batch?.sessionName || "").toLowerCase();
    const accountNumber = (c.accountNumber || "").toLowerCase();
    const micrCode = (c.micrCode || "").toLowerCase();
    const payeeName = (c.payeeName || "").toLowerCase();
    const amount = (c.amount || "").toString().toLowerCase();
    const presentingBankName = (c.presentingBank?.name || "").toLowerCase();
    const presentingBankCode = (c.presentingBank?.code || "").toLowerCase();
    const presentingBankIfsc = (c.presentingBank?.ifsc || "").toLowerCase();
    const draweeBankName = (c.draweeBank?.name || "").toLowerCase();
    const draweeBankIfsc = (c.draweeBank?.ifsc || "").toLowerCase();
    const status = (c.status || "").toLowerCase();
    const ekuberUtr = (c.ekuberUtr || "").toLowerCase();

    return (
      id.includes(query) ||
      chequeNumber.includes(query) ||
      batchId.includes(query) ||
      sessionCode.includes(query) ||
      sessionName.includes(query) ||
      accountNumber.includes(query) ||
      micrCode.includes(query) ||
      payeeName.includes(query) ||
      amount.includes(query) ||
      presentingBankName.includes(query) ||
      presentingBankCode.includes(query) ||
      presentingBankIfsc.includes(query) ||
      draweeBankName.includes(query) ||
      draweeBankIfsc.includes(query) ||
      status.includes(query) ||
      ekuberUtr.includes(query)
    );
  };

  // Cheques matching search query regardless of tab
  const matchingCheques = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return cheques;
    return cheques.filter((c) => isMatch(c, q));
  }, [cheques, searchQuery]);

  // Tab counts dynamically adjusted if searching
  const tabCounts = useMemo(() => {
    const pool = searchQuery.trim() ? matchingCheques : cheques;
    const actionNeeded = pool.filter((c) => ["PRESENTED", "AWAITING_CHECKER"].includes(c.status));
    const awaitingChecker = pool.filter((c) => c.status === "AWAITING_CHECKER");
    const cleared = pool.filter((c) => c.status === "CLEARED");
    const returned = pool.filter((c) => c.status === "RETURNED");

    return {
      total: pool.length,
      actionNeeded: actionNeeded.length,
      awaitingChecker: awaitingChecker.length,
      cleared: cleared.length,
      returned: returned.length,
    };
  }, [cheques, matchingCheques, searchQuery]);

  // Filtered cheques to display
  const { filteredCheques, isCrossTabSearch } = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) {
      const list = cheques.filter((c) => {
        if (activeTab === "action_needed" && !["PRESENTED", "AWAITING_CHECKER"].includes(c.status)) return false;
        if (activeTab === "awaiting_checker" && c.status !== "AWAITING_CHECKER") return false;
        if (activeTab === "cleared" && c.status !== "CLEARED") return false;
        if (activeTab === "returned" && c.status !== "RETURNED") return false;
        return true;
      });
      return { filteredCheques: list, isCrossTabSearch: false };
    }

    // When searching:
    if (activeTab === "all") {
      return { filteredCheques: matchingCheques, isCrossTabSearch: false };
    }

    const tabFiltered = matchingCheques.filter((c) => {
      if (activeTab === "action_needed" && !["PRESENTED", "AWAITING_CHECKER"].includes(c.status)) return false;
      if (activeTab === "awaiting_checker" && c.status !== "AWAITING_CHECKER") return false;
      if (activeTab === "cleared" && c.status !== "CLEARED") return false;
      if (activeTab === "returned" && c.status !== "RETURNED") return false;
      return true;
    });

    // If active tab has matching results, show them.
    // If active tab has 0 matches but matching cheques exist in other tabs (e.g. cheque was settled/cleared),
    // show matching cheques so the search for Cheque ID or Batch NEVER comes up blank!
    if (tabFiltered.length > 0) {
      return { filteredCheques: tabFiltered, isCrossTabSearch: false };
    } else if (matchingCheques.length > 0) {
      return { filteredCheques: matchingCheques, isCrossTabSearch: true };
    }

    return { filteredCheques: [], isCrossTabSearch: false };
  }, [cheques, matchingCheques, activeTab, searchQuery]);

  // Keep selectedIndex within valid range
  useEffect(() => {
    if (selectedIndex >= filteredCheques.length && filteredCheques.length > 0) {
      setSelectedIndex(filteredCheques.length - 1);
    }
  }, [filteredCheques.length, selectedIndex]);

  // Clerk High-Speed Hotkey Listener (J, K, Space, S, R)
  useEffect(() => {
    function handleKeyDown(e) {
      if (!hotkeysEnabled) return;
      const tag = e.target.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target.isContentEditable) {
        return;
      }

      if (e.key === "Escape") {
        setViewerCheque(null);
        setReturnMemoChequeId(null);
        setEkuberChequeId(null);
        return;
      }

      if (filteredCheques.length === 0) return;
      const activeCheque = filteredCheques[selectedIndex] || filteredCheques[0];

      if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIdx = Math.min(selectedIndex + 1, filteredCheques.length - 1);
        setSelectedIndex(nextIdx);
        showToast(`[J] Focus Cheque #${filteredCheques[nextIdx]?.chequeNumber}`);
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIdx = Math.max(selectedIndex - 1, 0);
        setSelectedIndex(prevIdx);
        showToast(`[K] Focus Cheque #${filteredCheques[prevIdx]?.chequeNumber}`);
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (activeCheque) {
          setViewerCheque(activeCheque);
          showToast(`[Space] Inspecting Cheque #${activeCheque.chequeNumber}`);
        }
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (activeCheque && ["PRESENTED", "AWAITING_CHECKER"].includes(activeCheque.status)) {
          handleQuickApprove(activeCheque);
        } else if (activeCheque) {
          showToast(`Cheque #${activeCheque.chequeNumber} is ${activeCheque.status}`);
        }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        if (activeCheque) {
          setReturnMemoChequeId(activeCheque.id);
          showToast(`[R] Initiating Return Memo for Cheque #${activeCheque.chequeNumber}`);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredCheques, selectedIndex, hotkeysEnabled]);

  return (
    <div className="min-h-screen bg-gray-50/60 pb-16">

      <Navbar />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Executive Header Banner */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Inward Clearing & Verification Workbench
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                Horizon Digital Bank (HDFC0005678)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Drawee Scrutiny Desk · MISDESC-2010 Standards · e-Kuber Settlement
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-500">Officer:</span>
              <span className="font-semibold text-slate-900">{user?.name || "Drawee Verifier"}</span>
              <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 uppercase">
                {user?.email === "checker@hdb.com" ? "Senior Approver (Checker)" : "Verifier (Maker)"}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800">
              e-Kuber T+0 Active
            </div>
          </div>
        </div>

        {/* 4-Eyes Governance Operational Banner */}
        {user?.email === "drawee@hdb.com" ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-indigo-950">Maker Mode (Initial Scrutiny):</span>
              <span className="text-indigo-800 ml-1">
                Verify cheque security and drawer signatures. Instruments exceeding ₹1,00,000 or with fraud risk route to the Senior Checker under Four-Eyes governance.
              </span>
            </div>
            <button
              type="button"
              onClick={() => client.post("/auth/login", { email: "checker@hdb.com", password: "password123" }).then(res => { localStorage.setItem("MISDESC_token", res.data.token); localStorage.setItem("MISDESC_user", JSON.stringify(res.data.user)); window.location.reload(); })}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer"
            >
              Switch to Checker Mode →
            </button>
          </div>
        ) : user?.email === "checker@hdb.com" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-amber-950">Senior Approver Mode (Checker):</span>
              <span className="text-amber-800 ml-1">
                Dual authorization authority. Review instruments awaiting senior approval to grant clearance or generate return memos.
              </span>
            </div>
            <button
              type="button"
              onClick={() => client.post("/auth/login", { email: "drawee@hdb.com", password: "password123" }).then(res => { localStorage.setItem("MISDESC_token", res.data.token); localStorage.setItem("MISDESC_user", JSON.stringify(res.data.user)); window.location.reload(); })}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors cursor-pointer"
            >
              Switch to Maker Mode →
            </button>
          </div>
        ) : null}

        {/* 5 KPI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            label="Action Required"
            value={metrics.actionNeededCount}
            subtext="Needs Verification"
            color="text-amber-600"
          />
          <StatCard
            label="Awaiting Checker"
            value={metrics.awaitingCheckerCount}
            subtext="Four-Eyes Dual Sign-Off"
            color="text-purple-600"
          />
          <StatCard
            label="Settled"
            value={metrics.clearedCount}
            subtext="e-Kuber UTR Assigned"
            color="text-emerald-600"
          />
          <StatCard
            label="Returned"
            value={metrics.returnedCount}
            subtext="Dishonour Memos"
            color="text-rose-600"
          />
          <StatCard
            label="Pending Exposure"
            value={`₹${(metrics.pendingExposure / 100000).toFixed(2)}L`}
            subtext="Pending Clearing INR"
            color="text-slate-900"
          />
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("action_needed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "action_needed"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>Action Needed</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "action_needed" ? "bg-amber-800 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {tabCounts.actionNeeded}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("awaiting_checker")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "awaiting_checker"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>Awaiting Checker</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "awaiting_checker" ? "bg-purple-800 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {tabCounts.awaitingChecker}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>All Inward</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "all" ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {tabCounts.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cleared")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "cleared"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>Cleared</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "cleared" ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {tabCounts.cleared}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("returned")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "returned"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>Returned</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "returned" ? "bg-rose-800 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {tabCounts.returned}
              </span>
            </button>
          </div>

          {/* Search Input & View Mode */}
          <div className="flex items-center gap-2">
            <div className="relative w-64 sm:w-80 md:w-96">
              <input
                type="text"
                placeholder="Search Cheque ID, Batch #, Cheque #, Payee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 pr-8 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  title="Clear search"
                >
                  [x]
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-white text-purple-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-purple-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Active Search Context Indicator */}
        {searchQuery.trim() && (
          <div className="bg-purple-50/80 border border-purple-200/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-purple-900 font-medium">
                Searching: <span className="font-mono font-bold text-purple-950 bg-white px-2 py-0.5 rounded border border-purple-200">"{searchQuery.trim()}"</span>
              </span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-purple-200/80 text-purple-900 font-mono text-[11px]">
                {filteredCheques.length} match{filteredCheques.length === 1 ? "" : "es"}
              </span>
              {isCrossTabSearch && (
                <span className="text-amber-800 bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-2xs">
                  <span>Matching cheque found in another status (showing across all tabs)</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-gray-200/80 text-gray-500">
            <p className="text-xs font-semibold">Loading Inward Clearing Queue...</p>
          </div>
        ) : filteredCheques.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-gray-900">
              {searchQuery.trim() ? "No Instruments Matched Your Search" : "No Instruments in this Queue"}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {searchQuery.trim()
                ? `No instruments matched "${searchQuery.trim()}". You can search by Cheque UUID, Batch Code (e.g. BATCH-20260922-9507), Cheque Number, Payee Name, Account Number, or Bank IFSC.`
                : activeTab === "action_needed"
                ? "All presented inward instruments have been verified and processed. Queue is clear."
                : "No cheques found matching the selected filter criteria."}
            </p>
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Clear Search & Show All
              </button>
            ) : activeTab !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                View All Inward Instruments
              </button>
            ) : null}
          </div>
        ) : viewMode === "cards" ? (
          /* Zero-Scroll Workbench Cards Grid with Hotkey Target Indicator */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCheques.map((c, idx) => (
              <div
                key={c.id}
                onClick={() => setSelectedIndex(idx)}
                className={`relative rounded-2xl transition-all duration-150 cursor-pointer ${
                  idx === selectedIndex && hotkeysEnabled
                    ? "ring-2 ring-purple-600 ring-offset-2 ring-offset-gray-50 shadow-md"
                    : "hover:ring-1 hover:ring-purple-200"
                }`}
              >
                {idx === selectedIndex && hotkeysEnabled && (
                  <div className="absolute -top-2.5 right-4 z-20 bg-purple-700 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <span>HOTKEY TARGET</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                )}
                <DraweeVerificationCard
                  cheque={c}
                  onInspect={(cheque) => setViewerCheque(cheque)}
                  onViewEKuber={(id) => setEkuberChequeId(id)}
                  onViewReturnMemo={(id) => setReturnMemoChequeId(id)}
                  onUpdated={() => load()}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Table Queue with Sticky Right Action Column */
          <div className="space-y-2">
            <ClearingStatusTable
              cheques={filteredCheques}
              onUpdated={() => load()}
              renderActions={(cheque) => (
                <VerificationPanel cheque={cheque} onUpdated={() => load()} layout="compact" />
              )}
            />
          </div>
        )}
      </div>

      {/* Global Interactive Modals for Drawee Dashboard */}
      {viewerCheque && (
        <ChequeViewerModal
          cheque={viewerCheque}
          onClose={() => setViewerCheque(null)}
          onUpdated={() => load()}
        />
      )}

      {ekuberChequeId && (
        <EKuberAdviceModal
          chequeId={ekuberChequeId}
          onClose={() => setEkuberChequeId(null)}
        />
      )}

      {returnMemoChequeId && (
        <StatutoryReturnMemoModal
          chequeId={returnMemoChequeId}
          onClose={() => setReturnMemoChequeId(null)}
        />
      )}

      {/* High-Speed Clerk Hotkey HUD Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-white max-w-4xl transition-all">
        <div className="flex items-center gap-1.5 pr-3 border-r border-slate-800 shrink-0">
          <span className={`w-2 h-2 rounded-full ${hotkeysEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}></span>
          <span className="font-bold text-[11px] text-slate-200">CLERK HOTKEYS</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-purple-300 font-bold">J / K</span>
          <span className="text-slate-400">Navigate</span>
          <span className="text-slate-600">·</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-cyan-300 font-bold">Space</span>
          <span className="text-slate-400">Inspect</span>
          <span className="text-slate-600">·</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-emerald-300 font-bold">S</span>
          <span className="text-slate-400">Pass / Clear</span>
          <span className="text-slate-600">·</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-rose-300 font-bold">R</span>
          <span className="text-slate-400">Return Memo</span>
        </div>

        {hotkeyFeedback && (
          <div className="pl-2 border-l border-slate-800 text-cyan-300 font-bold font-mono text-[10px] truncate max-w-xs animate-pulse">
            {hotkeyFeedback}
          </div>
        )}

        <button
          type="button"
          onClick={() => setHotkeysEnabled(!hotkeysEnabled)}
          className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
            hotkeysEnabled
              ? "bg-purple-900/70 text-purple-200 border border-purple-600"
              : "bg-slate-800 text-slate-400 border border-slate-700"
          }`}
          title="Toggle high-speed clerk hotkeys"
        >
          {hotkeysEnabled ? "ENABLED" : "PAUSED"}
        </button>
      </div>
    </div>
  );
}

