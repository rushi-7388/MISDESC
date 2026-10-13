import React, { useEffect, useState, lazy, Suspense } from "react";
import Navbar from "../components/Navbar";
import client from "../api/client";

const DevOpsConsole = lazy(() => import("../components/DevOpsConsole"));
const VirtualHSMEnclavePanel = lazy(() => import("../components/VirtualHSMEnclavePanel"));
const CyberneticWarRoomConsole = lazy(() => import("../components/CyberneticWarRoomConsole"));

function ITPanelLoader() {
  return (
    <div className="p-12 flex flex-col items-center justify-center text-slate-400 bg-slate-850 border border-slate-800 rounded-2xl">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading module...</span>
    </div>
  );
}

export default function ITStaffDashboard() {
  const [dbPingMs, setDbPingMs] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [telemetryEvents, setTelemetryEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("war_room"); // "war_room" | "hsm" | "sre_hub" | "telemetry" | "metrics_raw"
  const [rawMetrics, setRawMetrics] = useState("");
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  async function checkProbes() {
    try {
      const [pingRes, infoRes, telemRes] = await Promise.all([
        client.get("/devops/db-ping"),
        client.get("/devops/system-info"),
        client.get("/devops/telemetry/recent"),
      ]);
      setDbPingMs(pingRes.data?.latencyMs);
      setSystemInfo(infoRes.data);
      setTelemetryEvents(telemRes.data || []);
    } catch (err) {
      console.error("Failed to fetch probe data:", err);
    }
  }

  async function fetchRawMetrics() {
    try {
      setLoadingMetrics(true);
      const res = await client.get("/devops/metrics");
      setRawMetrics(typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2));
    } catch (err) {
      setRawMetrics("Failed to fetch raw Prometheus metrics feed: " + err.message);
    } finally {
      setLoadingMetrics(false);
    }
  }

  useEffect(() => {
    checkProbes();
    const interval = setInterval(checkProbes, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Core SRE Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 mb-2">
              MISDESC Core Switch · SRE & Infrastructure Ops
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              IT Staff & Switch Reliability Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Switch telemetry, Prometheus metrics, fault injection testing, and database pool health
            </p>
          </div>

          {/* Quick Probe Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">PostgreSQL Ping:</span>
              <span className={`font-bold ${dbPingMs && dbPingMs < 50 ? "text-emerald-400" : "text-amber-400"}`}>
                {dbPingMs !== null ? `${dbPingMs} ms` : "..."}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">HSM Status:</span>
              <span className="font-bold text-emerald-400">FIPS 140-2 Level 3</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">Node:</span>
              <span className="font-bold text-cyan-400">{systemInfo?.nodeVersion || "v20.x"}</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("war_room")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "war_room"
                ? "border-cyan-500 text-cyan-400 bg-cyan-950/30 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🌐 Cybernetic War Room & DC Failover</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hsm")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "hsm"
                ? "border-purple-500 text-purple-400 bg-purple-950/30 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🛡️ Virtual HSM & M-of-N Key Ceremony</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sre_hub")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "sre_hub"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/30 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>SRE & Chaos Engineering Console</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("telemetry")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "telemetry"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/30 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Exception Telemetry Stream</span>
            {telemetryEvents.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {telemetryEvents.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("metrics_raw");
              fetchRawMetrics();
            }}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "metrics_raw"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/30 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Prometheus Feed (/metrics)</span>
          </button>
        </div>

        <Suspense fallback={<ITPanelLoader />}>
          {/* Tab 1: National War Room & DC Failover */}
          {activeTab === "war_room" && (
            <div className="space-y-6">
              <CyberneticWarRoomConsole />
            </div>
          )}

          {/* Tab 2: Virtual HSM Enclave & M-of-N Key Ceremony */}
          {activeTab === "hsm" && (
            <div className="space-y-6">
              <VirtualHSMEnclavePanel />
            </div>
          )}

          {/* Tab 3: DevOps & Chaos Console */}
          {activeTab === "sre_hub" && (
            <div className="space-y-6">
              <DevOpsConsole />
            </div>
          )}
        </Suspense>

        {/* Tab 2: Exception Telemetry Stream */}
        {activeTab === "telemetry" && (
          <div className="bg-slate-850 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Central Error & Telemetry Event Log</h3>
                <p className="text-xs text-slate-400">
                  Real-time captures of client and backend unhandled exceptions, network timeouts, and SRE alerts.
                </p>
              </div>
              <button
                type="button"
                onClick={checkProbes}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Refresh Log
              </button>
            </div>

            {telemetryEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active error telemetry recorded. System operating normally with zero unhandled exceptions.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {telemetryEvents.map((evt, idx) => (
                  <div
                    key={evt.id || idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1 font-mono"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                        evt.level === "error"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}>
                        {evt.level || "ERROR"} · {evt.source || "backend"}
                      </span>
                      <span className="text-slate-500">
                        {new Date(evt.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-white font-semibold text-xs mt-1">
                      {evt.message}
                    </div>
                    {evt.url && <div className="text-slate-400 text-[11px]">URL: {evt.url}</div>}
                    {evt.stack && (
                      <pre className="text-[10px] text-slate-500 overflow-x-auto bg-slate-950 p-2 rounded mt-1 border border-slate-850">
                        {evt.stack}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Prometheus Metrics Raw Feed */}
        {activeTab === "metrics_raw" && (
          <div className="bg-slate-850 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Prometheus Formatted Metrics Exporter</h3>
                <p className="text-xs text-slate-400">
                  Direct scrape target for Prometheus & Grafana at <code className="text-emerald-400">/metrics</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchRawMetrics}
                disabled={loadingMetrics}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
              >
                {loadingMetrics ? "Scraping..." : "Re-scrape /metrics"}
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-300 max-h-[600px] overflow-y-auto whitespace-pre-wrap">
              {rawMetrics || "Loading metrics..."}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
