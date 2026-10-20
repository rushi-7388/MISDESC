import React, { useState } from "react";
import client from "../api/client";

export default function NeslSection138Modal({ onClose }) {
  const [chequeNumber, setChequeNumber] = useState("000104");
  const [amount, setAmount] = useState("250000");
  const [drawerName, setDrawerName] = useState("Kailash Agro Industries Pvt Ltd");
  const [returnReason, setReturnReason] = useState("Insufficient funds (Code 01)");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await client.post("/dpi/nesl/generate-notice", {
        chequeNumber,
        amount: Number(amount),
        drawerName,
        returnReason,
        payeeName: "Surat Commercial Traders Association",
        draweeBankName: "HDFC Bank",
      });
      setNotice(res.data);
    } catch (err) {
      alert("Failed to generate notice: " + (err.response?.data?.error || err.message));
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
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl">
              ⚖️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30 font-mono">
                  NeSL DDE & SHCIL E-Stamping
                </span>
                <span className="text-xs text-slate-400">Section 138 Negotiable Instruments Act</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                Statutory 30-Day Legal Demand Notice & Sec 65B Certificate
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Cheque Number</label>
            <input
              type="text"
              value={chequeNumber}
              onChange={(e) => setChequeNumber(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-rose-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Cheque Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-rose-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Dishonour Reason</label>
            <input
              type="text"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-rose-500 outline-none"
            />
          </div>
        </div>

        {/* Action Trigger */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Sealing e-Stamp via NeSL..." : "⚡ Seal & Generate Statutory Notice"}
          </button>
        </div>

        {/* Generated Notice Display */}
        {notice && (
          <div className="mt-6 border border-slate-800 bg-slate-950/80 rounded-2xl p-5 space-y-4 text-xs font-mono">
            {/* Legal Stamp Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">SHCIL Electronic Stamp Certificate</span>
                <div className="text-sm font-bold text-amber-300">{notice.eStampNumber}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase">NeSL Evidence Reference</span>
                <div className="text-sm font-bold text-cyan-300">{notice.noticeId}</div>
              </div>
            </div>

            {/* Notice Body */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
              {notice.noticeBody}
            </div>

            {/* Section 65B Indian Evidence Act Certificate */}
            <div className="p-3 bg-blue-950/30 border border-blue-900/60 rounded-xl space-y-1 text-xs">
              <span className="font-bold text-blue-300 uppercase tracking-wider block">
                ✓ Section 65B Electronic Evidence Affidavit Attached
              </span>
              <p className="text-slate-300 text-[11px] font-sans">
                {notice.sec65bAffidavit?.dataIntegrityAffirmation}
              </p>
              <div className="text-[10px] font-mono text-slate-400 pt-1">
                Merkle Root: <span className="text-cyan-400">{notice.sec65bAffidavit?.merkleRootHash}</span>
              </div>
            </div>

            {/* Statutory Timeline Card */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">15-Day Cure Period Deadline</span>
                <span className="text-amber-400 font-bold">{notice.statutoryPaymentDeadline?.slice(0, 10)}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Magistrate Court Filing Window</span>
                <span className="text-rose-400 font-bold">{notice.courtFilingWindowEnd?.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
