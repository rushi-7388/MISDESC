import React, { useState } from "react";
import VerificationPanel from "./VerificationPanel";
import RiskBadge from "./RiskBadge";
import AgentSwarmDocketModal from "./AgentSwarmDocketModal";
import ZkSolvencyProofModal from "./ZkSolvencyProofModal";
import SmartChequeEscrowModal from "./SmartChequeEscrowModal";
import CrossBorderClearingModal from "./CrossBorderClearingModal";
import ForensicIntelligenceSuiteModal from "./ForensicIntelligenceSuiteModal";

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
  const [showForensicModal, setShowForensicModal] = useState(false);
  const isHighRiskOrValue = Number(cheque.amount) >= 100000 || cheque.riskTier === "HIGH";

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg hover:border-slate-700 transition-all duration-200 overflow-hidden flex flex-col justify-between text-slate-100">
      {/* Card Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white text-sm bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 shadow-sm">
            #{cheque.chequeNumber}
          </span>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {cheque.batch?.sessionCode || "BATCH-OPEN"}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              cheque.status === "PRESENTED"
                ? "bg-yellow-950/80 text-yellow-300 border border-yellow-700/80"
                : cheque.status === "VERIFIED"
                ? "bg-blue-950/80 text-blue-300 border border-blue-700/80"
                : cheque.status === "AWAITING_CHECKER"
                ? "bg-purple-950/80 text-purple-300 border border-purple-700/80 animate-pulse"
                : cheque.status === "CLEARED"
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/80"
                : "bg-rose-950/80 text-rose-300 border border-rose-700/80"
            }`}
          >
            {cheque.status}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="font-semibold text-slate-200">{cheque.presentingBank?.name || "SURAT PEOPLES CO OP BANK"}</span>
          <span className="text-slate-500">→</span>
          <span className="text-slate-400 font-mono text-[10px]">{cheque.draweeBank?.ifsc || "HDFC0005678"}</span>
        </div>
      </div>

      {/* Scanned Cheque Instrument Banner */}
      <div
        onClick={() => onInspect(cheque)}
        className="relative h-32 bg-slate-950 overflow-hidden cursor-pointer group border-b border-slate-800"
        title="Click to inspect high-resolution cheque scan and security features"
      >
        <img
          src={cheque.imageUrl || (cheque.chequeNumber === "000102" ? "/cheque-000102.jpg" : cheque.chequeNumber === "000123" ? "/cheque-000123.jpg" : "/sample-cheque.jpg")}
          alt={`Cheque #${cheque.chequeNumber}`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/sample-cheque.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] font-mono font-bold text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700 backdrop-blur-xs">
            MICR: {cheque.micrCode || "395024002"}
          </span>
          <span className="text-[10px] font-semibold text-white bg-cyan-700/90 px-2 py-0.5 rounded backdrop-blur-xs group-hover:bg-cyan-600 transition-colors">
            Inspect Instrument
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4 flex-1 bg-slate-900">
        {/* Payee & Amount */}
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Payee Name</div>
            <div className="text-sm font-bold text-white truncate max-w-[240px]" title={cheque.payeeName}>
              {cheque.payeeName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Instrument Amount</div>
            <div className="text-xl font-extrabold text-cyan-400 font-mono tracking-tight">
              ₹{Number(cheque.amount).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* 3 Core Assessment Badges (Positive Pay, Signature, Risk) */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
          {/* 1. Positive Pay Status */}
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Positive Pay (PPS)</div>
            {cheque.ppsStatus === "PPS_VERIFIED" ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                <span>Confirmed</span>
              </span>
            ) : cheque.ppsStatus === "PPS_MISMATCH" ? (
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-rose-300 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-800 cursor-help"
                title={JSON.stringify(cheque.ppsDiscrepancy || "Discrepancy detected")}
              >
                <span>Mismatch</span>
              </span>
            ) : Number(cheque.amount) >= 50000 ? (
              <span className="text-[10px] font-medium text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                Unregistered
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">N/A (&lt;50K)</span>
            )}
          </div>

          {/* 2. Signature Biometrics */}
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Signature Match</div>
            {cheque.signatureMatchScore ? (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  cheque.signatureStatus === "SUSPECT_MISMATCH" || cheque.signatureMatchScore < 80
                    ? "text-rose-300 bg-rose-950 border-rose-800"
                    : "text-blue-300 bg-blue-950 border-blue-800"
                }`}
              >
                {cheque.signatureMatchScore}% Match
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">Standard</span>
            )}
          </div>

          {/* 3. Risk Evaluation */}
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
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
          <div className="p-2.5 rounded-xl bg-blue-950/70 border border-blue-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-blue-300 font-mono text-[11px] font-semibold">
              <span>e-Kuber UTR:</span>
              <span>{cheque.ekuberUtr}</span>
            </div>
            <button
              type="button"
              onClick={() => onViewEKuber(cheque.id)}
              className="px-2 py-0.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
            >
              View Advice
            </button>
          </div>
        )}
      </div>

      {/* Card Action Deck */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Inspector Trigger */}
          <button
            type="button"
            onClick={() => onInspect(cheque)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-sm transition-colors cursor-pointer"
            title="Inspect scan and signature comparison"
          >
            <span>Inspect</span>
          </button>

          {/* Autonomous AI Swarm Trigger */}
          <button
            type="button"
            onClick={() => setShowSwarmDocket(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 text-xs font-bold border border-indigo-700/60 shadow-sm transition-all cursor-pointer"
            title="Launch 4-Agent Autonomous Swarm Adjudication Docket"
          >
            <span>🤖 Swarm</span>
          </button>

          {/* Option 1: zk-SNARK Solvency Proof */}
          <button
            type="button"
            onClick={() => setShowZkModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-300 text-xs font-bold border border-teal-800 shadow-sm transition-all cursor-pointer"
            title="Zero-Knowledge Confidential Solvency Proof (Groth16)"
          >
            <span>🔐 zk-Proof</span>
          </button>

          {/* Option 2: Smart Cheque Escrow & CBDC */}
          <button
            type="button"
            onClick={() => setShowSmartModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 text-xs font-bold border border-amber-800 shadow-sm transition-all cursor-pointer"
            title="Programmable Smart Escrow & CBDC e-Rupee Bridge"
          >
            <span>⚡ Smart</span>
          </button>

          {/* Option 3: Cross-Border FX & Sanctions */}
          <button
            type="button"
            onClick={() => setShowCrossBorderModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-bold border border-cyan-800 shadow-sm transition-all cursor-pointer"
            title="Cross-Border FX Hedging & Sanctions Radar"
          >
            <span>🌐 FX</span>
          </button>

          {/* Option 4: AI Fraud Intelligence & Forensic Biometrics */}
          <button
            type="button"
            onClick={() => setShowForensicModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 text-xs font-bold border border-purple-800 shadow-sm transition-all cursor-pointer"
            title="AI Siamese Signature Matching & UV 365nm Watermark Inspection"
          >
            <span>🧬 Forensics</span>
          </button>

          {/* Statutory tools if already final */}
          {cheque.status === "RETURNED" && (
            <button
              type="button"
              onClick={() => onViewReturnMemo(cheque.id)}
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <span>Return Memo (Sec 138)</span>
            </button>
          )}
        </div>

        {/* The 3 Direct Verification Options (Verify, Clear, Return) */}
        {["PRESENTED", "VERIFIED", "AWAITING_CHECKER"].includes(cheque.status) && (
          <div className="pt-2 border-t border-slate-800">
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

      {showForensicModal && (
        <ForensicIntelligenceSuiteModal
          cheque={cheque}
          onClose={() => setShowForensicModal(false)}
        />
      )}
    </div>
  );
}
