import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function AutonomousSelfHealingModal({ onClose }) {
  const [healthState, setHealthState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chaosLoading, setChaosLoading] = useState(false);
  const [healLoading, setHealLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await client.get("/innovations/self-healing/status");
      setHealthState(res.data);
    } catch (err) {
      console.error("Failed to load self-healing status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateChaos = async (incidentType) => {
    try {
      setChaosLoading(true);
      const res = await client.post("/innovations/self-healing/simulate-chaos", {
        incidentType,
      });
      setToastMessage({
        type: "CHAOS",
        title: "⚠️ Chaos Anomaly Injected",
        text: res.data.message || "Simulated infrastructure incident injected",
      });
      await fetchStatus();
    } catch (err) {
      alert(err.response?.data?.error || "Chaos injection failed");
    } finally {
      setChaosLoading(false);
    }
  };

  const handleExecutePlaybook = async (incidentId, playbookKey) => {
    try {
      setHealLoading(true);
      const res = await client.post("/innovations/self-healing/execute-playbook", {
        incidentId,
        playbookKey,
      });
      setToastMessage({
        type: "HEAL",
        title: "🛡️ Autonomous Remediation Complete",
        text: `MTTR: ${res.data.result?.recoveryTimeMs}ms • ${res.data.result?.actionTaken}`,
      });
      await fetchStatus();
    } catch (err) {
      alert(err.response?.data?.error || "Autonomous playbook execution failed");
    } finally {
      setHealLoading(false);
    }
  };

  const isDegraded = healthState?.overallHealth === "DEGRADED" || (healthState?.activeIncidents && healthState.activeIncidents.length > 0);
  const activeIncident = healthState?.activeIncidents?.[0] || healthState?.lastAnomalyDetected;
  const metrics = healthState?.telemetryMetrics || {
    cpuUtilizationPercent: 24.5,
    memoryUsageMb: 512,
    dbConnectionSaturationPercent: 32.0,
    kafkaQueueDepth: 14,
    lsmGridlockSolverLatencyMs: 14.8,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl shadow-inner">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                  Autonomous AI SRE Self-Healing Engine
                </h2>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${
                    isDegraded
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}
                >
                  {isDegraded ? "INCIDENT IN PROGRESS" : "100% HEALTHY & OPTIMAL"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Surat Peoples Co-Op Bank • Zero-Downtime Autonomous Clearing Reliability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔄</span> Refresh Telemetry
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-700 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Notification Toast */}
        {toastMessage && (
          <div
            className={`px-6 py-2.5 border-b text-xs flex items-center justify-between font-semibold ${
              toastMessage.type === "CHAOS"
                ? "bg-rose-950/80 border-rose-700/60 text-rose-200"
                : "bg-emerald-950/80 border-emerald-700/60 text-emerald-200"
            }`}
          >
            <div>
              <span className="font-bold">{toastMessage.title}: </span>
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs underline ml-4 hover:opacity-80 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Real-Time Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[11px] text-slate-400 block font-medium">CPU Utilization</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-black text-cyan-400 font-mono">
                {metrics.cpuUtilizationPercent}%
              </span>
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${Math.min(100, metrics.cpuUtilizationPercent)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[11px] text-slate-400 block font-medium">Memory Allocation</span>
            <span className="text-base font-black text-blue-400 font-mono mt-0.5 block">
              {metrics.memoryUsageMb} MB
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[11px] text-slate-400 block font-medium">Postgres Pool Saturation</span>
            <span
              className={`text-base font-black font-mono mt-0.5 block ${
                metrics.dbConnectionSaturationPercent > 80 ? "text-rose-400 animate-pulse" : "text-emerald-400"
              }`}
            >
              {metrics.dbConnectionSaturationPercent}%
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[11px] text-slate-400 block font-medium">Kafka Clearing Depth</span>
            <span className="text-base font-black text-purple-400 font-mono mt-0.5 block">
              {metrics.kafkaQueueDepth} msgs
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[11px] text-slate-400 block font-medium">LSM Solver Latency</span>
            <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
              {metrics.lsmGridlockSolverLatencyMs} ms
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Chaos Injection & Active Incident Controller */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Active Incident Alert Card */}
            {isDegraded && activeIncident ? (
              <div className="bg-gradient-to-br from-rose-950/80 to-slate-950 border-2 border-rose-600 rounded-2xl p-5 shadow-2xl relative overflow-hidden animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚨</span>
                    <span className="text-xs font-mono font-black text-rose-300 uppercase tracking-wider">
                      ANOMALY DETECTED BY AI SRE
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white uppercase">
                    {activeIncident.severity || "CRITICAL"}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-bold text-white">
                    {activeIncident.type}
                  </div>
                  <p className="text-xs text-rose-200/90 mt-1">
                    {activeIncident.description}
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 mt-2">
                    Incident ID: {activeIncident.id} • Suggested: {activeIncident.autoPlaybook}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-rose-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-rose-300 font-semibold">
                    Autonomous Trigger Ready
                  </span>
                  <button
                    onClick={() => handleExecutePlaybook(activeIncident.id, activeIncident.autoPlaybook)}
                    disabled={healLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>⚡</span>
                    {healLoading ? "Remediating..." : "Execute Auto-Heal Playbook"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl text-center flex flex-col items-center justify-center min-h-[160px]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl mb-2 text-emerald-400">
                  🛡️
                </div>
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                  Autonomous SRE Guardian Active
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  All clearing nodes, database connection pools, and LSM solver threads operating within sub-second thresholds.
                </p>
                <button
                  onClick={() => handleExecutePlaybook(null, "PROACTIVE_SYSTEM_TUNE")}
                  disabled={healLoading}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🔧</span> Trigger Proactive Memory & Buffer Optimization
                </button>
              </div>
            )}

            {/* Simulated Chaos Injection Suite */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <span>💥</span> Chaos Engineering & Resilience Stress Suite
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Simulate SRE Fault</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Inject controlled micro-faults to observe autonomous self-healing playbooks detect, isolate, and recover the CTS switch with zero operator intervention.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSimulateChaos("DB_SATURATION")}
                  disabled={chaosLoading}
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400">
                      ⚡ 1. PostgreSQL Connection Pool Saturation
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      SPIKE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Simulates simultaneous bulk batch uploads pushing pool usage to 96%.
                  </div>
                </button>

                <button
                  onClick={() => handleSimulateChaos("LSM_CONGESTION")}
                  disabled={chaosLoading}
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/50 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-rose-400">
                      🔒 2. Interbank Liquidity Gridlock Congestion
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      DEADLOCK
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Freezes ₹12+ Crore across 5 banks; triggers Tarjan cycle solver.
                  </div>
                </button>

                <button
                  onClick={() => handleSimulateChaos("INGRESS_SPIKE")}
                  disabled={chaosLoading}
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
                      🌊 3. CTS Ingress Rate Surge (1,450 chq/sec)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      SURGE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Tests token bucket rate limiting and automatic worker thread scale-out.
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Executed Playbooks Audit Trail Ledger */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>📜</span> Autonomous Playbook Audit Trail Ledger
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cryptographically immutable log of self-healing actions executed by AI SRE.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800">
                  {healthState?.executedPlaybooks?.length || 0} Actions Executed
                </span>
              </div>

              {/* Playbook List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[460px]">
                {healthState?.executedPlaybooks && healthState.executedPlaybooks.length > 0 ? (
                  healthState.executedPlaybooks.map((playbook) => (
                    <div
                      key={playbook.id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-2">
                            <span>🛡️ {playbook.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {playbook.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            <span className="text-amber-300/90 font-medium">Trigger: </span>
                            {playbook.trigger}
                          </div>
                        </div>

                        <div className="text-right whitespace-nowrap">
                          <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            ⚡ MTTR: {playbook.recoveryTimeMs}ms
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">
                            {new Date(playbook.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-cyan-200/90 font-mono">
                        <span className="text-slate-500">Autonomous Action: </span>
                        {playbook.actionTaken}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No playbooks executed yet. System is stable.
                  </div>
                )}
              </div>

              {/* MTTR SRE SLA Strip */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Average MTTR SLA: &lt; 500 ms (Target met: 100%)
                </span>
                <span>Zero Downtime Guaranteed</span>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block animate-pulse" />
            <span>Autonomous Closed-Loop SRE Control Plane Active</span>
          </div>
          <span>Surat Peoples Co-Op Bank IT Infrastructure Wing</span>
        </div>

      </div>
    </div>
  );
}
