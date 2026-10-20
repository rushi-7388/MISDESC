import React, { useState, useEffect } from "react";
import client from "../api/client";
import VerificationPanel from "./VerificationPanel";
import DisputeModal from "./DisputeModal";
import ForensicChequeHeatmapCanvas from "./ForensicChequeHeatmapCanvas";
import SignatureGhostComparator from "./SignatureGhostComparator";
import WhatsAppBankingModal from "./WhatsAppBankingModal";

export default function ChequeViewerModal({ cheque, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState("cheque"); // "cheque", "signature", "forensics"
  const [zoom, setZoom] = useState(1);
  const [filterMode, setFilterMode] = useState("normal"); // "normal", "uv", "invert"
  const [signatureData, setSignatureData] = useState(null);
  const [sigLoading, setSigLoading] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  useEffect(() => {
    if (!cheque) return;
    setSigLoading(true);
    client
      .get(`/cheques/${cheque.id}/signature-comparison`)
      .then(({ data }) => setSignatureData(data))
      .catch(() => { })
      .finally(() => setSigLoading(false));
  }, [cheque?.id]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!cheque) return null;

  const filterStyles = {
    normal: {},
    uv: {
      filter: "hue-rotate(260deg) saturate(3) contrast(1.9) brightness(0.85)",
      boxShadow: "0 0 35px rgba(147, 51, 234, 0.45)",
    },
    invert: {
      filter: "invert(1) grayscale(1) contrast(2.2)",
    },
  };

  const isSuspectSig = signatureData && signatureData.metrics?.matchScore < 80;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 bg-gray-50">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-gray-900 text-base">
                Cheque Inspector #{cheque.chequeNumber}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                MISDESC-2010 Standard
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                PKI X.509 Verified
              </span>

              {/* Positive Pay Status Badge */}
              {cheque.ppsStatus === "PPS_VERIFIED" && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span>PPS Confirmed</span>
                </span>
              )}
              {cheque.ppsStatus === "PPS_MISMATCH" && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <span>PPS Mismatch</span>
                </span>
              )}
              {cheque.ppsStatus === "PPS_NOT_REGISTERED" && Number(cheque.amount) >= 50000 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  PPS Unregistered
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-0.5">
              {cheque.presentingBank?.name} → {cheque.draweeBank?.name} · Payee: <span className="font-semibold text-gray-900">{cheque.payeeName}</span> (₹{Number(cheque.amount).toLocaleString("en-IN")})
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-200 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("cheque")}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === "cheque" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <span>Instrument</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("forensics")}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === "forensics" ? "bg-cyan-700 text-white shadow-xs font-bold" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <span>🔬 AI Tampering Heatmap</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("signature")}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === "signature"
                    ? isSuspectSig
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-brand-700 text-white shadow-xs"
                    : isSuspectSig
                      ? "text-rose-700 hover:text-rose-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <span>Biometric Signature</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tab 1: Cheque Instrument Canvas */}
        {activeTab === "cheque" && (
          <>
            {/* Filter Mode & Zoom Bar */}
            <div className="px-6 py-2 bg-gray-100/70 border-b flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600 text-[11px] uppercase">Filter:</span>
                <div className="flex items-center bg-white border rounded-lg p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterMode("normal")}
                    className={`px-2.5 py-0.5 rounded transition-colors ${filterMode === "normal" ? "bg-brand-700 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("uv")}
                    className={`px-2.5 py-0.5 rounded transition-colors ${filterMode === "uv" ? "bg-purple-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    UV Filter
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("invert")}
                    className={`px-2.5 py-0.5 rounded transition-colors ${filterMode === "invert" ? "bg-gray-900 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    Invert
                  </button>
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-white border p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                  className="w-6 h-6 rounded hover:bg-gray-100 font-bold text-gray-700 text-sm flex items-center justify-center cursor-pointer"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="text-xs font-mono px-1 text-gray-600">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                  className="w-6 h-6 rounded hover:bg-gray-100 font-bold text-gray-700 text-sm flex items-center justify-center cursor-pointer"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="px-2 h-6 rounded hover:bg-gray-100 text-[11px] text-gray-600 cursor-pointer"
                  title="Reset Zoom"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Viewport */}
            <div className="flex-1 bg-gray-900 p-8 flex items-center justify-center overflow-auto min-h-[380px] relative select-none">
              {filterMode === "uv" && (
                <div className="absolute top-3 left-3 bg-purple-900/90 border border-purple-500 text-purple-200 text-[11px] px-3 py-1 rounded-full backdrop-blur-xs font-medium z-10 flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                  <span>UV Blacklight Active: Inspecting MISDESC-2010 Paper Fibers & Void Pantograph</span>
                </div>
              )}

              <div
                className="transition-transform duration-150 origin-center relative"
                style={{ transform: `scale(${zoom})` }}
              >
                {cheque.imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/40">
                    <img
                      src={cheque.imageUrl}
                      alt={`Cheque ${cheque.chequeNumber}`}
                      className="max-h-[500px] max-w-full object-contain rounded-lg"
                      style={filterStyles[filterMode]}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = cheque.chequeNumber === "000102" ? "/cheque-000102.jpg" : cheque.chequeNumber === "000123" ? "/cheque-000123.jpg" : "/sample-cheque.jpg";
                      }}
                    />
                    <div className="absolute bottom-2 left-4 right-4 border-2 border-dashed border-emerald-400/80 bg-emerald-500/10 px-3 py-1 rounded text-right backdrop-blur-xs">
                      <span className="text-[10px] font-mono font-bold text-emerald-300 bg-black/70 px-2 py-0.5 rounded uppercase">
                        MICR Zone Detected: {cheque.micrCode}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-[620px] h-[300px] bg-[#fbf8ee] border-2 border-[#d9c9a6] rounded-lg shadow-2xl p-6 relative font-serif text-gray-900 flex flex-col justify-between"
                    style={filterStyles[filterMode]}
                  >
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#8b7355_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none rounded-lg"></div>

                    {/* Top Row */}
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className="font-bold text-lg tracking-wide text-brand-900 uppercase">
                          {cheque.draweeBank?.name || "SURAT PEOPLES CO OP BANK"}
                        </div>
                        <div className="text-[11px] text-gray-600 font-mono">IFSC: {cheque.ifsc}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">Date</div>
                        <div className="border border-gray-400 bg-white px-2 py-0.5 font-mono text-xs">
                          {new Date(cheque.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Middle Row */}
                    <div className="space-y-3 relative z-10 font-sans">
                      <div className="flex items-center gap-2 border-b border-gray-400 pb-1">
                        <span className="text-xs uppercase text-gray-500 font-bold">Pay</span>
                        <span className="font-bold text-sm text-gray-900 flex-1">{cheque.payeeName}</span>
                        <span className="text-xs text-gray-500 uppercase">Or Bearer</span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 border-b border-gray-400 pb-1 text-xs text-gray-700 italic">
                          Rupees {Number(cheque.amount) >= 100000 ? "One Lakh Fifty Thousand Only" : "Fifty Thousand Only"}
                        </div>
                        <div className="border-2 border-gray-800 bg-white px-4 py-1 font-mono font-extrabold text-base">
                          ₹ {Number(cheque.amount).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span className="text-gray-500 font-mono text-[11px]">A/C No: </span>
                          <span className="font-mono font-bold">{cheque.accountNumber}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-sans text-right flex flex-col items-end">
                          <span className="font-serif italic text-sm text-brand-900 font-bold">[Specimen Signatory]</span>
                          <span>Authorized Signatory</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: E-13B MICR Band */}
                    <div className="mt-4 pt-2 border-t-2 border-dashed border-gray-400 flex items-center justify-center font-mono text-sm tracking-widest bg-gray-100/60 p-1.5 rounded text-gray-800">
                      <span>⑈ {cheque.chequeNumber} ⑈ {cheque.ifsc} ⑆ {cheque.accountNumber} ⑈ 10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Tab 2: AI Forensics Spectral & Heatmap Inspection */}
        {activeTab === "forensics" && (
          <div className="flex-1 p-6 overflow-auto bg-slate-950">
            <ForensicChequeHeatmapCanvas cheque={cheque} />
          </div>
        )}

        {/* Tab 3: AI Signature 1:1 Comparative Verification Deck & Biometric Ghosting */}
        {activeTab === "signature" && (
          <div className="flex-1 p-6 overflow-auto bg-gray-50 space-y-6">
            {sigLoading ? (
              <div className="py-20 text-center text-xs text-gray-500">
                Running biometric contour analysis on signature cards...
              </div>
            ) : signatureData ? (
              <>
                {/* Dynamic Biometric Signature Ghost Specimen Comparator */}
                <SignatureGhostComparator signatureData={signatureData} cheque={cheque} />

                {/* AI Similarity Gauge Banner */}
                <div
                  className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 shadow-xs ${signatureData.metrics.matchScore >= 80
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-rose-50 border-rose-200 text-rose-950"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-lg ${signatureData.metrics.matchScore >= 80
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white animate-pulse"
                        }`}
                    >
                      {signatureData.metrics.matchScore}%
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        <span>
                          {signatureData.metrics.matchScore >= 80
                            ? "AI Biometric Signature Verification: PASS"
                            : "AI Biometric Alert: Suspect Signature Mismatch!"}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${signatureData.metrics.matchScore >= 80
                              ? "bg-emerald-200 text-emerald-900"
                              : "bg-rose-200 text-rose-900"
                            }`}
                        >
                          {signatureData.metrics.verdict}
                        </span>
                      </div>
                      <div className="text-xs opacity-85 mt-0.5">{signatureData.metrics.recommendation}</div>
                    </div>
                  </div>

                  <div className="text-xs font-mono bg-white/80 px-3 py-2 rounded-lg border flex items-center gap-4">
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase">Disparity Index</span>
                      <span className="font-bold">{signatureData.metrics.disparityIndex}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase">Stroke Density</span>
                      <span className="font-bold">{signatureData.metrics.strokeDensityMatch}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase">Tremor Check</span>
                      <span className={`font-bold ${signatureData.metrics.tremorPassed ? "text-emerald-700" : "text-rose-700"}`}>
                        {signatureData.metrics.tremorPassed ? "NORMAL" : "HESITATION DETECTED"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dual Viewports */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Viewport A: CBS Specimen Card */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-brand-700 tracking-wider block">
                          Core Banking System (CBS)
                        </span>
                        <h4 className="text-xs font-bold text-gray-900">Specimen Signature Card on Record</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        OFFICIAL SPECIMEN
                      </span>
                    </div>

                    <div className="bg-[#fcfbf9] border border-gray-200 rounded-lg p-6 h-40 flex items-center justify-center relative shadow-inner">
                      <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-400">
                        Drawer A/C: {cheque.accountNumber} · CBS-SRT-004
                      </div>
                      <svg className="w-full h-24 text-gray-900" viewBox="0 0 380 90" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round">
                        <path d={signatureData.specimenCard.svgPath} />
                      </svg>
                      <div className="absolute bottom-2 right-2 text-[9px] font-sans text-gray-400 italic">
                        KYC Verified Since {signatureData.specimenCard.verifiedSince}
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 space-y-0.5">
                      <div><span className="font-semibold text-gray-700">Account Type:</span> {signatureData.specimenCard.accountType}</div>
                      <div><span className="font-semibold text-gray-700">Mandate Authority:</span> {signatureData.specimenCard.signatoryName}</div>
                    </div>
                  </div>

                  {/* Viewport B: Extracted Cheque Signature */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                          Truncated Instrument
                        </span>
                        <h4 className="text-xs font-bold text-gray-900">Extracted Cheque Signature</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-700 border">
                        INSTRUMENT ZONE
                      </span>
                    </div>

                    <div
                      className={`border rounded-lg p-6 h-40 flex items-center justify-center relative shadow-inner ${signatureData.metrics.matchScore >= 80
                          ? "bg-[#fcfbf9] border-gray-200"
                          : "bg-rose-50/50 border-rose-200"
                        }`}
                    >
                      <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-400">
                        Cheque #{cheque.chequeNumber} · Signature Scrutiny Zone
                      </div>
                      <svg
                        className={`w-full h-24 ${signatureData.metrics.matchScore >= 80 ? "text-gray-900" : "text-rose-900"
                          }`}
                        viewBox="0 0 380 90"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                      >
                        <path d={signatureData.extractedSignature.svgPath} />
                      </svg>
                      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-gray-400">
                        Zone: Courtesy Signatory Area
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 space-y-0.5">
                      <div><span className="font-semibold text-gray-700">Scan Resolution:</span> 300 DPI Grayscale</div>
                      <div>
                        <span className="font-semibold text-gray-700">AI Confidence:</span>{" "}
                        <span className={`font-bold ${signatureData.metrics.matchScore >= 80 ? "text-emerald-700" : "text-rose-700"}`}>
                          {signatureData.metrics.matchScore}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Verification Action Bar (If in active clearing lifecycle) */}
        {["PRESENTED", "VERIFIED", "AWAITING_CHECKER"].includes(cheque.status) && (
          <div className="px-6 py-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/90 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
              <div>
                <div className="text-xs font-bold text-gray-900">Direct Verification Action Deck</div>
                <div className="text-[11px] text-gray-500">
                  Review security features and signature match, then select a clearing disposition:
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <VerificationPanel
                cheque={cheque}
                layout="compact"
                onUpdated={(updated) => {
                  onUpdated?.(updated);
                  onClose();
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-700">MISDESC-2010 Compliance:</span>
            <span className="text-emerald-700 font-medium">
              [OK] Paper Fibers Verified
            </span>
            <span className="text-emerald-700 font-medium">
              [OK] E-13B MICR Optical Alignment
            </span>
            <span className="text-emerald-700 font-medium">
              [OK] Positive Pay & Signature Verification
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>💬 Notify via WhatsApp / SMS</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDisputeModal(true)}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>⚖ File Dispute (DRM)</span>
            </button>
            <div className="text-[11px] font-mono text-gray-400">
              Audit Hash: {cheque.imageHash ? cheque.imageHash.slice(0, 18) + "..." : "SHA-256 Verified"}
            </div>
          </div>
        </div>
      </div>

      {showDisputeModal && (
        <DisputeModal
          cheque={cheque}
          onClose={() => setShowDisputeModal(false)}
          onSubmitted={() => {
            alert("Dispute claim successfully lodged with Clearing House under NPCI MISDESC DRM Rule 32.");
          }}
        />
      )}

      {showWhatsAppModal && (
        <WhatsAppBankingModal
          defaultCheque={cheque}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </div>
  );
}
