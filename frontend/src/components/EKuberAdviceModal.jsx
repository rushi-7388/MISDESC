import React, { useEffect, useState } from "react";
import client from "../api/client";

export default function EKuberAdviceModal({ chequeId, onClose }) {
  const [xmlContent, setXmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("advice"); // "advice" or "xml"
  const [cheque, setCheque] = useState(null);

  useEffect(() => {
    async function fetchAdvice() {
      try {
        const [chequeRes, xmlRes] = await Promise.all([
          client.get(`/cheques/${chequeId}`),
          client.get(`/settlements/ekuber/${chequeId}/pacs009`),
        ]);
        setCheque(chequeRes.data);
        setXmlContent(xmlRes.data);
      } catch (err) {
        console.error("Failed to load e-Kuber advice:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdvice();
  }, [chequeId]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleCopy() {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pacs.009-ekuber-${cheque?.ekuberUtr || chequeId}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Reserve Bank of India - e-Kuber Settlement Advice</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  T+0 ON-REALISATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                ISO 20022 pacs.009.001.08 · RTGS Interbank Financial Institution Credit Transfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50 text-xs">
          <button
            onClick={() => setActiveTab("advice")}
            className={`py-3 px-4 font-bold border-b-2 transition-colors cursor-pointer ${activeTab === "advice"
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            Settlement Advice
          </button>
          <button
            onClick={() => setActiveTab("xml")}
            className={`py-3 px-4 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === "xml"
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            ISO 20022 pacs.009 XML
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-xs text-gray-500">
              Loading Central Bank e-Kuber Settlement Digest...
            </div>
          ) : activeTab === "advice" ? (
            /* Formal Certificate View */
            <div className="border border-slate-300 p-6 rounded-xl bg-slate-50/50 space-y-5">
              {/* Insignia Header */}
              <div className="text-center border-b border-gray-200 pb-4 space-y-1">
                <h4 className="font-extrabold text-sm uppercase tracking-widest text-gray-900">
                  RESERVE BANK OF INDIA
                </h4>
                <p className="text-[11px] font-semibold text-gray-600">
                  CENTRAL BANKING SYSTEM - e-KUBER REAL-TIME SETTLEMENT
                </p>
                <p className="text-[10px] font-mono text-gray-500">
                  NATIONAL CLEARING GRID · CONTINUOUS CLEARING ON-REALISATION DISPATCH
                </p>
              </div>

              {/* Reference Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono bg-white p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-500 block">Central Bank UTR</span>
                  <span className="font-bold text-brand-800 break-all">
                    {cheque?.ekuberUtr || "RBIR520260906001"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">e-Kuber Clearing Ref</span>
                  <span className="font-bold text-gray-800">
                    {cheque?.ekuberRef || "EKUBER/MISDESC3/SETTL"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Settlement Time</span>
                  <span className="font-bold text-gray-800">
                    {cheque?.settledAt ? new Date(cheque.settledAt).toLocaleTimeString() : "Instant (T+0)"}
                  </span>
                </div>
              </div>

              {/* Interbank Ledger Accounting Entries */}
              <div className="space-y-2 text-xs">
                <h5 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                  Central Bank Ledger Entries (e-Kuber Current Accounts)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Debtor Entry */}
                  <div className="bg-red-50/60 p-3 rounded-lg border border-red-200 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-red-700">DEBIT ENTRY (OUTFLOW)</span>
                      <span className="font-mono text-red-900 font-extrabold">- ₹{Number(cheque?.amount).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="font-semibold text-gray-800">{cheque?.draweeBank?.name}</div>
                    <div className="text-[10px] font-mono text-gray-500">
                      RBI CA: RBI-{cheque?.draweeBank?.code}-CA-SETTL · IFSC: {cheque?.draweeBank?.ifsc}
                    </div>
                  </div>

                  {/* Creditor Entry */}
                  <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-emerald-700">CREDIT ENTRY (INFLOW)</span>
                      <span className="font-mono text-emerald-900 font-extrabold">+ ₹{Number(cheque?.amount).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="font-semibold text-gray-800">{cheque?.presentingBank?.name}</div>
                    <div className="text-[10px] font-mono text-gray-500">
                      RBI CA: RBI-{cheque?.presentingBank?.code}-CA-SETTL · IFSC: {cheque?.presentingBank?.ifsc}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instrument & Beneficiary Dispatch Card */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-600 font-semibold">Underlying MISDESC Instrument:</span>
                  <span className="font-mono font-bold text-gray-900">
                    Cheque #{cheque?.chequeNumber} · A/C {cheque?.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-600 font-semibold">Beneficiary Payee:</span>
                  <span className="font-bold text-gray-900">{cheque?.payeeName}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-600 font-semibold">Beneficiary Customer Credit:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    DISPATCHED (T+0 FAST-PATH)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Raw ISO 20022 XML View */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">
                  ISO 20022 pacs.009.001.08 XML payload dispatched to e-Kuber
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 text-xs font-bold rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                  >
                    {copied ? "Copied" : "Copy XML"}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-2.5 py-1 text-xs font-bold rounded bg-brand-600 hover:bg-brand-700 text-white transition-colors cursor-pointer"
                  >
                    Download .xml
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-96 border border-slate-800">
                {xmlContent}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close Settlement Advice
          </button>
        </div>
      </div>
    </div>
  );
}
