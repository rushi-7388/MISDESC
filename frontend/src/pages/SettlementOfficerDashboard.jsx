import React, { useState } from "react";
import Navbar from "../components/Navbar";
import SettlementSummary from "../components/SettlementSummary";
import ContinuousClearingConsole from "../components/ContinuousClearingConsole";
import LiquidityConsole from "../components/LiquidityConsole";
import SessionReconciliationConsole from "../components/SessionReconciliationConsole";
import { useClearingEvents } from "../hooks/useClearingEvents";

export default function SettlementOfficerDashboard() {
  const [activeTab, setActiveTab] = useState("mns_grid"); // "mns_grid" | "ekuber_continuous" | "liquidity_lms" | "session_reconciliation"

  useClearingEvents(() => {
    // Live updates trigger refetches inside components
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Settlement Desk Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 mb-2">
              National Settlement Desk · RBI e-Kuber RTGS Gateway
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Multilateral Net Settlement & Treasury Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Continuous T+0 realization, multilateral net clearing obligations, interbank liquidity limits, and central bank RTGS UTR generation.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/reports"
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Treasury & MNS Reports</span>
            </a>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("mns_grid")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "mns_grid"
                ? "border-cyan-600 text-cyan-800 bg-cyan-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Multilateral Net Settlement (MNS) Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ekuber_continuous")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "ekuber_continuous"
                ? "border-cyan-600 text-cyan-800 bg-cyan-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>RBI e-Kuber Continuous Realization</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("liquidity_lms")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "liquidity_lms"
                ? "border-cyan-600 text-cyan-800 bg-cyan-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Intraday Liquidity & Collateral (LMS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("session_reconciliation")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "session_reconciliation"
                ? "border-cyan-600 text-cyan-800 bg-cyan-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Clearing Cutoff & Two-Way Reconcilement</span>
          </button>
        </div>

        {/* Tab 1: Multilateral Net Settlement */}
        {activeTab === "mns_grid" && (
          <div className="space-y-6">
            <SettlementSummary />
          </div>
        )}

        {/* Tab 2: RBI e-Kuber Continuous Console */}
        {activeTab === "ekuber_continuous" && (
          <div className="space-y-6">
            <ContinuousClearingConsole />
          </div>
        )}

        {/* Tab 3: Intraday Liquidity & Collateral Management */}
        {activeTab === "liquidity_lms" && (
          <div className="space-y-6">
            <LiquidityConsole />
          </div>
        )}

        {/* Tab 4: Session Cutoff & Reconcilement */}
        {activeTab === "session_reconciliation" && (
          <div className="space-y-6">
            <SessionReconciliationConsole />
          </div>
        )}
      </main>
    </div>
  );
}
