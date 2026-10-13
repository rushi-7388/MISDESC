import React, { useEffect, useState, lazy, Suspense } from "react";
import Navbar from "../components/Navbar";
import SettlementSummary from "../components/SettlementSummary";
import ContinuousClearingConsole from "../components/ContinuousClearingConsole";
import FraudFlagsPanel from "../components/FraudFlagsPanel";
import client from "../api/client";

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
    <div className="p-12 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-gray-100 shadow-xs">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Loading module...</span>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4">
      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color || "text-gray-900"}`}>{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("operations"); // "operations", "batches", "analytics", "ledger", "war_room", "hsm", "devops"
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

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Enterprise Administration</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Cheque Truncation Operations, Continuous Clearing Engine, and SRE Observability Platform
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-gray-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("operations")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "operations"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Operations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("batches")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "batches"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Sessions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("war_room")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "war_room"
                  ? "bg-cyan-700 text-white shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              🌐 War Room (DC Failover)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hsm")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "hsm"
                  ? "bg-purple-700 text-white shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              🛡️ Virtual HSM
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "analytics"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ledger")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "ledger"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Audit Ledger
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("swarm")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "swarm"
                  ? "bg-purple-700 text-white shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              🤖 AI Swarm Sandbox
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stress")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "stress"
                  ? "bg-rose-700 text-white shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              🚀 Stress Engine (1k+ TPS)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("webhooks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "webhooks"
                  ? "bg-indigo-700 text-white shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              📡 CBS Webhooks & Open Banking
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("devops")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "devops"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              DevOps / SRE
            </button>
          </div>
        </div>

        {/* Tab 1: Clearing Operations */}
        {activeTab === "operations" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Total cheques" value={stats.total} />
                <StatCard label="Presented" value={stats.byStatus.PRESENTED} color="text-yellow-600" />
                <StatCard label="Verified" value={stats.byStatus.VERIFIED} color="text-blue-600" />
                <StatCard label="Cleared" value={stats.byStatus.CLEARED} color="text-emerald-600" />
                <StatCard label="Returned" value={stats.byStatus.RETURNED} color="text-rose-600" />
              </div>
            )}

            {/* India Next-Gen MISDESC 3.0: Continuous Clearing & e-Kuber Real-Time Console */}
            <ContinuousClearingConsole />

            <FraudFlagsPanel />

            <SettlementSummary />

            <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
              <h2 className="font-bold text-base text-gray-900 mb-4">Regulatory Clearing Audit Trail</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {events.map((e) => (
                  <div key={e.id} className="text-xs border-b border-gray-100 pb-2.5">
                    <span className="font-mono text-[11px] text-gray-400">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>{" "}
                    - Cheque <span className="font-mono font-semibold">{e.cheque?.chequeNumber}</span>{" "}
                    <span className="font-medium text-gray-700">
                      {e.fromStatus ? `${e.fromStatus} → ${e.toStatus}` : `created as ${e.toStatus}`}
                    </span>
                    {e.actor && <span className="text-gray-400"> by {e.actor.name}</span>}
                    {e.remarks && <div className="text-[11px] text-gray-500 mt-0.5">{e.remarks}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<TabLoader />}>
          {/* Tab 2: Clearing Sessions & Batches */}
          {activeTab === "batches" && (
            <div className="animate-in fade-in duration-150">
              <BatchManagementPanel />
            </div>
          )}

          {/* Tab 3: Financial Intelligence & Velocity Analytics */}
          {activeTab === "analytics" && (
            <div className="animate-in fade-in duration-150">
              <AnalyticsDashboard />
            </div>
          )}

          {/* Tab 4: Cryptographic Blockchain Audit Ledger */}
          {activeTab === "ledger" && (
            <div className="animate-in fade-in duration-150">
              <LedgerIntegrityPanel />
            </div>
          )}

          {/* Tab 5: National War Room & DC Failover */}
          {activeTab === "war_room" && (
            <div className="animate-in fade-in duration-150">
              <CyberneticWarRoomConsole />
            </div>
          )}

          {/* Tab 6: Virtual HSM & M-of-N Key Ceremony */}
          {activeTab === "hsm" && (
            <div className="animate-in fade-in duration-150">
              <VirtualHSMEnclavePanel />
            </div>
          )}

          {/* Tab 7: Autonomous 4-Agent Swarm Deliberation Sandbox */}
          {activeTab === "swarm" && (
            <div className="animate-in fade-in duration-150">
              <SwarmDeliberationSandbox />
            </div>
          )}

          {/* Tab 8: High-Throughput Stress Engine (1k+ TPS) */}
          {activeTab === "stress" && (
            <div className="animate-in fade-in duration-150">
              <HighThroughputStressEngine />
            </div>
          )}

          {/* Tab 9: Core Banking Webhooks & OpenAPI 3.0 Explorer */}
          {activeTab === "webhooks" && (
            <div className="animate-in fade-in duration-150">
              <OpenBankingWebhookPortal />
            </div>
          )}

          {/* Tab 10: DevOps & SRE Console */}
          {activeTab === "devops" && (
            <div className="animate-in fade-in duration-150">
              <DevOpsConsole />
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
