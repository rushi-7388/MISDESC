import React, { useState } from "react";
import client from "../api/client";

export default function NeslSection138Modal({ onClose }) {
  const [chequeNumber, setChequeNumber] = useState("000104");
  const [amount, setAmount] = useState("250000");
  const [drawerName, setDrawerName] = useState("Kailash Agro Industries Pvt Ltd");
  const [returnReason, setReturnReason] = useState("Insufficient funds (Code 01)");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showCourtDossier, setShowCourtDossier] = useState(false);

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

            {/* Section 65B Judicial Dossier Trigger */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCourtDossier(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <span>📜 View & Export Section 65B Judicial Court Dossier</span>
              </button>
            </div>
          </div>
        )}

        {/* Formal Section 65B Judicial Court-Admissible Dossier Modal View */}
        {showCourtDossier && notice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
            <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 border-4 border-double border-slate-800 font-serif relative my-6">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div className="text-center w-full">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-600">IN THE COURT OF THE METROPOLITAN / JUDICIAL MAGISTRATE (FIRST CLASS)</div>
                  <h3 className="text-lg font-bold text-slate-950 mt-1">CERTIFICATE UNDER SECTION 65B OF THE INDIAN EVIDENCE ACT, 1872</h3>
                  <div className="text-[11px] text-slate-600 italic">(Electronic Evidence Certification for Dishonour of Cheque under Sec 138 NI Act)</div>
                </div>
                <button
                  onClick={() => setShowCourtDossier(false)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-black font-sans text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* NeSL Official Digital Stamp Token */}
              <div className="border border-amber-500/80 bg-amber-50/50 p-3 rounded-lg flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-amber-800 uppercase block font-bold">SHCIL E-STAMP CERTIFICATE</span>
                  <span className="font-bold text-amber-950">{notice.eStampNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-800 uppercase block font-bold">E-FILING DDE REFERENCE</span>
                  <span className="font-bold text-blue-900">{notice.noticeId}</span>
                </div>
              </div>

              {/* Formal Affidavit Statement */}
              <div className="text-xs leading-relaxed space-y-3 text-slate-800 font-serif">
                <p>
                  I, the undersigned Authorized Officer of <strong>SURAT PEOPLES CO OP BANK</strong>, do hereby solemnly state and affirm as follows:
                </p>
                <p>
                  1. That the computerized system known as <strong>MISDESC Sovereign Cheque Truncation Engine</strong> has been operating regularly under lawful control in the ordinary course of banking business.
                </p>
                <p>
                  2. That on presentation of Instrument No. <strong>#{chequeNumber}</strong> for amount <strong>₹{Number(amount).toLocaleString("en-IN")}</strong> drawn on <strong>{drawerName}</strong>, the same was returned dishonoured on statutory grounds: <em>"{returnReason}"</em>.
                </p>
                <p className="bg-slate-50 p-3 border border-slate-200 rounded font-mono text-[10px]">
                  <strong>Cryptographic Merkle Root Hash:</strong> {notice.sec65bAffidavit?.merkleRootHash}<br />
                  <strong>E-13B Optical Preservation Hash:</strong> sha256_e13b_{notice.noticeId?.toLowerCase()}<br />
                  <strong>Statutory 15-Day Cure Notice Window:</strong> Expiring on {notice.statutoryPaymentDeadline?.slice(0, 10)}
                </p>
              </div>

              {/* Signature Blocks */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs font-sans">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end font-script text-indigo-900 font-bold">
                    Vikram Malhotra (Checker)
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1 uppercase font-bold">Authorized Officer / Bank Manager</div>
                  <div className="text-[9px] text-slate-400">SURAT PEOPLES CO OP BANK</div>
                </div>
                <div className="text-right">
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-end font-mono text-[10px] text-slate-600">
                    SEALED VIA NeSL HSM ENCLAVE
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1 uppercase font-bold">Licensed Certifying Authority (CCA)</div>
                  <div className="text-[9px] text-slate-400">Section 65B(4) Indian Evidence Act Compliant</div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-between items-center pt-2 font-sans border-t border-slate-200">
                <span className="text-[10px] text-slate-500">Tamper-Proof Digital Judicial Evidence Dossier</span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🖨️ Print / Save Court PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
