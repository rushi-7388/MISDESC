import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import BatchManagementPanel from "../components/BatchManagementPanel";
import BulkBatchUploadPanel from "../components/BulkBatchUploadPanel";
import RiskBadge from "../components/RiskBadge";
import client from "../api/client";
import { useClearingEvents } from "../hooks/useClearingEvents";

export default function BranchManagerDashboard() {
  const [summary, setSummary] = useState(null);
  const [cheques, setCheques] = useState([]);
  const [activeTab, setActiveTab] = useState("counter_signature"); // "counter_signature" | "all_instruments" | "batches"
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [dispatchSuccess, setDispatchSuccess] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [sumRes, chqRes] = await Promise.all([
        client.get("/branch/summary"),
        client.get("/branch/cheques"),
      ]);
      setSummary(sumRes.data);
      setCheques(chqRes.data);
    } catch (err) {
      console.error("Failed to load branch data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useClearingEvents(() => {
    loadData();
  });

  async function handleApprove(chequeId) {
    try {
      setActionLoading(chequeId);
      await client.post(`/branch/cheques/${chequeId}/approve`, {
        notes: "Verified against branch mandate & signature specimen.",
      });
      await loadData();
    } catch (err) {
      alert("Approval failed: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDispatchBatch() {
    try {
      setActionLoading("dispatch");
      const res = await client.post("/branch/batch/dispatch", {});
      setDispatchSuccess(res.data.message);
      setTimeout(() => setDispatchSuccess(null), 6000);
      await loadData();
    } catch (err) {
      alert("Batch dispatch failed: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  }

  const awaitingSignatureCheques = cheques.filter(
    (c) => Number(c.amount) >= 50000 && !c.branchManagerApproved
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Branch Operations Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200/70 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
              Branch Operations & Governance · Surat Bank
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {summary?.branchName || "Athwa Lines Branch"} — Operations Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Teller queue oversight, high-value instrument counter-signature approvals (&gt;₹50,000), and batch dispatch to MISDESC Clearing Switch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/rbac"
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              Manage Branch RBAC
            </Link>

            <button
              type="button"
              onClick={handleDispatchBatch}
              disabled={actionLoading === "dispatch"}
              className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {actionLoading === "dispatch" ? "Dispatching..." : "Dispatch Branch Batch"}
            </button>
          </div>
        </div>

        {dispatchSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl p-4 flex items-center gap-3 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">{dispatchSuccess}</span>
          </div>
        )}

        {/* Branch Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Branch Presented
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
              {summary?.totalPresented || 0}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1">
              ₹{Number(summary?.totalPresentedAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-5 shadow-xs">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
              <span>Awaiting Counter-Signature</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1.5 tracking-tight">
              {awaitingSignatureCheques.length}
            </div>
            <div className="text-xs text-amber-700/80 mt-1">
              High-value threshold (&gt;₹50,000)
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cleared Through Switch
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1.5 tracking-tight">
              {summary?.totalCleared || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">Settled on T+0 cycle</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Teller Limit Mandate
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight font-mono">
              ₹{(summary?.tellerOperatingLimit || 100000).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-500 mt-1">Escalation required above limit</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("counter_signature")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "counter_signature"
                ? "border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Counter-Signature Queue</span>
            {awaitingSignatureCheques.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {awaitingSignatureCheques.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all_instruments")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "all_instruments"
                ? "border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>All Branch Instruments</span>
            <span className="text-xs text-slate-400 font-mono">({cheques.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("batches")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "batches"
                ? "border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Branch Batch Intake</span>
          </button>
        </div>

        {/* Tab 1: Counter-Signature Queue */}
        {activeTab === "counter_signature" && (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Instruments Exceeding Branch Teller Limits (&gt; ₹50,000)
                </h3>
                <p className="text-xs text-slate-500">
                  Manager counter-signature is required before these cheques can be released to the central clearing switch.
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">
                {awaitingSignatureCheques.length} Pending
              </span>
            </div>

            {awaitingSignatureCheques.length === 0 ? (
              <div className="p-12 text-center">
                <h4 className="font-bold text-sm text-slate-800">Queue Clear</h4>
                <p className="text-xs text-slate-500 mt-1">
                  All high-value cheques presented at this branch have been authorized and counter-signed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Cheque No</th>
                      <th className="px-4 py-3">MICR / Account</th>
                      <th className="px-4 py-3">Payee</th>
                      <th className="px-4 py-3 text-right">Amount (INR)</th>
                      <th className="px-4 py-3">Risk Tier</th>
                      <th className="px-4 py-3">Signature AI</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {awaitingSignatureCheques.map((chq) => (
                      <tr key={chq.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {chq.chequeNumber}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          <div>{chq.accountNumber}</div>
                          <div className="text-[10px] text-slate-400">{chq.micrCode}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {chq.payeeName}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                          ₹{Number(chq.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <RiskBadge tier={chq.riskTier} score={chq.riskScore} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {chq.signatureMatchScore || 95}% Match
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleApprove(chq.id)}
                            disabled={actionLoading === chq.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === chq.id ? "Signing..." : "Counter-Sign"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Branch Instruments */}
        {activeTab === "all_instruments" && (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Branch Presentation Ledger</h3>
                <p className="text-xs text-slate-500">
                  Full list of cheques captured by branch tellers.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">{cheques.length} Total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Cheque No</th>
                    <th className="px-4 py-3">Drawer Account</th>
                    <th className="px-4 py-3">Payee</th>
                    <th className="px-4 py-3 text-right">Amount (INR)</th>
                    <th className="px-4 py-3">Drawee Bank</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Manager Counter-Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cheques.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.chequeNumber}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{c.accountNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{c.payeeName}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ₹{Number(c.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{c.draweeBank?.code || "HDB"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === "CLEARED"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "RETURNED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.branchManagerApproved ? (
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Approved
                          </span>
                        ) : Number(c.amount) >= 50000 ? (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Within Limit</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Branch Batch Intake */}
        {activeTab === "batches" && (
          <div className="space-y-6">
            <BatchManagementPanel onBatchCreated={loadData} />
            <BulkBatchUploadPanel onUploadComplete={loadData} />
          </div>
        )}
      </main>
    </div>
  );
}
