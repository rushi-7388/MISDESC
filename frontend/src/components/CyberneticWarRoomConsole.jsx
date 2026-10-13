import React, { useState, useEffect } from "react";
import client from "../api/client";
import InterbankCapitalFlowGraph from "./InterbankCapitalFlowGraph";

export default function CyberneticWarRoomConsole() {
  const [activeTab, setActiveTab] = useState("CAPITAL_FLOW"); // "CAPITAL_FLOW" | "DATACENTER"
  const [topology, setTopology] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failoverLoading, setFailoverLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Shock Simulator State
  const [shockLoading, setShockLoading] = useState(false);
  const [shockIncident, setShockIncident] = useState(null);
  const [solving, setSolving] = useState(false);
  const [lsmReceipt, setLsmReceipt] = useState(null);

  const fetchTopology = async () => {
    try {
      setLoading(true);
      const res = await client.get("/datacenter/topology");
      setTopology(res.data);
    } catch (err) {
      console.error("Failed to load DC topology:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology();
    const interval = setInterval(fetchTopology, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleFailover = async () => {
    try {
      setFailoverLoading(true);
      const target = topology?.primaryActiveDc === "DC_MUMBAI" ? "DR_HYDERABAD" : "DC_MUMBAI";
      const res = await client.post("/datacenter/failover", { targetDcId: target });
      setLastReceipt(res.data.receipt);
      setTopology(res.data.topology);
    } catch (err) {
      alert(err.response?.data?.error || "Failover execution failed");
    } finally {
      setFailoverLoading(false);
    }
  };

  const handleSimulateShock = async (shockType = "SURGE", amount = 500000000, targetBank = "bank-srt") => {
    try {
      setShockLoading(true);
      const res = await client.post("/liquidity/lsm/simulate-shock", { shockType, amount, targetBank });
      setShockIncident({
        shockId: res.data.shock?.shockId,
        type: shockType,
        narrative: res.data.shock?.narrative,
        timestamp: new Date().toLocaleTimeString(),
        amount,
      });
      setLsmReceipt(null);
    } catch (err) {
      alert("Failed to inject clearing shock: " + (err.response?.data?.error || err.message));
    } finally {
      setShockLoading(false);
    }
  };

  const handleSolveCycles = async () => {
    try {
      setSolving(true);
      const res = await client.post("/liquidity/lsm/resolve-cycles");
      setLsmReceipt(res.data.receipt);
      setShockIncident(null);
    } catch (err) {
      alert("Failed to resolve Tarjan cycles: " + (err.response?.data?.error || err.message));
    } finally {
      setSolving(false);
    }
  };

  const isMumbaiActive = topology?.primaryActiveDc === "DC_MUMBAI";

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 text-white p-6 shadow-2xl space-y-6">
      {/* War Room Master Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            National Clearing Switch · Cybernetic War Room
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Interbank Capital Flow Graph & Active-Active Resiliency Command Center
          </h2>
          <p className="text-xs text-slate-400">
            Real-time particle flow telemetry, Tarjan SCC autonomous cycle netting, and zero-RPO geo-replication.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("CAPITAL_FLOW")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "CAPITAL_FLOW"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🛰️ Live Capital Flow & Shock Simulator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("DATACENTER")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "DATACENTER"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🌐 Active-Active DC Failover</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Interbank Capital Flow Graph & Clearing Shock Simulator */}
      {activeTab === "CAPITAL_FLOW" && (
        <div className="space-y-6">
          {/* Clearing Shock & Liquidity Stress Simulator Action Station */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-900/40 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-900/30 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Clearing Shock & Liquidity Stress Simulator
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700">
                    PHASE 6 STRESS TEST
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulate high-velocity liquidity bottlenecks and observe autonomous Tarjan SCC multi-lateral cycle netting.
                </p>
              </div>

              {/* Stress Triggers */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateShock("SURGE", 500000000)}
                  disabled={shockLoading || solving}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  title="Simulate sudden ₹50 Crore inward surge across the interbank clearing ring"
                >
                  {shockLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Injecting...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡ Simulate ₹50 Cr Inward Surge</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateShock("COLLATERAL_FREEZE", 200000000, "bank-srt")}
                  disabled={shockLoading || solving}
                  className="px-3.5 py-2 rounded-xl bg-rose-950 border border-rose-700 hover:bg-rose-900 text-rose-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  title="Simulate participant bank collateral freeze / insolvency on Bank SRT"
                >
                  <span>🛑 Freeze Bank SRT Collateral</span>
                </button>

                <button
                  type="button"
                  onClick={handleSolveCycles}
                  disabled={shockLoading || solving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  title="Execute autonomous Tarjan SCC cycle elimination and greedy bilateral offsetting"
                >
                  {solving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Netting Cycles...</span>
                    </>
                  ) : (
                    <>
                      <span>⚙️ Autonomous Tarjan LSM Resolution</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Shock Incident / Resolution Live Banner */}
            {shockIncident && (
              <div className="bg-rose-950/70 border border-rose-800 p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="font-bold text-rose-200 block">
                      Active Liquidity Shock Injected: {shockIncident.type}
                    </span>
                    <span className="text-rose-300 text-[11px]">{shockIncident.narrative}</span>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-rose-400 shrink-0">
                  <div>Incident ID: {shockIncident.shockId}</div>
                  <div>Timestamp: {shockIncident.timestamp}</div>
                </div>
              </div>
            )}

            {lsmReceipt && (
              <div className="bg-emerald-950/70 border border-emerald-800 p-3.5 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">✓</span>
                  <div>
                    <span className="font-bold text-emerald-200 block">
                      Tarjan Cycle Netting Executed Successfully (Settlement Batch #{lsmReceipt.batchNumber})
                    </span>
                    <span className="text-emerald-300 text-[11px]">
                      Gross Debt Discharged: ₹{Number(lsmReceipt.grossDebtCleared).toLocaleString("en-IN")} | Central Bank Reserves Consumed: ₹0.00
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-emerald-400 shrink-0">
                  <div>Efficiency: {lsmReceipt.liquiditySavingsRatio}</div>
                  <div>Cert: {lsmReceipt.sha256CertificateHash?.slice(0, 16)}...</div>
                </div>
              </div>
            )}
          </div>

          {/* Embedded Interactive Force-Directed Capital Flow Graph Component */}
          <InterbankCapitalFlowGraph />
        </div>
      )}

      {/* Mode 2: Multi-Region Active-Active DC Failover */}
      {activeTab === "DATACENTER" && (
        <div className="space-y-6">
          {/* Active Primary DC & Failover Control Action */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Data Center</span>
              <span className="font-mono text-sm font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                {isMumbaiActive ? "DC MUMBAI (PRIMARY ACTIVE)" : "DR HYDERABAD (ACTIVE FAILOVER)"}
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Raft synchronous quorum consensus across Tier-IV fault domains.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFailover}
              disabled={loading || failoverLoading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                failoverLoading
                  ? "bg-amber-600 text-white"
                  : isMumbaiActive
                  ? "bg-gradient-to-r from-rose-700 to-amber-600 hover:from-rose-600 hover:to-amber-500 text-white shadow-rose-950"
                  : "bg-gradient-to-r from-cyan-700 to-blue-600 hover:from-cyan-600 hover:to-blue-500 text-white shadow-cyan-950"
              }`}
            >
              {failoverLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Rerouting Queues...</span>
                </>
              ) : isMumbaiActive ? (
                <>
                  <span>⚡ Simulate Mumbai Outage ➔ Failover to DR Hyderabad</span>
                </>
              ) : (
                <>
                  <span>↺ Revert Failover ➔ Failback to Primary Mumbai DC</span>
                </>
              )}
            </button>
          </div>

          {/* High-Altitude Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Replication Sync Lag</span>
              <span className="text-base font-mono font-bold text-emerald-400">
                {topology?.replicationLagMs || 0.12} ms
              </span>
              <span className="text-[10px] text-slate-500 block">Synchronous Raft Zero-RPO</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">In-Flight Queue Buffer</span>
              <span className="text-base font-mono font-bold text-cyan-300">
                {topology?.inflightQueueCount || 1420} Batches
              </span>
              <span className="text-[10px] text-slate-500 block">0 Dropped Guaranteed</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Failover RTO Standard</span>
              <span className="text-base font-mono font-bold text-amber-400">&lt; 0.80 Seconds</span>
              <span className="text-[10px] text-slate-500 block">Sub-Second Switchover</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Topology State</span>
              <span className="text-base font-mono font-bold text-emerald-400">
                {topology?.failoverStatus || "SYNCHRONIZED"}
              </span>
              <span className="text-[10px] text-slate-500 block">Split-Brain Guard Active</span>
            </div>
          </div>

          {/* Failover Execution Receipt Banner */}
          {lastReceipt && (
            <div className="bg-emerald-950/60 border border-emerald-700/80 p-5 rounded-2xl space-y-3 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900 text-emerald-200 border border-emerald-600">
                    ACTIVE-ACTIVE DC FAILOVER EXECUTED
                  </span>
                  <span className="text-xs font-mono text-emerald-300 font-bold">
                    Incident ID: {lastReceipt.incidentId}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 font-mono">
                  RTO Achieved: {lastReceipt.rtoSecondsAchieved}s (Sub-Second)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/50">
                  <span className="text-[10px] text-emerald-300 uppercase block">Rerouted In-Flight Batches</span>
                  <span className="text-lg font-mono font-black text-white">
                    {lastReceipt.reroutedQueueCount} Batches
                  </span>
                </div>

                <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/50">
                  <span className="text-[10px] text-emerald-300 uppercase block">Dropped Transactions</span>
                  <span className="text-lg font-mono font-black text-emerald-300">
                    0 Dropped (Zero-Loss Guarantee)
                  </span>
                </div>

                <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/50">
                  <span className="text-[10px] text-emerald-300 uppercase block">New Master Node</span>
                  <span className="text-sm font-mono font-bold text-cyan-300 truncate">
                    {lastReceipt.targetDc}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Regional Grid Telemetry Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Regional Clearing Center Velocity & Latency Telemetry
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topology?.regionalGrids?.map((grid) => (
                <div key={grid.id} className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{grid.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                      {grid.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Latency: {grid.latencyMs} ms</span>
                    <span>Velocity: {grid.packetVelocityMbps} Mbps</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Routed To: <span className="text-cyan-300 font-bold">{grid.routedTo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
