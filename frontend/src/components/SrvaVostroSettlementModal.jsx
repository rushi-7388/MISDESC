import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function SrvaVostroSettlementModal({ onClose }) {
  const [accounts, setAccounts] = useState({});
  const [selectedVostro, setSelectedVostro] = useState("EMIRATES-NBD-SRVA");
  const [foreignAmount, setForeignAmount] = useState("25000"); // 25,000 AED
  const [chequeNumber, setChequeNumber] = useState("000105");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await client.get("/dpi/srva/accounts");
        setAccounts(res.data || {});
      } catch (err) {
        console.error("Failed to load Vostro accounts:", err);
      }
    }
    loadAccounts();
  }, []);

  const currentAcc = accounts[selectedVostro] || {
    currency: "AED",
    fxRateToInr: 22.88,
    partnerBank: "Emirates NBD PJSC (Dubai)",
    country: "United Arab Emirates",
    currentVostroBalanceInr: 450000000,
  };

  const estimatedInr = Math.round(Number(foreignAmount || 0) * (currentAcc.fxRateToInr || 22.88));

  async function handleSettle() {
    setLoading(true);
    try {
      const res = await client.post("/dpi/srva/settle", {
        vostroAccountId: selectedVostro,
        foreignCurrencyAmount: Number(foreignAmount),
        chequeNumber,
        beneficiaryAccount: "912010048291023",
        beneficiaryIfsc: "SNBL0001001",
      });
      setResult(res.data);
    } catch (err) {
      alert("SRVA Vostro settlement failed: " + (err.response?.data?.error || err.message));
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
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl">
              🌐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30 font-mono">
                  RBI A.P. (DIR) No. 10
                </span>
                <span className="text-xs text-slate-400">Special Rupee Vostro Account (SRVA)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                De-Dollarized Bilateral Rupee Vostro DvP Settlement
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

        {/* Vostro Account Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {Object.entries(accounts).map(([key, acc]) => (
            <button
              key={key}
              onClick={() => setSelectedVostro(key)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedVostro === key
                  ? "bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/30"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="text-[10px] font-mono text-slate-500 uppercase">{acc.country}</div>
              <div className="text-xs font-bold text-white mt-0.5 truncate">{acc.partnerBank}</div>
              <div className="text-xs text-cyan-300 font-mono mt-1">
                1 {acc.currency} = ₹{acc.fxRateToInr}
              </div>
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Foreign Draft Amount ({currentAcc.currency})
            </label>
            <input
              type="number"
              value={foreignAmount}
              onChange={(e) => setForeignAmount(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Cheque Number</label>
            <input
              type="text"
              value={chequeNumber}
              onChange={(e) => setChequeNumber(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Live Currency Conversion Banner */}
        <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Direct Bilateral Conversion (Zero SWIFT USD Hop)</span>
            <span className="text-lg font-bold text-white mt-0.5 block">
              {Number(foreignAmount || 0).toLocaleString()} {currentAcc.currency} → ₹{estimatedInr.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
              ⚡ Saves 3.5% FX Spread
            </span>
          </div>
        </div>

        {/* Trigger */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSettle}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Settling against Vostro Ledger..." : "⚡ Execute Bilateral Rupee DvP Settlement"}
          </button>
        </div>

        {/* Settlement Confirmation Result */}
        {result && (
          <div className="mt-6 border border-blue-500/30 bg-blue-950/20 rounded-2xl p-5 space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-800/40 pb-2">
              <span className="font-bold text-blue-300 uppercase tracking-wider">
                ✓ Bilateral SRVA DvP Settlement Confirmed
              </span>
              <span className="text-cyan-400">{result.srvaUtr}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Partner Bank</span>
                <span className="text-white font-bold truncate block">{result.partnerBank}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Net INR Credited</span>
                <span className="text-emerald-400 font-bold">₹{result.settledInrAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ISO 20022 Pacs.009</span>
                <span className="text-cyan-300 font-bold">{result.isoPacs009MsgId?.slice(0, 14)}...</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Vostro Balance Left</span>
                <span className="text-white font-bold">₹{(result.remainingVostroBalanceInr / 10000000).toFixed(1)} Cr</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-sans pt-1">
              Statutory Basis: <span className="text-blue-300">{result.statutoryCompliance}</span>. Payment finalized with instant credit to beneficiary account with zero SWIFT correspondent fees.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
