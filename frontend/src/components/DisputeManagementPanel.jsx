import React, { useEffect, useState } from "react";
import client from "../api/client";
import { useClearingEvents } from "../hooks/useClearingEvents";
import { exportRbiOmbudsmanEvidenceBundle } from "../utils/ombudsmanEvidenceExport";

export default function DisputeManagementPanel() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [adjudicatingDispute, setAdjudicatingDispute] = useState(null);
  const [newStatus, setNewStatus] = useState("RESOLVED_CLAIMANT");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  async function loadDisputes() {
    try {
      setLoading(true);
      const res = await client.get("/disputes");
      setDisputes(res.data || []);
    } catch (err) {
      console.error("Failed to load disputes:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDisputes();
  }, []);

  useClearingEvents(() => {
    loadDisputes();
  });

  async function handleExportBundle(dispute) {
    try {
      setExportingId(dispute.id);
      const result = await exportRbiOmbudsmanEvidenceBundle(dispute);
      setSuccessMsg(`Legal Evidence Bundle downloaded: ${result.filename} (${(result.sizeBytes / 1024).toFixed(1)} KB)`);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      alert("Failed to export evidence bundle: " + err.message);
    } finally {
      setExportingId(null);
    }
  }

  async function handleAdjudicate(e) {
    e.preventDefault();
    if (!adjudicatingDispute) return;

    try {
      setSubmitting(true);
      await client.patch(`/disputes/${adjudicatingDispute.id}/status`, {
        toStatus: newStatus,
        resolutionSummary: resolutionSummary || `Ruled ${newStatus} under MISDESC Dispute Resolution Protocol`,
      });

      setSuccessMsg(`Dispute ${adjudicatingDispute.claimNumber} successfully adjudicated.`);
      setAdjudicatingDispute(null);
      setResolutionSummary("");
      setTimeout(() => setSuccessMsg(null), 5000);
      await loadDisputes();
    } catch (err) {
      alert("Adjudication failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  const filteredDisputes = disputes.filter(
    (d) => filterStatus === "ALL" || d.status === filterStatus
  );


  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Control bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Clearing Dispute Resolution Claims Registry</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              NPCI MISDESC DRM Rule 32
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interbank chargeback claims, forged endorsement challenges, and statutory 72-hour regulatory arbitrations.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {["ALL", "FILED", "UNDER_REVIEW", "RESOLVED_CLAIMANT", "RESOLVED_RESPONDENT"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === st
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold">
            Loading active disputes...
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No dispute claims found matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Claim Reference</th>
                  <th className="py-3 px-4">Dispute Type</th>
                  <th className="py-3 px-4">Instrument & Amount</th>
                  <th className="py-3 px-4">Claimant vs Respondent</th>
                  <th className="py-3 px-4">SLA Clock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDisputes.map((d) => {
                  const hoursLeft = Math.round((new Date(d.slaDeadline) - new Date()) / 3600000);
                  const isOverdue = hoursLeft <= 0;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{d.claimNumber}</div>
                        <div className="text-[10px] text-slate-400">
                          Filed: {new Date(d.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {d.disputeType.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">
                          ₹{Number(d.claimAmount).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Cheque #{d.cheque?.chequeNumber} · {d.cheque?.payeeName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{d.initiatingBank.code}</span>
                          <span className="text-slate-400">→</span>
                          <span>{d.respondentBank.code}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                            d.status.startsWith("RESOLVED")
                              ? "bg-slate-100 text-slate-600"
                              : isOverdue
                              ? "bg-rose-100 text-rose-800 font-extrabold animate-pulse"
                              : "bg-cyan-50 text-cyan-800"
                          }`}
                        >
                          {d.status.startsWith("RESOLVED")
                            ? "Closed"
                            : isOverdue
                            ? "SLA BREACHED"
                            : `${hoursLeft}h remaining`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === "FILED"
                              ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                              : d.status === "UNDER_REVIEW"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : d.status === "RESOLVED_CLAIMANT"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-purple-50 text-purple-800 border border-purple-200"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleExportBundle(d)}
                            disabled={exportingId === d.id}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                            title="Export full RBI Banking Ombudsman evidentiary ZIP package"
                          >
                            <span>{exportingId === d.id ? "📦 Bundling..." : "📦 Export Bundle (ZIP)"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAdjudicatingDispute(d)}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                          >
                            Adjudicate
                          </button>
                        </div>
                      </td>
                    </tr>

                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjudication Modal */}
      {adjudicatingDispute && (
        <div
          onClick={() => setAdjudicatingDispute(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-700">
                  {adjudicatingDispute.claimNumber}
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Adjudicate Clearing Dispute Claim
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjudicatingDispute(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Allegation:</span>
                <span className="font-bold text-slate-900">
                  {adjudicatingDispute.disputeType.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Claim Amount:</span>
                <span className="font-bold text-slate-900 font-mono">
                  ₹{Number(adjudicatingDispute.claimAmount).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Submitted Evidence:</span>
                <p className="bg-white p-2 rounded-lg border border-slate-200 text-slate-700 italic text-[11px]">
                  "{adjudicatingDispute.evidenceNotes}"
                </p>
              </div>
            </div>

            <form onSubmit={handleAdjudicate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Arbiter Formal Ruling
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-cyan-600 font-semibold"
                >
                  <option value="UNDER_REVIEW">Move to UNDER REVIEW (Request Subpoena)</option>
                  <option value="RESOLVED_CLAIMANT">Rule in Favor of Claimant (Reverse Settlement)</option>
                  <option value="RESOLVED_RESPONDENT">Rule in Favor of Respondent (Dismiss Claim)</option>
                  <option value="ESCALATED_RBI_OMBUDSMAN">Escalate to RBI Banking Ombudsman</option>
                  <option value="CLOSED">Close & Archive Claim</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Statutory Arbitration Notes & Finding
                </label>
                <textarea
                  rows={3}
                  placeholder="Record formal reasons for ruling based on MISDESC Rule 32..."
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-cyan-600 resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleExportBundle(adjudicatingDispute)}
                  disabled={exportingId === adjudicatingDispute.id}
                  className="px-3 py-2 font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <span>{exportingId === adjudicatingDispute.id ? "📦 Packaging..." : "📦 Export Evidence Bundle (ZIP)"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjudicatingDispute(null)}
                    className="px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs disabled:opacity-50 text-xs cursor-pointer"
                  >
                    {submitting ? "Submitting..." : "Commit Arbitration Ruling"}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
