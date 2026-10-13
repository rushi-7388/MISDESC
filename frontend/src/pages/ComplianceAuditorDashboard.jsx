import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import LedgerIntegrityPanel from "../components/LedgerIntegrityPanel";
import FraudFlagsPanel from "../components/FraudFlagsPanel";
import ISO20022Modal from "../components/ISO20022Modal";
import ClearanceCertificateModal from "../components/ClearanceCertificateModal";
import PositivePayRegistryModal from "../components/PositivePayRegistryModal";
import DisputeManagementPanel from "../components/DisputeManagementPanel";
import PKICertificatesPanel from "../components/PKICertificatesPanel";
import client from "../api/client";

export default function ComplianceAuditorDashboard() {
  const [activeTab, setActiveTab] = useState("ledger"); // "ledger" | "fraud_flags" | "audit_trail" | "disputes" | "pki_certs"
  const [auditEvents, setAuditEvents] = useState([]);
  const [loadingTrail, setLoadingTrail] = useState(false);
  const [selectedChequeIso, setSelectedChequeIso] = useState(null);
  const [selectedChequeCert, setSelectedChequeCert] = useState(null);
  const [showPpsModal, setShowPpsModal] = useState(false);

  async function loadAuditTrail() {
    try {
      setLoadingTrail(true);
      const res = await client.get("/admin/audit-trail");
      setAuditEvents(res.data || []);
    } catch (err) {
      console.error("Failed to load audit trail:", err);
    } finally {
      setLoadingTrail(false);
    }
  }

  useEffect(() => {
    if (activeTab === "audit_trail") {
      loadAuditTrail();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Auditor Portal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
              RBI Regulatory Oversight & Central Compliance Wing
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Regulatory Compliance & Forensic Audit Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              SHA-256 ledger verification, Positive Pay System audits, statutory return compliance, and ISO 20022 message certification.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/reports"
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Regulatory MIS Reports</span>
            </a>
            <button
              type="button"
              onClick={() => setShowPpsModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              Positive Pay Central Registry
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "ledger"
                ? "border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Cryptographic Ledger Verification</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fraud_flags")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "fraud_flags"
                ? "border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Forensic Fraud & Risk Flags</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("disputes")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "disputes"
                ? "border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Clearing Disputes (DRM Rule 32)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pki_certs")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "pki_certs"
                ? "border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>X.509 PKI Trust & Certificates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit_trail")}
            className={`py-3 px-5 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "audit_trail"
                ? "border-amber-600 text-amber-800 bg-amber-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Immutable Clearing Event Log</span>
          </button>
        </div>

        {/* Tab 1: Ledger Integrity Panel */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            <LedgerIntegrityPanel />
          </div>
        )}

        {/* Tab 2: Fraud Flags */}
        {activeTab === "fraud_flags" && (
          <div className="space-y-6">
            <FraudFlagsPanel />
          </div>
        )}

        {/* Tab 3: Disputes */}
        {activeTab === "disputes" && (
          <div className="space-y-6">
            <DisputeManagementPanel />
          </div>
        )}

        {/* Tab 4: PKI Certificates */}
        {activeTab === "pki_certs" && (
          <div className="space-y-6">
            <PKICertificatesPanel />
          </div>
        )}

        {/* Tab 3: Immutable Audit Trail */}
        {activeTab === "audit_trail" && (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Regulatory Transaction Audit Trail (SHA-256 Chained)
                </h3>
                <p className="text-xs text-slate-500">
                  Complete chain of custody across all presenting, verification, and settlement events.
                </p>
              </div>
              <button
                type="button"
                onClick={loadAuditTrail}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                {loadingTrail ? "Refreshing..." : "Refresh Trail"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp (IST)</th>
                    <th className="px-4 py-3">Cheque ID / Number</th>
                    <th className="px-4 py-3">State Transition</th>
                    <th className="px-4 py-3">Actor / Email</th>
                    <th className="px-4 py-3">Remarks / Reason</th>
                    <th className="px-4 py-3 font-mono">Current Hash (SHA-256)</th>
                    <th className="px-4 py-3 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(evt.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {evt.cheque?.chequeNumber || evt.chequeId.substring(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700">
                          {evt.fromStatus || "START"} →{" "}
                          <span className="text-brand-600 font-bold">{evt.toStatus}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">
                        {evt.actor?.email || "SYSTEM"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-sans text-xs truncate max-w-[200px]">
                        {evt.remarks || "—"}
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate-400 truncate max-w-[140px]" title={evt.hash}>
                        {evt.hash ? `${evt.hash.substring(0, 16)}...` : "PENDING"}
                      </td>
                      <td className="px-4 py-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedChequeIso(evt.chequeId)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                            title="Inspect ISO 20022 XML"
                          >
                            ISO XML
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedChequeCert(evt.chequeId)}
                            className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold cursor-pointer transition-colors"
                            title="View Clearance Certificate"
                          >
                            Cert
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Inspectors */}
        {selectedChequeIso && (
          <ISO20022Modal
            chequeId={selectedChequeIso}
            onClose={() => setSelectedChequeIso(null)}
          />
        )}

        {selectedChequeCert && (
          <ClearanceCertificateModal
            chequeId={selectedChequeCert}
            onClose={() => setSelectedChequeCert(null)}
          />
        )}

        {showPpsModal && (
          <PositivePayRegistryModal onClose={() => setShowPpsModal(false)} />
        )}
      </main>
    </div>
  );
}
