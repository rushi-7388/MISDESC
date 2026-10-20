import React, { useState } from "react";
import client from "../api/client";

export default function UliAccountAggregatorModal({ onClose }) {
  const [drawerAccount, setDrawerAccount] = useState("912010038491021");
  const [drawerGstin, setDrawerGstin] = useState("24AAACS1234F1Z5");
  const [chequeAmount, setChequeAmount] = useState("350000");
  const [currentBalance, setCurrentBalance] = useState("200000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleEvaluate() {
    setLoading(true);
    try {
      const res = await client.post("/dpi/uli/evaluate-overdraft", {
        drawerAccount,
        drawerGstin,
        chequeAmount: Number(chequeAmount),
        currentAvailableBalance: Number(currentBalance),
      });
      setResult(res.data);
    } catch (err) {
      alert("ULI evaluation failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  const shortfall = Math.max(0, Number(chequeAmount || 0) - Number(currentBalance || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 text-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
              💳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                  RBI Unified Lending Interface (ULI)
                </span>
                <span className="text-xs text-slate-400">Account Aggregator Bridge</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                Just-In-Time Micro-Overdraft & 0% Bounce Engine
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

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Drawer Account No</label>
            <input
              type="text"
              value={drawerAccount}
              onChange={(e) => setDrawerAccount(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Drawer GSTIN (Verified)</label>
            <input
              type="text"
              value={drawerGstin}
              onChange={(e) => setDrawerGstin(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Cheque Inward Amount (₹)</label>
            <input
              type="number"
              value={chequeAmount}
              onChange={(e) => setChequeAmount(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Available Ledger Balance (₹)</label>
            <input
              type="number"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Shortfall Indicator */}
        <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-400">Detected Liquidity Shortfall:</span>
          <span className={`font-mono font-bold text-sm ${shortfall > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            ₹{shortfall.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Action Trigger */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleEvaluate}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Querying Account Aggregator..." : "⚡ Interrogate ULI & Disburse JIT-OD"}
          </button>
        </div>

        {/* Result Card */}
        {result && (
          <div className="mt-6 border border-emerald-500/30 bg-emerald-950/20 rounded-2xl p-5 space-y-4 text-xs font-mono">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/40 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">ULI Facility Reference</span>
                <div className="text-sm font-bold text-white">{result.facilityRef || "DIRECT_DEBIT"}</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                ✓ 0.0% Bounce Guaranteed (Cheque Passed)
              </span>
            </div>

            <p className="text-slate-300 font-sans text-xs">{result.message}</p>

            {result.loanTerms && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Disbursed JIT-OD</span>
                  <span className="text-white font-bold">₹{result.disbursedAmount?.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tenure</span>
                  <span className="text-cyan-400 font-bold">{result.loanTerms?.tenureHours} Hours</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Interest Rate</span>
                  <span className="text-amber-400 font-bold">{result.loanTerms?.annualizedInterestRatePercent}% p.a.</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Processing Fee</span>
                  <span className="text-white font-bold">₹{result.loanTerms?.processingFeeInr}</span>
                </div>
              </div>
            )}

            {result.aaTelemetry && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="font-bold text-slate-400 text-[10px] uppercase block">
                  Account Aggregator (AA) Telemetry
                </span>
                <div className="flex flex-wrap items-center justify-between text-slate-300 text-[11px]">
                  <span>GSTN: <span className="text-white font-bold">{result.aaTelemetry?.gstin}</span></span>
                  <span>Monthly Turnover: <span className="text-emerald-400 font-bold">₹{result.aaTelemetry?.monthlyGstTurnover?.toLocaleString("en-IN")}</span></span>
                  <span>Credit Score: <span className="text-cyan-300 font-bold">{result.aaTelemetry?.creditHealthScore}</span></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
