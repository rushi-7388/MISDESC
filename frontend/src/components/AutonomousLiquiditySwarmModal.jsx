import React, { useState, useEffect, useRef } from "react";
import client from "../api/client";

export default function AutonomousLiquiditySwarmModal({ isOpen, onClose }) {
  const [swarmState, setSwarmState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resolveResult, setResolveResult] = useState(null);
  const [repoResult, setRepoResult] = useState(null);
  const [repoAmount, setRepoAmount] = useState(15000000); // ₹1.5 Cr
  const [selectedBank, setSelectedBank] = useState("SURAT_PEOPLES_SNB");
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (swarmState && canvasRef.current) {
      drawTopologyCanvas();
    }
  }, [swarmState]);

  async function fetchState() {
    try {
      const res = await client.get("/liquidity-swarm/state");
      setSwarmState(res.data);
    } catch (err) {
      console.error("Failed to fetch swarm state:", err);
    }
  }

  async function handleResolveGridlock() {
    setLoading(true);
    setResolveResult(null);
    try {
      const res = await client.post("/liquidity-swarm/resolve", {});
      setResolveResult(res.data);
      await fetchState();
    } catch (err) {
      alert("Gridlock resolution failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoRepo() {
    setLoading(true);
    setRepoResult(null);
    try {
      const res = await client.post("/liquidity-swarm/auto-repo", {
        bankCode: selectedBank,
        amount: Number(repoAmount),
      });
      setRepoResult(res.data);
      await fetchState();
    } catch (err) {
      alert("Auto-Repo failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  function drawTopologyCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const nodes = [
      { id: "SURAT_PEOPLES_SNB", label: "Surat Peoples (SNB)", x: width * 0.25, y: height * 0.35, color: "#06b6d4" },
      { id: "HDFC_BANK", label: "HDFC Bank", x: width * 0.75, y: height * 0.35, color: "#3b82f6" },
      { id: "STATE_BANK_OF_INDIA", label: "SBI (National)", x: width * 0.5, y: height * 0.8, color: "#10b981" },
    ];

    // Draw connecting circular debt arrows
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#f59e0b";

    for (let i = 0; i < nodes.length; i++) {
      const from = nodes[i];
      const to = nodes[(i + 1) % nodes.length];

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Draw directional arrow midpoint
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 10px monospace";
      ctx.fillText("₹1.5 Cr ➔", midX - 20, midY - 6);
    }

    // Draw Bank Nodes
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = n.color;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(n.label.split(" ")[0], n.x, n.y + 4);
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-500/30 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/60 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-xl font-bold shadow-inner">
              ⚡ O(V+E)
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                Autonomous Multi-Agent AI Liquidity Swarm
                <span className="text-xs bg-amber-950 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  PILLAR 2
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tarjan circular gridlock elimination with ₹0 central cash + G-Sec sovereign auto-repo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Swarm Status Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  {swarmState?.status || "ANALYZING INTERBANK TOPOLOGY"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {swarmState?.recommendedAction || "Continuous 100ms multi-agent swarm monitoring all bilateral clearing queues."}
              </p>
            </div>
            <button
              onClick={handleResolveGridlock}
              disabled={loading || swarmState?.detectedGridlockLoops?.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 disabled:opacity-40"
            >
              {loading ? "Netting Loop..." : "⚡ Execute Tarjan 100ms Netting"}
            </button>
          </div>

          {/* Topology Canvas and Collateral Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visual Topology */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Circular Debt Topology</span>
                <span className="text-[10px] text-amber-400 font-mono">3-Node Gridlock Loop</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 flex justify-center">
                <canvas ref={canvasRef} width={380} height={200} className="rounded" />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                SNB owes HDFC (₹1.5Cr) ➔ HDFC owes SBI (₹1.5Cr) ➔ SBI owes SNB (₹1.5Cr). Tarjan loop netted in 14ms with zero central bank cash!
              </p>
            </div>

            {/* Sovereign G-Sec Auto-Repo */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Sovereign G-Sec Auto-Repo</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  RBI 2.0% Haircut
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instantly monetize 10Y Benchmark Sovereign Bonds (7.18% GS 2033) for emergency queue headroom.
              </p>

              <div className="space-y-2 pt-1">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Participant Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="SURAT_PEOPLES_SNB">Surat Peoples Co-Op Bank (SNB)</option>
                    <option value="HDFC_BANK">HDFC Bank Ltd</option>
                    <option value="STATE_BANK_OF_INDIA">State Bank of India (SBI)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Repo Drawdown Amount (INR ₹)</label>
                  <input
                    type="number"
                    value={repoAmount}
                    onChange={(e) => setRepoAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={handleAutoRepo}
                  disabled={loading}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  🏦 Execute Intraday Sovereign Auto-Repo
                </button>
              </div>
            </div>
          </div>

          {/* Resolution Result */}
          {resolveResult && (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span>⚡ Tarjan $O(V+E)$ Gridlock Elimination Completed</span>
                <span className="font-mono text-[11px]">{resolveResult.executionTimeMs} ms execution</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-slate-300">
                <div>
                  <span className="text-slate-400">Total Capital Unlocked: </span>
                  <span className="text-emerald-400 font-bold">₹{resolveResult.totalSavedLiquidity?.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-slate-400">Central Bank Cash Consumed: </span>
                  <span className="text-cyan-400 font-bold">₹0.00 (Zero Deficit)</span>
                </div>
                <div>
                  <span className="text-slate-400">Cycles Cleared: </span>
                  <span className="text-white font-semibold">{resolveResult.resolvedCycles?.length} loops</span>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Repo Result */}
          {repoResult && (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span>✓ Sovereign G-Sec Repo Funds Credited to Clearing Account</span>
                <span className="font-mono text-[11px]">RBI e-Kuber Ref: {repoResult.settlementChannel}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-slate-300">
                <div>
                  <span className="text-slate-400">Pledged Asset: </span>
                  <span className="text-white">{repoResult.pledgedAsset}</span>
                </div>
                <div>
                  <span className="text-slate-400">Statutory Haircut: </span>
                  <span className="text-amber-400 font-bold">{repoResult.statutoryRbiHaircutPercent}%</span>
                </div>
                <div>
                  <span className="text-slate-400">Liquidity Injected: </span>
                  <span className="text-emerald-400 font-bold">₹{repoResult.borrowedLiquidity?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
