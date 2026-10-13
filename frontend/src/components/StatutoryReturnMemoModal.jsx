import React, { useEffect, useState } from "react";
import client from "../api/client";

export default function StatutoryReturnMemoModal({ chequeId, onClose }) {
  const [memo, setMemo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chequeId) return;
    client
      .get(`/clearing/${chequeId}/return-memo`)
      .then(({ data }) => setMemo(data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load Return Memo"))
      .finally(() => setLoading(false));
  }, [chequeId]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handlePrint() {
    window.print();
  }

  if (!chequeId) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200"
      >
        {/* Modal Controls (Hidden during Print) */}
        <div className="px-6 py-3 border-b flex items-center justify-between bg-rose-50/50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-rose-900 uppercase tracking-wider">
              Statutory Cheque Dishonour Memo (Section 138 NI Act)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !!error}
              className="bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-auto bg-white text-gray-900 print:p-0">
          {loading && (
            <div className="py-20 text-center text-sm text-gray-500 font-medium">
              Retrieving Statutory Return Memo...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm text-center">
              {error}
            </div>
          )}

          {memo && (
            <div className="border-4 border-double border-rose-950 p-8 rounded-xl relative space-y-6">
              {/* Background Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <span className="text-8xl font-serif font-black uppercase text-rose-950">RETURNED</span>
              </div>

              {/* Memo Header */}
              <div className="text-center pb-5 border-b-2 border-rose-950">
                <div className="text-[11px] font-bold uppercase tracking-widest text-rose-800">
                  {memo.clearingHouse}
                </div>
                <h1 className="text-2xl font-serif font-black text-rose-950 uppercase tracking-wide mt-1">
                  Cheque Return & Dishonour Memo
                </h1>
                <div className="text-xs font-semibold text-gray-700 mt-1">
                  Issued under: <span className="italic">{memo.statutoryAct}</span>
                </div>
                <div className="text-xs font-mono text-gray-500 mt-1">
                  Memo Reference: <span className="font-bold text-gray-900 select-all">{memo.memoRef}</span>
                </div>
              </div>

              {/* Statutory Alert Banner */}
              <div className="bg-rose-50 border-2 border-rose-300 rounded-lg p-3 text-center">
                <div className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  OFFICIAL DISHONOUR NOTICE: INSTRUMENT RETURNED UNPAID BY DRAWEE BANK
                </div>
              </div>

              {/* Instrument & Bank Particulars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase">Cheque Serial Number</span>
                  <span className="font-mono font-bold text-base text-gray-900">{memo.chequeDetails.chequeNumber}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase">Dishonoured Amount</span>
                  <span className="font-mono font-bold text-base text-rose-900">
                    ₹{Number(memo.chequeDetails.amount).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase">Drawer Account Number</span>
                  <span className="font-mono font-semibold text-gray-900">{memo.chequeDetails.accountNumber}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase">Payee / Beneficiary Name</span>
                  <span className="font-semibold text-gray-900">{memo.chequeDetails.payeeName}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase">Drawee Bank (Paying Bank)</span>
                  <span className="font-semibold text-gray-900">{memo.banks.draweeBank}</span>
                  <span className="text-[10px] font-mono text-gray-500 block">IFSC: {memo.banks.draweeIfsc}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase">Presenting Bank (Collecting Bank)</span>
                  <span className="font-semibold text-gray-900">{memo.banks.presentingBank}</span>
                  <span className="text-[10px] font-mono text-gray-500 block">IFSC: {memo.banks.presentingIfsc}</span>
                </div>
              </div>

              {/* Statutory Reason for Return */}
              <div className="p-4 rounded-xl bg-rose-50/70 border-2 border-rose-200">
                <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider block mb-1">
                  RBI Clearing Return Reason Code & Description
                </span>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-rose-700 text-white font-mono font-bold text-xs">
                    CODE {memo.dishonour.reasonCode}
                  </span>
                  <span className="font-bold text-rose-950 text-sm">
                    {memo.dishonour.reasonDescription}
                  </span>
                </div>
                {memo.dishonour.remarks && (
                  <div className="text-xs text-rose-900 mt-2 italic">
                    Officer Remarks: "{memo.dishonour.remarks}"
                  </div>
                )}
              </div>

              {/* Legal Notice Clause */}
              <div className="text-[11px] text-gray-600 bg-gray-50 p-4 rounded-lg border leading-relaxed">
                <span className="font-bold text-gray-800 block mb-1">Statutory Notice Under Section 138 Negotiable Instruments Act:</span>
                {memo.legalNoticeClause}
              </div>

              {/* Signatory & QR Verification */}
              <div className="pt-4 border-t-2 border-gray-300 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-900">
                    Authorized Officer: {memo.dishonour.returnedByOfficer}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    Session: {memo.session} · Date: {new Date(memo.dateOfReturn).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono break-all max-w-sm">
                    MISDESC Digital Seal: {memo.digitalSeal.verificationDigest}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                      OFFICIAL MISDESC
                    </div>
                    <div className="text-[9px] text-gray-500">DIGITAL BANK SEAL</div>
                  </div>
                  <div className="border border-rose-900 px-3 py-2 bg-white flex items-center justify-center shrink-0">
                    <span className="font-mono text-[10px] font-bold text-rose-900">SEALED</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
