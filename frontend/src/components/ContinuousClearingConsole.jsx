import React, { useEffect, useState } from "react";
import client from "../api/client";
import EKuberAdviceModal from "./EKuberAdviceModal";

export default function ContinuousClearingConsole() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChequeId, setSelectedChequeId] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [settlingChequeId, setSettlingChequeId] = useState(null);
  const [message, setMessage] = useState("");
  const [countdownSeconds, setCountdownSeconds] = useState(480); // 8m remaining in 15m cycle

  async function loadStatus() {
    try {
      const { data } = await client.get("/settlements/continuous/status");
      setStatusData(data);
    } catch (err) {
      console.error("Failed to load continuous clearing status:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 1 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleToggleMode() {
    if (!statusData) return;
    setToggling(true);
    setMessage("");
    try {
      const newMode = !statusData.config?.enabled;
      const { data } = await client.post("/settlements/continuous/toggle", {
        enabled: newMode,
      });
      setMessage(data.message);
      await loadStatus();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to toggle continuous mode");
    } finally {
      setToggling(false);
    }
  }

  async function handleSettleNow(chequeId) {
    setSettlingChequeId(chequeId);
    setMessage("");
    try {
      const { data } = await client.post(`/settlements/continuous/settle-now/${chequeId}`);
      setMessage(data.message);
      await loadStatus();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to settle cheque via e-Kuber");
    } finally {
      setSettlingChequeId(null);
    }
  }

  const isContinuous = statusData?.config?.enabled ?? true;
  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;
  const timerDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-6 space-y-6">
      {/* Console Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-mono font-semibold">
              CLEARING ENGINE
            </span>
            <h2 className="font-bold text-base text-gray-900">
              Continuous Clearing & e-Kuber Settlement Console
            </h2>
          </div>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-gray-700 block">Clearing Mode</span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isContinuous
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              {isContinuous ? "CONTINUOUS (T+0)" : "BATCH (T+1)"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleMode}
            disabled={toggling}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
              isContinuous
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {toggling
              ? "Switching..."
              : isContinuous
              ? "Switch to Batch (T+1)"
              : "Activate Continuous Clearing (T+0)"}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          {message}
        </div>
      )}

      {/* Sub-Hourly Continuous Clearing Clock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Continuous Timer Card */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400">Clearing Cycle</span>
            <span className="font-mono text-[10px] text-slate-400">Window: 15 Minutes</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-mono text-2xl font-black text-white tracking-wider">
              {timerDisplay}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Cycle: #MISDESC-CC-{new Date().toISOString().slice(8, 10)}84
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
              style={{ width: `${(countdownSeconds / 900) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 block pt-0.5">
            Instruments auto-settle upon Drawee verification without waiting for cut-off.
          </span>
        </div>

        {/* Real-Time Settlement Stat Card */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900">Total Realised Volume (T+0)</span>
            <span className="px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900 text-[10px] font-bold font-mono">
              e-Kuber RTGS
            </span>
          </div>
          <div className="font-mono text-2xl font-black text-emerald-950 pt-1">
            ₹{Number(statusData?.stats?.totalRealisedAmount || 0).toLocaleString("en-IN")}
          </div>
          <div className="flex justify-between text-[11px] text-emerald-800 font-mono pt-1">
            <span>Settled: {statusData?.stats?.realisedCount || 0} instruments</span>
            <span>Avg Speed: 1.2s</span>
          </div>
        </div>

        {/* SRE Observability Telemetry Hub Card */}
        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-950">
              SRE Monitoring Stack
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 text-[10px] font-bold font-mono">
              Prometheus + Grafana
            </span>
          </div>
          <p className="text-[11px] text-indigo-900/80 leading-tight">
            Real-time metric scraping at 5s intervals. Ingestion rates, e-Kuber latencies, and liquidity stress gauges.
          </p>
          <div className="flex gap-2 pt-1">
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors shadow-2xs"
            >
              Grafana (Port 3001)
            </a>
            <a
              href="http://localhost:9090"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] transition-colors shadow-2xs"
            >
              Prometheus (Port 9090)
            </a>
          </div>
        </div>
      </div>

      {/* Real-time e-Kuber Settlement Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
            RBI e-Kuber Real-Time On-Realisation Ledger ({statusData?.settledCheques?.length || 0} Instruments Settled)
          </h3>
          <button
            onClick={loadStatus}
            className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
          >
            Refresh Stream
          </button>
        </div>

        {statusData?.settledCheques?.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl text-xs">
            No instruments have been settled via Continuous Clearing yet. Verify and clear a presented cheque to see instant e-Kuber realization.
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider border-b">
                <tr>
                  <th className="text-left px-3 py-2.5">Settlement Timestamp</th>
                  <th className="text-left px-3 py-2.5">Cheque # & Payee</th>
                  <th className="text-right px-3 py-2.5">Amount</th>
                  <th className="text-left px-3 py-2.5">RBI Central Bank UTR</th>
                  <th className="text-left px-3 py-2.5">Accounting Flow</th>
                  <th className="text-left px-3 py-2.5">Beneficiary Credit</th>
                  <th className="text-right px-3 py-2.5">Settlement Advice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {statusData?.settledCheques?.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-gray-500">
                      {c.settledAt ? new Date(c.settledAt).toLocaleTimeString() : "Instant"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-mono font-bold text-gray-900">#{c.chequeNumber}</div>
                      <div className="text-[11px] text-gray-500">{c.payeeName}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                      ₹{Number(c.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-800 font-bold text-[10px] border border-brand-200">
                        {c.ekuberUtr || "RBIR52026..."}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px]">
                      <span className="text-red-700 font-semibold">{c.draweeBank?.code}</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="text-emerald-700 font-semibold">{c.presentingBank?.code}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-block">
                        T+0 CREDITED
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedChequeId(c.id)}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 text-[10px] transition-colors cursor-pointer"
                      >
                        pacs.009 Advice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Cleared Cheques (Awaiting Settlement) */}
      {statusData?.pendingCheques?.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-amber-900">
              Cleared Instruments Awaiting e-Kuber Settlement ({statusData.pendingCheques.length})
            </span>
            <span className="text-[10px] font-mono text-amber-800">
              Awaiting batch settlement cut-off
            </span>
          </div>

          <div className="space-y-2">
            {statusData.pendingCheques.map((c) => (
              <div
                key={c.id}
                className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-gray-900">Cheque #{c.chequeNumber}</span>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className="font-semibold text-gray-800">{c.payeeName}</span>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className="font-mono font-bold text-brand-700">
                    ₹{Number(c.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={settlingChequeId === c.id}
                  onClick={() => handleSettleNow(c.id)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {settlingChequeId === c.id ? "Settling..." : "Settle via e-Kuber (T+0)"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* e-Kuber Advice Modal */}
      {selectedChequeId && (
        <EKuberAdviceModal
          chequeId={selectedChequeId}
          onClose={() => setSelectedChequeId(null)}
        />
      )}
    </div>
  );
}
