import React, { useEffect, useState, lazy, Suspense } from "react";
import Navbar from "../components/Navbar";
import SettlementSummary from "../components/SettlementSummary";
import ContinuousClearingConsole from "../components/ContinuousClearingConsole";
import FraudFlagsPanel from "../components/FraudFlagsPanel";
import client from "../api/client";
import { useClearingEvents } from "../hooks/useClearingEvents";

const BatchManagementPanel = lazy(() => import("../components/BatchManagementPanel"));
const DevOpsConsole = lazy(() => import("../components/DevOpsConsole"));
const AnalyticsDashboard = lazy(() => import("../components/AnalyticsDashboard"));
const LedgerIntegrityPanel = lazy(() => import("../components/LedgerIntegrityPanel"));
const VirtualHSMEnclavePanel = lazy(() => import("../components/VirtualHSMEnclavePanel"));
const CyberneticWarRoomConsole = lazy(() => import("../components/CyberneticWarRoomConsole"));
const SwarmDeliberationSandbox = lazy(() => import("../components/SwarmDeliberationSandbox"));
const HighThroughputStressEngine = lazy(() => import("../components/HighThroughputStressEngine"));
const OpenBankingWebhookPortal = lazy(() => import("../components/OpenBankingWebhookPortal"));

function TabLoader() {
  return (
    <div className="p-12 flex flex-col items-center justify-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mb-3" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Loading module...
      </span>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-slate-900/90 rounded-xl shadow-md border border-slate-800 p-4">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color || "text-white"}`}>{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("operations"); // "operations", "batches", "analytics", "ledger", "utilities"
  const [utilitySubTab, setUtilitySubTab] = useState("devops"); // "devops", "war_room", "hsm", "stress", "webhooks", "swarm"
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);

  async function load() {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        client.get("/admin/stats"),
        client.get("/admin/audit-trail"),
      ]);
      setStats(statsRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useClearingEvents(() => {
    load();
  });

  return (
    <div className="min-h-screen bg-[#080c14] pb-16 text-slate-100">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Clean Bank Header */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-950 text-blue-300 border border-blue-800">
                SURAT PEOPLES CO OP BANK
              </span>
              <span className="text-xs text-slate-400 font-mono">Central Clearing Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Administrative & Clearing Operations
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Cheque Truncation System (CTS), RBI e-Kuber Multilateral Net Settlement & Regulatory Audit
            </p>
          </div>

          {/* Clean Segmented Tab Controller */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("operations")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "operations"
                  ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Operations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("batches")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "batches"
                  ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sessions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ledger")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Ledger
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("utilities")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "utilities"
                  ? "bg-cyan-950 text-cyan-300 shadow-sm border border-cyan-800"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              System Utilities
            </button>
          </div>
        </div>

        {/* Tab 1: Clearing Operations */}
        {activeTab === "operations" && (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Total instruments" value={stats.total} />
                <StatCard label="Presented" value={stats.byStatus.PRESENTED} color="text-amber-700" />
                <StatCard label="Verified" value={stats.byStatus.VERIFIED} color="text-blue-700" />
                <StatCard label="Cleared" value={stats.byStatus.CLEARED} color="text-emerald-700" />
                <StatCard label="Returned" value={stats.byStatus.RETURNED} color="text-rose-700" />
              </div>
            )}

            {/* Continuous Clearing & e-Kuber Console */}
            <ContinuousClearingConsole />

            <FraudFlagsPanel />

            <SettlementSummary />

            {/* Audit Trail */}
            <div className="bg-white rounded-xl shadow-xs p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Regulatory Clearing Audit Trail
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {events.length} Event Logs
                </span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {events.map((e) => (
                  <div key={e.id} className="text-xs border-b border-slate-100 pb-2.5">
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>{" "}
                    - Cheque <span className="font-mono font-semibold text-slate-800">{e.cheque?.chequeNumber}</span>{" "}
                    <span className="font-medium text-slate-700">
                      {e.fromStatus ? `${e.fromStatus} → ${e.toStatus}` : `created as ${e.toStatus}`}
                    </span>
                    {e.actor && <span className="text-slate-400"> by {e.actor.name}</span>}
                    {e.remarks && <div className="text-[11px] text-slate-500 mt-0.5">{e.remarks}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<TabLoader />}>
          {/* Tab 2: Sessions */}
          {activeTab === "batches" && (
            <div>
              <BatchManagementPanel />
            </div>
          )}

          {/* Tab 3: Analytics */}
          {activeTab === "analytics" && (
            <div>
              <AnalyticsDashboard />
            </div>
          )}

          {/* Tab 4: Ledger & Integrity */}
          {activeTab === "ledger" && (
            <div>
              <LedgerIntegrityPanel />
            </div>
          )}

          {/* Tab 5: Clean System Utilities Sub-Console */}
          {activeTab === "utilities" && (
            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap gap-2 text-xs">
                {[
                  { id: "devops", label: "DevOps & SRE Diagnostics" },
                  { id: "war_room", label: "DC Failover / War Room" },
                  { id: "hsm", label: "Virtual HSM Key Ceremony" },
                  { id: "stress", label: "TPS Stress Testing" },
                  { id: "webhooks", label: "CBS Webhooks & API" },
                  { id: "swarm", label: "AI Swarm Deliberation" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUtilitySubTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      utilitySubTab === item.id
                        ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-800"
                        : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                {utilitySubTab === "devops" && <DevOpsConsole />}
                {utilitySubTab === "war_room" && <CyberneticWarRoomConsole />}
                {utilitySubTab === "hsm" && <VirtualHSMEnclavePanel />}
                {utilitySubTab === "stress" && <HighThroughputStressEngine />}
                {utilitySubTab === "webhooks" && <OpenBankingWebhookPortal />}
                {utilitySubTab === "swarm" && <SwarmDeliberationSandbox />}
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
