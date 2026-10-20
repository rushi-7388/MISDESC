import React, { useState } from "react";
import RiskBadge from "./RiskBadge";
import ChequeViewerModal from "./ChequeViewerModal";
import ClearanceCertificateModal from "./ClearanceCertificateModal";
import StatutoryReturnMemoModal from "./StatutoryReturnMemoModal";
import EKuberAdviceModal from "./EKuberAdviceModal";
import ISO20022Modal from "./ISO20022Modal";
import WhatsAppBankingModal from "./WhatsAppBankingModal";
import { useClearingEvents } from "../hooks/useClearingEvents";

const STATUS_STYLES = {
  PRESENTED: "bg-yellow-950/80 text-yellow-300 border border-yellow-700/80",
  VERIFIED: "bg-blue-950/80 text-blue-300 border border-blue-700/80",
  AWAITING_CHECKER: "bg-purple-950/80 text-purple-300 border border-purple-700/80",
  CLEARED: "bg-emerald-950/80 text-emerald-300 border border-emerald-700/80",
  RETURNED: "bg-rose-950/80 text-rose-300 border border-rose-700/80",
};

export default function ClearingStatusTable({ cheques, renderActions, onUpdated }) {
  const [viewerCheque, setViewerCheque] = useState(null);
  const [certificateCheque, setCertificateCheque] = useState(null);
  const [returnMemoChequeId, setReturnMemoChequeId] = useState(null);
  const [ekuberChequeId, setEkuberChequeId] = useState(null);
  const [isoChequeId, setIsoChequeId] = useState(null);
  const [whatsAppCheque, setWhatsAppCheque] = useState(null);

  // Real-Time SSE listener for automatic table synchronization
  useClearingEvents((event) => {
    if (
      event.type === "CLEARED" ||
      event.type === "RETURNED" ||
      event.type === "PRESENTED" ||
      event.type === "HOURLY_BATCH_SETTLED"
    ) {
      onUpdated?.();
    }
  });

  if (!cheques?.length) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center shadow-lg space-y-2">
        <h3 className="text-sm font-semibold text-slate-200">No Instruments in Clearing</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No cheques match the current filter or session. Present a new cheque or switch sessions to view active records.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-slate-900 rounded-2xl shadow-xl border border-slate-800 relative">
      <table className="min-w-full text-xs divide-y divide-slate-800">
        <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] font-bold border-b border-slate-800">
          <tr>
            <th className="text-left px-4 py-3.5 min-w-[200px] whitespace-nowrap">Cheque Instrument</th>
            <th className="text-left px-4 py-3.5 min-w-[180px] whitespace-nowrap">Presenting / Drawee</th>
            <th className="text-left px-4 py-3.5 min-w-[160px] whitespace-nowrap">Payee</th>
            <th className="text-right px-4 py-3.5 min-w-[120px] whitespace-nowrap">Amount</th>
            <th className="text-center px-4 py-3.5 min-w-[140px] whitespace-nowrap">Positive Pay (PPS)</th>
            <th className="text-center px-4 py-3.5 min-w-[140px] whitespace-nowrap">Risk Assessment</th>
            <th className="text-left px-4 py-3.5 min-w-[150px] whitespace-nowrap">Status / Clearing</th>
            <th className="text-left px-4 py-3.5 min-w-[180px] whitespace-nowrap">Statutory Audit Tools</th>
            {renderActions && (
              <th className="sticky right-0 bg-slate-950/98 backdrop-blur-md px-4 py-3.5 text-center font-bold text-slate-200 border-l border-slate-800 shadow-xl z-20 min-w-[240px] whitespace-nowrap">
                Verification Action
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 text-slate-200">
          {cheques.map((c) => (
            <tr key={c.id} className="hover:bg-slate-800/50 group transition-colors">
              <td className="px-4 py-3.5 font-mono text-slate-200 min-w-[200px]">
                <div className="flex items-center gap-3">
                  {/* Scanned Cheque Instrument Thumbnail */}
                  <div
                    onClick={() => setViewerCheque(c)}
                    className="relative w-16 h-10 rounded-md border border-slate-700 overflow-hidden bg-slate-950 shrink-0 cursor-pointer group shadow-sm hover:border-cyan-500 hover:ring-2 hover:ring-cyan-500/30 transition-all"
                    title="Click to inspect full cheque image"
                  >
                    <img
                      src={c.imageUrl || (c.chequeNumber === "000102" ? "/cheque-000102.jpg" : c.chequeNumber === "000123" ? "/cheque-000123.jpg" : "/sample-cheque.jpg")}
                      alt={`Cheque #${c.chequeNumber}`}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/sample-cheque.jpg";
                      }}
                    />
                  </div>

                  {/* Cheque Details & Inspector Trigger */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{c.chequeNumber}</span>
                      <button
                        type="button"
                        onClick={() => setViewerCheque(c)}
                        title="Open Cheque Inspector"
                        className="px-1.5 py-0.5 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 font-sans text-[10px] font-bold border border-purple-800 transition-all cursor-pointer whitespace-nowrap"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setWhatsAppCheque(c)}
                        title="Dispatch WhatsApp / SMS customer notification"
                        className="px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-sans text-[10px] font-bold border border-emerald-800 transition-all cursor-pointer whitespace-nowrap"
                      >
                        💬 Notify
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {c.batch?.sessionCode || "Session Unassigned"}
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3.5 min-w-[180px]">
                <div className="font-bold text-slate-100 text-xs">{c.presentingBank?.name || "SURAT PEOPLES CO OP BANK"}</div>
                <div className="text-xs text-slate-400 mt-0.5">→ {c.draweeBank?.name || "HDFC BANK"}</div>
              </td>

              <td className="px-4 py-3.5 font-semibold text-slate-200 text-xs min-w-[160px]">
                {c.payeeName || "Mandate Beneficiary"}
              </td>

              <td className="px-4 py-3.5 text-right font-mono font-bold text-cyan-400 text-sm whitespace-nowrap min-w-[120px]">
                ₹{Number(c.amount || 0).toLocaleString("en-IN")}
              </td>

              {/* Positive Pay System (PPS) Status Column */}
              <td className="px-4 py-3.5 text-center whitespace-nowrap min-w-[140px]">
                {c.ppsStatus === "PPS_VERIFIED" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>VERIFIED</span>
                  </span>
                ) : c.ppsStatus === "PPS_MISMATCH" ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-700 cursor-help"
                    title={JSON.stringify(c.ppsDiscrepancy || "Discrepancy Detected")}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    <span>MISMATCH</span>
                  </span>
                ) : Number(c.amount || 0) >= 50000 ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800"
                    title="Drawer confirmation not logged on Positive Pay System"
                  >
                    UNREGISTERED
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">N/A (&lt;50K)</span>
                )}
              </td>

              {/* Dynamic Risk Tier Assessment Badge */}
              <td className="px-4 py-3.5 text-center min-w-[140px]">
                <div className="flex flex-col items-center gap-1">
                  <RiskBadge
                    tier={c.riskTier || "LOW"}
                    score={c.riskScore || 0}
                    factors={c.riskFactors}
                  />
                  {c.signatureMatchScore && (
                    <span
                      className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                        c.signatureStatus === "SUSPECT_MISMATCH"
                          ? "bg-rose-950 text-rose-300 font-bold border border-rose-800"
                          : "bg-blue-950 text-blue-300 border border-blue-800"
                      }`}
                      title={`Specimen Signature Contour Match Score: ${c.signatureMatchScore}%`}
                    >
                      Sig: {c.signatureMatchScore}%
                    </span>
                  )}
                </div>
              </td>

              <td className="px-4 py-3.5 min-w-[150px]">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                    STATUS_STYLES[c.status] || "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {c.status}
                </span>

                {c.ekuberUtr && (
                  <span
                    className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[9px] font-mono font-bold block mt-1 border border-blue-800 cursor-pointer hover:bg-blue-900 whitespace-nowrap"
                    onClick={() => setEkuberChequeId(c.id)}
                    title={`RBI e-Kuber Settled UTR: ${c.ekuberUtr}`}
                  >
                    UTR: {c.ekuberUtr.slice(0, 14)}...
                  </span>
                )}

                {c.fraudFlags && c.fraudFlags.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1 max-w-fit">
                    {c.fraudFlags.map((f) => (
                      <span
                        key={f.id}
                        title={f.details}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-950 text-orange-300 border border-orange-800 cursor-help whitespace-nowrap"
                      >
                        <span>{f.type.replace(/_/g, " ")}</span>
                      </span>
                    ))}
                  </div>
                )}
              </td>

              <td className="px-4 py-3.5 min-w-[180px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {c.status === "CLEARED" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCertificateCheque(c)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold border border-emerald-800 text-xs transition-all cursor-pointer shadow-sm whitespace-nowrap"
                      >
                        <span>Certificate</span>
                      </button>

                      {c.ekuberUtr && (
                        <button
                          type="button"
                          onClick={() => setEkuberChequeId(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-bold border border-cyan-800 text-xs transition-all cursor-pointer shadow-sm whitespace-nowrap"
                          title="View official RBI e-Kuber Settlement Advice & pacs.009 XML"
                        >
                          <span>e-Kuber</span>
                        </button>
                      )}
                    </>
                  )}

                  {c.status === "RETURNED" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setReturnMemoChequeId(c.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold border border-rose-800 text-xs transition-all cursor-pointer shadow-sm whitespace-nowrap"
                        title="Statutory Return Memo under Section 138 Negotiable Instruments Act"
                      >
                        <span>Return Memo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsoChequeId(c.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold border border-slate-700 text-xs transition-all cursor-pointer whitespace-nowrap shadow-sm"
                        title="pacs.002 XML export"
                      >
                        pacs.002
                      </button>
                    </>
                  )}

                  {c.status !== "CLEARED" && c.status !== "RETURNED" && (
                    <span className="text-slate-400 text-xs font-mono font-medium">In Clearing</span>
                  )}
                </div>
              </td>
              {renderActions && (
                <td className="sticky right-0 bg-slate-900/95 group-hover:bg-slate-850 backdrop-blur-md px-5 py-4 border-l border-slate-800 shadow-xl z-10 transition-colors min-w-[260px]">
                  {renderActions(c)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Interactive Modals */}
      {viewerCheque && (
        <ChequeViewerModal
          cheque={viewerCheque}
          onClose={() => setViewerCheque(null)}
          onUpdated={(updated) => {
            onUpdated?.(updated);
            setViewerCheque(null);
          }}
        />
      )}

      {certificateCheque && (
        <ClearanceCertificateModal
          cheque={certificateCheque}
          onClose={() => setCertificateCheque(null)}
        />
      )}

      {returnMemoChequeId && (
        <StatutoryReturnMemoModal
          chequeId={returnMemoChequeId}
          onClose={() => setReturnMemoChequeId(null)}
        />
      )}

      {ekuberChequeId && (
        <EKuberAdviceModal
          chequeId={ekuberChequeId}
          onClose={() => setEkuberChequeId(null)}
        />
      )}

      {isoChequeId && (
        <ISO20022Modal chequeId={isoChequeId} onClose={() => setIsoChequeId(null)} />
      )}

      {whatsAppCheque && (
        <WhatsAppBankingModal
          defaultCheque={whatsAppCheque}
          onClose={() => setWhatsAppCheque(null)}
        />
      )}
    </div>
  );
}
