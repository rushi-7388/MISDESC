import React, { useState } from "react";
import client from "../api/client";

export default function MuleHunterRadarModal({ onClose }) {
  const [account, setAccount] = useState("ACC-MULE-882194");
  const [amount, setAmount] = useState("450000");
  const [ifsc, setIfsc] = useState("HDFC0000128");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await client.post("/dpi/mulehunter/analyze", {
        beneficiaryAccount: account,
        beneficiaryIfsc: ifsc,
        amount: Number(amount),
      });
      setResult(res.data);
    } catch (err) {
      alert("MuleHunter analysis failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 text-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-mono">
                  RBIH MuleHunter.AI
                </span>
                <span className="text-xs text-slate-400">Dec 2024 / 2025 Innovation Hub Rail</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                Real-Time Money Mule & Beneficiary Graph Radar
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Beneficiary Account
            </label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
              placeholder="e.g. ACC-MULE-882194"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Beneficiary IFSC
            </label>
            <input
              type="text"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
              placeholder="HDFC0000128"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Instrument Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
              placeholder="450000"
            />
          </div>
        </div>

        {/* Action Button & Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Presets:</span>
            <button
              onClick={() => { setAccount("ACC-MULE-882194"); setAmount("450000"); }}
              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 font-mono text-[11px] cursor-pointer"
            >
              Known Mule Node
            </button>
            <button
              onClick={() => { setAccount("ACC-CORP-GENUINE-992"); setAmount("120000"); }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] cursor-pointer"
            >
              Legitimate Vendor
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Scanning Graph Topology..." : "⚡ Scan Beneficiary Topology"}
          </button>
        </div>

        {/* Results Panel */}
        {result && (
          <div className="mt-6 border border-slate-800 bg-slate-950/60 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-extrabold ${result.riskScore >= 65 ? "text-red-400" : "text-emerald-400"}`}>
                  {result.riskScore}/100
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Mule Probability Score</div>
                  <div className={`text-sm font-bold ${result.riskScore >= 65 ? "text-red-400" : "text-emerald-400"}`}>
                    {result.riskLevel.replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              {result.muleHoldRecommended ? (
                <span className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold animate-pulse">
                  ⚠️ MuleHold Advisory Active (24h Freeze)
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  ✓ Legitimate Topology Verified
                </span>
              )}
            </div>

            {/* Graph Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Account Age</span>
                <span className="text-white font-bold text-sm">{result.graphMetrics?.accountAgeDays} Days</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">ATM Cashout Latency</span>
                <span className={`font-bold text-sm ${result.graphMetrics?.atmCashoutLatencyMinutes < 15 ? "text-amber-400" : "text-white"}`}>
                  {result.graphMetrics?.atmCashoutLatencyMinutes} Mins
                </span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Degree Centrality</span>
                <span className="text-white font-bold text-sm">{result.graphMetrics?.degreeCentrality} Remitters</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Clustering Coeff</span>
                <span className="text-cyan-400 font-bold text-sm">{result.graphMetrics?.clusteringCoefficient}</span>
              </div>
            </div>

            {/* Risk Factors */}
            {result.riskFactors?.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Identified Red Flags:
                </span>
                {result.riskFactors.map((rf, i) => (
                  <div key={i} className="text-xs text-red-300 bg-red-950/40 border border-red-900/60 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{rf}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Statutory Action */}
            <div className="text-xs text-slate-300 bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="font-bold text-amber-400">Statutory Action: </span>
              {result.statutoryAction}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
