import React, { useState, useEffect } from "react";
import client from "../api/client";
import { sovereignAudio } from "../utils/settlement-sound.util";
import { useClearingEvents } from "../hooks/useClearingEvents";

export default function HourlyContinuousClearingModal({ onClose }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [settledResult, setSettledResult] = useState(null);

  // Real-time listener for incoming settlements
  useClearingEvents((event) => {
    if (event.type === "HOURLY_BATCH_SETTLED") {
      setSettledResult(event.data);
      sovereignAudio.playSettlementChime(event.data?.totalVolumeInr || 555000);
      loadStatus();
    }
  });

  async function loadStatus() {
    try {
      setLoading(true);
      const res = await client.get("/dpi/continuous-clearing/status");
      setStatus(res.data);
    } catch (err) {
      console.error("Failed to load continuous clearing status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTriggerHourlySettlement() {
    setSettling(true);
    try {
      const res = await client.post("/dpi/continuous-clearing/hourly-batch", {
        batchId: status?.nextHourlyBatch?.batchId || "BATCH-H14",
        eligibleCheques: [
          { chequeNumber: "000101", amount: 150000 },
          { chequeNumber: "000102", amount: 85000 },
          { chequeNumber: "000103", amount: 320000 },
        ],
      });
      setSettledResult(res.data);
      sovereignAudio.playSettlementChime(res.data.totalVolumeInr || 555000);
      await loadStatus();
    } catch (err) {
      alert("Hourly settlement failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSettling(false);
    }
  }

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 text-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">
              ⏱️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-mono">
                  RBI Continuous Clearing 2025
                </span>
                <span className="text-xs text-slate-400">Governor Shaktikanta Das Directive</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                Hourly Rolling T+0 Realization & 1-Hour SLA Clock
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

        {/* Operational Status Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Presentation Window</span>
            <span className="text-base font-bold text-emerald-400 mt-1 block">10:00 AM – 04:00 PM</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Continuous Instrument Scan</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Drawee Confirmation</span>
            <span className="text-base font-bold text-cyan-400 mt-1 block">10:00 AM – 07:00 PM</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Positive/Negative Approvals</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customer Crediting SLA</span>
            <span className="text-base font-bold text-amber-400 mt-1 block">Within 60 Mins</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Strict RBI Mandate</span>
          </div>
        </div>

        {/* Next Batch Countdown Card */}
        {status && (
          <div className="mt-6 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-800/60 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider block">
                Next Hourly Net Settlement Cycle
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">
                {status.nextHourlyBatch?.scheduledTime} · {status.nextHourlyBatch?.batchId}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Countdown to cycle execution: <span className="font-mono font-bold text-amber-300">{status.nextHourlyBatch?.countdownFormatted}</span>
              </p>
            </div>

            <button
              onClick={handleTriggerHourlySettlement}
              disabled={settling}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {settling ? "Executing Cycle..." : "⚡ Trigger Batch Execution Now"}
            </button>
          </div>
        )}

        {/* Hourly Settlement Execution Result */}
        {settledResult && (
          <div className="mt-6 border border-emerald-500/30 bg-emerald-950/20 rounded-2xl p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2">
              <span className="font-bold text-emerald-300 uppercase tracking-wider">
                ✓ RTGS Settlement Confirmed (RBI e-Kuber)
              </span>
              <span className="text-emerald-400">{settledResult.settledAt?.slice(11, 19)} IST</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">UTR Code</span>
                <span className="text-white font-bold">{settledResult.utr}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Volume Cleared</span>
                <span className="text-white font-bold">₹{Number(settledResult.totalVolumeInr).toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Instruments</span>
                <span className="text-white font-bold">{settledResult.instrumentsSettled} Cheques</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Customer Credit SLA</span>
                <span className="text-amber-400 font-bold">60 Mins Active</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Statutory Pacs.008 Reference: <span className="text-cyan-300">{settledResult.pacs008XmlRef}</span>
            </div>
          </div>
        )}

        {/* 9 Scheduled Hourly Batches Grid */}
        <div className="mt-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Official 9-Hourly Settlement Grid (11:00 AM – 07:00 PM)
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 text-center text-xs font-mono">
            {status?.schedule?.settlementBatches?.map((b) => (
              <div
                key={b.batchId}
                className={`p-2.5 rounded-xl border ${
                  b.batchId === status.nextHourlyBatch?.batchId
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold shadow-md shadow-cyan-500/10"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                <div className="text-[10px] text-slate-500">{b.batchId}</div>
                <div className="text-[11px] mt-0.5">{b.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
