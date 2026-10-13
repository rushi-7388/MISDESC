import React, { useEffect, useState } from "react";
import client from "../api/client";
import { useClearingEvents } from "../hooks/useClearingEvents";

export default function SessionReconciliationConsole() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [cutoffStatus, setCutoffStatus] = useState(null);
  const [reconciliationReport, setReconciliationReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [minutesToCutoff, setMinutesToCutoff] = useState("30");
  const [windowType, setWindowType] = useState("MORNING_CYCLE");
  const [msg, setMsg] = useState(null);

  async function loadInitialData() {
    try {
      setLoading(true);
      const res = await client.get("/batches");
      const list = res.data || [];
      setBatches(list);
      if (list.length > 0) {
        const targetId = selectedBatchId || list[0].id;
        setSelectedBatchId(targetId);
        await loadBatchDetails(targetId);
      }
    } catch (err) {
      console.error("Failed to load clearing batches:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadBatchDetails(batchId) {
    if (!batchId) return;
    try {
      const res = await client.get(`/reconciliation/batches/${batchId}/cutoff`);
      setCutoffStatus(res.data);
      const batchObj = batches.find((b) => b.id === batchId);
      if (batchObj?.reconciliationReport) {
        setReconciliationReport(batchObj.reconciliationReport);
      } else {
        setReconciliationReport(null);
      }
    } catch (err) {
      console.error("Failed to fetch cutoff status:", err);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useClearingEvents(() => {
    if (selectedBatchId) loadBatchDetails(selectedBatchId);
  });

  async function handleBatchSelect(id) {
    setSelectedBatchId(id);
    await loadBatchDetails(id);
  }

  async function handleConfigureCutoff(e) {
    e.preventDefault();
    try {
      setActionLoading(true);
      await client.post(`/reconciliation/batches/${selectedBatchId}/cutoff`, {
        windowType,
        minutesToCutoff: Number(minutesToCutoff),
      });
      setMsg("Cutoff window timer successfully configured.");
      setShowConfigModal(false);
      setTimeout(() => setMsg(null), 5000);
      await loadBatchDetails(selectedBatchId);
    } catch (err) {
      alert("Failed to configure cutoff: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRunReconciliation(force = false) {
    try {
      setActionLoading(true);
      const res = await client.post(`/reconciliation/batches/${selectedBatchId}/reconcile`, {
        force,
      });
      setReconciliationReport(res.data.report);
      setMsg("Two-Way Multilateral Reconcilement executed successfully!");
      setTimeout(() => setMsg(null), 5000);
      await loadBatchDetails(selectedBatchId);
    } catch (err) {
      if (err.response?.status === 409) {
        if (
          window.confirm(
            `${err.response.data.error}\n\nWould you like to force reconcile and rollover unresolved instruments into the subsequent cycle?`
          )
        ) {
          handleRunReconciliation(true);
        }
      } else {
        alert("Reconciliation failed: " + (err.response?.data?.error || err.message));
      }
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>✓ {msg}</span>
          <button onClick={() => setMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Control Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Clearing Window Cutoff & Bilateral Reconcilement</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
              MISDESC Rule 31 Mandate
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational clearing session window management, cutoff countdown alerts, and mathematical two-way settlement balancing.
          </p>
        </div>

        {/* Batch selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedBatchId}
            onChange={(e) => handleBatchSelect(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold focus:outline-cyan-600"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.sessionCode} — {b.sessionName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Configure Cutoff
          </button>
        </div>
      </div>

      {/* Cutoff Status Card */}
      {cutoffStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Session Operational Status</div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  cutoffStatus.windowStatus === "OPEN"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : cutoffStatus.windowStatus === "CUTOFF_WARNING"
                    ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                    : "bg-slate-900 text-white"
                }`}
              >
                {cutoffStatus.windowStatus}
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold">
                {cutoffStatus.windowType || "STANDARD"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Batch Status: <span className="font-bold text-slate-700">{cutoffStatus.batchStatus}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cutoff Countdown Timer</div>
            <div className="text-3xl font-extrabold font-mono text-cyan-700 mt-1">
              {cutoffStatus.minutesRemaining !== null
                ? `${cutoffStatus.minutesRemaining} min`
                : "No Timer Set"}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {cutoffStatus.cutoffAt
                ? `Window closes at ${new Date(cutoffStatus.cutoffAt).toLocaleTimeString("en-IN")}`
                : "Continuous T+0 execution active"}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Session Instruments</div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
              {cutoffStatus.counts?.total || 0} Total Instruments
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mt-1">
              <span className="text-emerald-700 font-bold">{cutoffStatus.counts?.cleared || 0} Cleared</span> ·
              <span className="text-rose-700 font-bold">{cutoffStatus.counts?.returned || 0} Returned</span> ·
              <span className="text-amber-700 font-bold">{cutoffStatus.counts?.unresolvedPending || 0} Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation Action & Report Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Two-Way Bilateral Reconcilement Engine</h3>
            <p className="text-xs text-slate-500">
              Performs cross-matching between inward and outward clearing obligations and certifies the session.
            </p>
          </div>

          <button
            type="button"
            disabled={actionLoading}
            onClick={() => handleRunReconciliation(false)}
            className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {actionLoading ? "Reconciling Session..." : "Execute Two-Way Reconcilement"}
          </button>
        </div>

        {reconciliationReport ? (
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span>✓ Section 31 Reconciliation Certificate Issued</span>
              </span>
              <span className="font-mono text-xs text-slate-400">
                Timestamp: {new Date(reconciliationReport.reconciledAt).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px] uppercase">Cleared Value</div>
                <div className="text-base font-bold text-emerald-700 mt-0.5">
                  ₹{Number(reconciliationReport.clearedAmount).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px] uppercase">Returned Value</div>
                <div className="text-base font-bold text-rose-700 mt-0.5">
                  ₹{Number(reconciliationReport.returnedAmount).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px] uppercase">Discrepancy Count</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {reconciliationReport.discrepancyCount} Rollover(s)
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-slate-400 text-[10px] uppercase">Balance Variance</div>
                <div className="text-base font-bold text-cyan-700 mt-0.5">
                  ₹{reconciliationReport.balanceVariance.toFixed(2)} (Perfect)
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs">
            No formal reconciliation report generated yet for this clearing session. Click "Execute Two-Way Reconcilement" to balance.
          </div>
        )}
      </div>

      {/* Configure Modal */}
      {showConfigModal && (
        <div
          onClick={() => setShowConfigModal(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Configure Session Cutoff Window</h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfigureCutoff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clearing Cycle Type</label>
                <select
                  value={windowType}
                  onChange={(e) => setWindowType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                >
                  <option value="MORNING_CYCLE">Morning Clearing Session (08:00 - 11:30)</option>
                  <option value="AFTERNOON_CONTINUOUS">Afternoon Fast-Path Continuous Window</option>
                  <option value="EVENING_RETURN">Evening Statutory Return Cycle</option>
                  <option value="SPECIAL_SESSION">Special Central Bank Settlement Window</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cutoff Window Duration (Minutes)</label>
                <input
                  type="number"
                  value={minutesToCutoff}
                  onChange={(e) => setMinutesToCutoff(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-cyan-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 font-bold bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Set Cutoff Timer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
