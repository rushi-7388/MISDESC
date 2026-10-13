import React, { useState } from "react";
import VerificationPanel from "./VerificationPanel";
import RiskBadge from "./RiskBadge";
import AgentSwarmDocketModal from "./AgentSwarmDocketModal";
import ZkSolvencyProofModal from "./ZkSolvencyProofModal";
import SmartChequeEscrowModal from "./SmartChequeEscrowModal";
import CrossBorderClearingModal from "./CrossBorderClearingModal";

export default function DraweeVerificationCard({
  cheque,
  onInspect,
  onViewEKuber,
  onViewReturnMemo,
  onUpdated,
}) {
  const [showSwarmDocket, setShowSwarmDocket] = useState(false);
  const [showZkModal, setShowZkModal] = useState(false);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [showCrossBorderModal, setShowCrossBorderModal] = useState(false);
  const isHighRiskOrValue = Number(cheque.amount) >= 100000 || cheque.riskTier === "HIGH";



  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Card Header */}
      <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-gray-900 text-sm bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
            #{cheque.chequeNumber}
          </span>
          <span className="text-[11px] font-mono text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded">
            {cheque.batch?.sessionCode || "BATCH-OPEN"}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cheque.status === "PRESENTED"
                ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                : cheque.status === "VERIFIED"
                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                  : cheque.status === "AWAITING_CHECKER"
                    ? "bg-purple-50 text-purple-800 border border-purple-200 animate-pulse"
                    : cheque.status === "CLEARED"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
          >
            {cheque.status}
          </span>
        </div>

        <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
          <span className="font-semibold text-gray-700">{cheque.presentingBank?.name || "SURAT PEOPLES CO OP BANK"}</span>
          <span>→</span>
          <span className="text-gray-400 font-mono text-[10px]">{cheque.draweeBank?.ifsc || "HDFC0005678"}</span>
        </div>
      </div>

      {/* Scanned Cheque Instrument Banner */}
      <div
        onClick={() => onInspect(cheque)}
        className="relative h-32 bg-slate-900 overflow-hidden cursor-pointer group border-b border-gray-200"
        title="Click to inspect high-resolution cheque scan and security features"
      >
        <img
          src={cheque.imageUrl || (cheque.chequeNumber === "000102" ? "/cheque-000102.jpg" : cheque.chequeNumber === "000123" ? "/cheque-000123.jpg" : "/sample-cheque.jpg")}
          alt={`Cheque #${cheque.chequeNumber}`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 opacity-95 group-hover:opacity-100"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/sample-cheque.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
            MICR: {cheque.micrCode || "395024002"}
          </span>
          <span className="text-[10px] font-semibold text-white bg-brand-600/90 px-2 py-0.5 rounded backdrop-blur-xs group-hover:bg-brand-500 transition-colors">
            Inspect Instrument
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4 flex-1">
        {/* Payee & Amount */}
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Payee Name</div>
            <div className="text-sm font-bold text-gray-900 truncate max-w-[240px]" title={cheque.payeeName}>
              {cheque.payeeName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Instrument Amount</div>
            <div className="text-xl font-extrabold text-gray-900 font-mono tracking-tight">
              ₹{Number(cheque.amount).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* 3 Core Assessment Badges (Positive Pay, Signature, Risk) */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
          {/* 1. Positive Pay Status */}
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Positive Pay (PPS)</div>
            {cheque.ppsStatus === "PPS_VERIFIED" ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span>Confirmed</span>
              </span>
            ) : cheque.ppsStatus === "PPS_MISMATCH" ? (
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 cursor-help"
                title={JSON.stringify(cheque.ppsDiscrepancy || "Discrepancy detected")}
              >
                <span>Mismatch</span>
              </span>
            ) : Number(cheque.amount) >= 50000 ? (
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Unregistered
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">N/A (&lt;50K)</span>
            )}
          </div>

          {/* 2. Signature Biometrics */}
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Signature Match</div>
            {cheque.signatureMatchScore ? (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cheque.signatureStatus === "SUSPECT_MISMATCH" || cheque.signatureMatchScore < 80
                    ? "text-rose-700 bg-rose-50 border-rose-200"
                    : "text-blue-700 bg-blue-50 border-blue-200"
                  }`}
              >
                {cheque.signatureMatchScore}% Match
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">Standard</span>
            )}
          </div>

          {/* 3. Risk Evaluation */}
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Risk Score</div>
            <RiskBadge
              tier={cheque.riskTier || "LOW"}
              score={cheque.riskScore || 0}
              factors={cheque.riskFactors}
            />
          </div>
        </div>

        {/* e-Kuber UTR notification banner if settled */}
        {cheque.ekuberUtr && (
          <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-blue-900 font-mono text-[11px] font-semibold">
              <span>e-Kuber UTR:</span>
              <span>{cheque.ekuberUtr}</span>
            </div>
            <button
              type="button"
              onClick={() => onViewEKuber(cheque.id)}
              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
            >
              View Advice
            </button>
          </div>
        )}
      </div>

      {/* Card Action Deck */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Inspector Trigger */}
          <button
            type="button"
            onClick={() => onInspect(cheque)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold border border-gray-200 shadow-2xs transition-colors cursor-pointer"
            title="Inspect scan and signature comparison"
          >
            <span>Inspect Instrument</span>
          </button>

          {/* Autonomous AI Swarm Trigger */}
          <button
            type="button"
            onClick={() => setShowSwarmDocket(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-900 to-slate-900 hover:from-indigo-800 hover:to-slate-800 text-indigo-200 text-xs font-bold border border-indigo-700/60 shadow-xs transition-all cursor-pointer"
            title="Launch 4-Agent Autonomous Swarm Adjudication Docket"
          >
            <span>🤖 Swarm</span>
          </button>

          {/* Option 1: zk-SNARK Solvency Proof */}
          <button
            type="button"
            onClick={() => setShowZkModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-300 text-xs font-bold border border-teal-800 shadow-xs transition-all cursor-pointer"
            title="Zero-Knowledge Confidential Solvency Proof (Groth16)"
          >
            <span>🔐 zk-Proof</span>
          </button>

          {/* Option 2: Smart Cheque Escrow & CBDC */}
          <button
            type="button"
            onClick={() => setShowSmartModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 text-xs font-bold border border-amber-800 shadow-xs transition-all cursor-pointer"
            title="Programmable Smart Escrow & CBDC e-Rupee Bridge"
          >
            <span>⚡ Smart Cheque</span>
          </button>

          {/* Option 3: Cross-Border FX & Sanctions */}
          <button
            type="button"
            onClick={() => setShowCrossBorderModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-bold border border-cyan-800 shadow-xs transition-all cursor-pointer"
            title="Cross-Border FX Hedging & Sanctions Radar"
          >
            <span>🌐 FX</span>
          </button>

          {/* Statutory tools if already final */}
          {cheque.status === "RETURNED" && (
            <button
              type="button"
              onClick={() => onViewReturnMemo(cheque.id)}
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <span>Return Memo (Sec 138)</span>
            </button>
          )}
        </div>

        {/* The 3 Direct Verification Options (Verify, Clear, Return) */}
        {["PRESENTED", "VERIFIED", "AWAITING_CHECKER"].includes(cheque.status) && (
          <div className="pt-2 border-t border-gray-200/60">
            <VerificationPanel cheque={cheque} onUpdated={onUpdated} layout="full" />
          </div>
        )}
      </div>

      {showSwarmDocket && (
        <AgentSwarmDocketModal
          cheque={cheque}
          onClose={() => setShowSwarmDocket(false)}
          onActionSuccess={() => {
            if (onUpdated) onUpdated();
          }}
        />
      )}

      {showZkModal && (
        <ZkSolvencyProofModal
          cheque={cheque}
          onClose={() => setShowZkModal(false)}
        />
      )}

      {showSmartModal && (
        <SmartChequeEscrowModal
          cheque={cheque}
          onClose={() => setShowSmartModal(false)}
        />
      )}

      {showCrossBorderModal && (
        <CrossBorderClearingModal
          cheque={cheque}
          onClose={() => setShowCrossBorderModal(false)}
        />
      )}
    </div>
  );
}


