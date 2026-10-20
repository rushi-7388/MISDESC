import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function LedgerIntegrityPanel() {
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentEvents, setRecentEvents] = useState([]);

  async function runAudit() {
    setLoading(true);
    try {
      const [auditRes, eventsRes] = await Promise.all([
        client.get("/admin/ledger/verify"),
        client.get("/admin/audit-trail"),
      ]);
      setAuditResult(auditRes.data);
      setRecentEvents(eventsRes.data.slice(0, 8));
    } catch (err) {
      setAuditResult({ isValid: false, reason: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runAudit();
  }, []);

  return (
    <div className="bg-slate-900/90 rounded-2xl shadow-xl border border-slate-800 p-6 space-y-6 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white">Audit Ledger Verification</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic SHA-256 hash verification of clearing events and audit trail
          </p>
        </div>

        <button
          type="button"
          onClick={runAudit}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-950/40 cursor-pointer"
        >
          {loading ? "Verifying..." : "Verify Ledger Integrity"}
        </button>
      </div>

      {/* Audit Status Banner */}
      {auditResult && (
        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
            auditResult.isValid
              ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-300"
              : "bg-rose-950/60 border-rose-800/80 text-rose-300"
          }`}
        >
          <div>
            <div className="font-bold text-sm">
              {auditResult.isValid
                ? "Ledger Integrity Verified"
                : "Security Alert: Integrity Verification Failed"}
            </div>
            <div className="text-xs opacity-80 mt-0.5">{auditResult.message || auditResult.reason}</div>
          </div>

          <div className="text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            Verified: <span className="font-bold">{auditResult.totalEvents} blocks</span>
          </div>
        </div>
      )}

      {/* Ledger Hashes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-slate-400 font-sans font-semibold text-[11px] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Genesis Hash (Block #0)</span>
            <span className="text-emerald-400 font-bold font-mono">ANCHOR</span>
          </div>
          <div className="text-slate-200 break-all bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[11px] select-all">
            {auditResult?.genesisHash || "0000000000000000000000000000000000000000000000000000000000000000"}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-slate-400 font-sans font-semibold text-[11px] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Tip Block Hash (Latest State)</span>
            <span className="text-cyan-400 font-bold font-mono">CHAIN TIP</span>
          </div>
          <div className="text-slate-200 break-all bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[11px] select-all">
            {auditResult?.tipHash || "0000000000000000000000000000000000000000000000000000000000000000"}
          </div>
        </div>
      </div>

      {/* Visual Hash Chain Block Explorer */}
      <div>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          Recent Audit Ledger Blocks
        </h3>

        <div className="space-y-3">
          {recentEvents.map((ev, idx) => (
            <div
              key={ev.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition-colors text-xs space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded text-[10px]">
                    BLOCK #{recentEvents.length - idx}
                  </span>
                  <span className="font-semibold text-white">
                    Cheque #{ev.cheque?.chequeNumber}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    ({ev.fromStatus ? `${ev.fromStatus} → ${ev.toStatus}` : `INIT ${ev.toStatus}`})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(ev.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="truncate bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-slate-400">
                  <span className="font-bold text-slate-500">prev: </span>
                  {ev.prevHash ? ev.prevHash : "0000000000000000000000000000000000000000..."}
                </div>
                <div className="truncate bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-cyan-300 font-semibold">
                  <span className="font-bold text-slate-500">hash: </span>
                  {ev.hash ? ev.hash : "Calculating..."}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
