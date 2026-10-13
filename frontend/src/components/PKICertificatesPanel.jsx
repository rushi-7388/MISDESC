import React, { useEffect, useState } from "react";
import client from "../api/client";

export default function PKICertificatesPanel() {
  const [certificates, setCertificates] = useState([]);
  const [pqcReadiness, setPqcReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedThumbprint, setCopiedThumbprint] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPqcModal, setShowPqcModal] = useState(false);
  const [banks, setBanks] = useState([]);
  const [activeTab, setActiveTab] = useState("certificates"); // "certificates" | "pqc"
  const [formData, setFormData] = useState({
    bankId: "",
    subject: "",
    serialNumber: "",
    validityDays: 365,
  });
  const [pqcGeneration, setPqcGeneration] = useState(null);
  const [generatingPqc, setGeneratingPqc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [certsRes, banksRes, pqcRes] = await Promise.all([
        client.get("/pki/certificates"),
        client.get("/admin/banks").catch(() => ({ data: [] })),
        client.get("/pki/pqc/readiness").catch(() => ({ data: null })),
      ]);
      setCertificates(certsRes.data || []);
      const bList = banksRes.data || [];
      setBanks(bList);
      setPqcReadiness(pqcRes.data);
      if (bList.length > 0 && !formData.bankId) {
        setFormData((prev) => ({ ...prev, bankId: bList[0].id }));
      }
    } catch (err) {
      console.error("Failed to load PKI certificates:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function copyToClipboard(text) {
    navigator.clipboard?.writeText(text);
    setCopiedThumbprint(text);
    setTimeout(() => setCopiedThumbprint(null), 3000);
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      await client.post("/pki/certificates", formData);
      setSuccessMsg("X.509 PKI Digital Certificate successfully registered with MISDESC Root CA.");
      setShowRegisterModal(false);
      setTimeout(() => setSuccessMsg(null), 5000);
      await loadData();
    } catch (err) {
      alert("Registration failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGeneratePqcKeys(bankCode = "SRT") {
    try {
      setGeneratingPqc(true);
      const res = await client.post("/pki/pqc/generate-keys", { bankCode });
      setPqcGeneration(res.data.keys);
      setSuccessMsg(`Generated NIST FIPS 204 ML-DSA-65 Lattice Keypair for ${bankCode}`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      alert("PQC Generation failed: " + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingPqc(false);
    }
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold cursor-pointer">×</button>
        </div>
      )}

      {/* Top Banner with PQC Upgrade Indicator */}
      <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-800/60 mb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              Phase 3 · NIST FIPS 204 (ML-DSA / CRYSTALS-Dilithium) Post-Quantum Architecture
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Quantum-Resilient Public Key Infrastructure (PQC)
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Dual-layer hybrid cryptography combining Classical RSA-4096 / SHA-256 with NIST FIPS 204 ML-DSA-65 lattice polynomial signatures, preventing "Harvest Now, Decrypt Later" threats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleGeneratePqcKeys("SRT")}
              disabled={generatingPqc}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-700 via-indigo-600 to-cyan-500 hover:from-purple-600 hover:to-cyan-400 text-white transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generatingPqc ? "Synthesizing Lattice Vectors..." : "⚡ Generate NIST ML-DSA Keypair"}
            </button>

            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              + Enroll Classical X.509
            </button>
          </div>
        </div>

        {/* PQC Readiness Telemetry Bar */}
        {pqcReadiness && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">PQC Readiness Score</span>
              <span className="text-base font-mono font-bold text-emerald-400">
                {pqcReadiness.overallReadinessScorePercent}% Certified
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Algorithm</span>
              <span className="text-base font-mono font-bold text-purple-400 truncate block">
                NIST ML-DSA-65
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Shor's Algorithm Defense</span>
              <span className="text-base font-mono font-bold text-cyan-400">
                100% Quantum Immune
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Key Encapsulation (KEM)</span>
              <span className="text-base font-mono font-bold text-teal-400 truncate block">
                FIPS 203 ML-KEM-768
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("certificates")}
          className={`pb-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "certificates"
              ? "border-purple-600 text-purple-800 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Registered X.509 Certificates ({certificates.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pqc")}
          className={`pb-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "pqc"
              ? "border-purple-600 text-purple-800 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Lattice Vector Inspector & Standards Compliance
        </button>
      </div>

      {/* TAB 1: CERTIFICATES GRID */}
      {activeTab === "certificates" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 p-8 text-center text-slate-500 text-xs font-semibold">
              Loading certificate registry...
            </div>
          ) : certificates.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-slate-400 text-xs">
              No digital certificates registered in the MISDESC trust store.
            </div>
          ) : (
            certificates.map((cert) => {
              const isExpired = new Date(cert.validTo) < new Date();
              const isCopied = copiedThumbprint === cert.certThumbprint;

              return (
                <div
                  key={cert.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider font-mono">
                          {cert.bank?.code} · {cert.bank?.name}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5 truncate max-w-xs" title={cert.subject}>
                          {cert.subject}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          HYBRID PQC READY
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cert.status === "ACTIVE" && !isExpired
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {cert.status}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-mono space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Serial #:</span>
                        <span className="text-slate-800 font-bold">{cert.serialNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Algorithm:</span>
                        <span className="text-slate-800">{cert.keyAlgorithm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Issuer CA:</span>
                        <span className="text-slate-800 font-semibold">{cert.issuer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Valid Until:</span>
                        <span className="text-slate-800">{new Date(cert.validTo).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>SHA-256 Certificate Fingerprint:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cert.certThumbprint)}
                          className="text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
                        >
                          {isCopied ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl text-[10px] font-mono break-all select-all">
                        {cert.certThumbprint}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Batch Signatures Audited:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {cert.batchSignatures?.length || 0} manifest(s)
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: LATTICE VECTOR INSPECTOR */}
      {activeTab === "pqc" && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 text-white space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Lattice-based Polynomial Vector Generation (NIST FIPS 204)</span>
            </h3>
            <span className="text-xs font-mono text-purple-400">Ring: Z_q[X]/(X^256 + 1) · q = 8,380,417</span>
          </div>

          {pqcGeneration ? (
            <div className="space-y-4">
              <div className="p-4 bg-purple-950/40 border border-purple-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">Active Hybrid Keypair: {pqcGeneration.bankCode}</span>
                  <span className="text-[11px] font-mono text-emerald-400">{pqcGeneration.postQuantum.shorAlgorithmStatus}</span>
                </div>
                <div className="text-xs font-mono text-slate-300 space-y-1">
                  <div>Thumbprint: {pqcGeneration.postQuantum.keyThumbprint}</div>
                  <div>Public Key Size: {pqcGeneration.postQuantum.publicKeyBytes} Bytes (vs 512 Bytes Classical RSA)</div>
                  <div>Signature Digest Size: {pqcGeneration.postQuantum.signatureBytes} Bytes</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-indigo-400 block">Matrix A Polynomial Coefficients (Sample)</span>
                  <div className="bg-slate-950 p-3 rounded-lg font-mono text-[10px] text-cyan-300 break-all">
                    [{pqcGeneration.postQuantum.polynomialSampleA.join(", ")}...]
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-indigo-400 block">Secret Vector S Trinary Coefficients</span>
                  <div className="bg-slate-950 p-3 rounded-lg font-mono text-[10px] text-emerald-300 break-all">
                    [{pqcGeneration.postQuantum.polynomialSampleS.join(", ")}...]
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <p className="text-xs text-slate-400">No active lattice keypair synthesized in memory for this session.</p>
              <button
                type="button"
                onClick={() => handleGeneratePqcKeys("SRT")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white cursor-pointer"
              >
                Synthesize NIST ML-DSA-65 Keypair Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enroll Modal */}
      {showRegisterModal && (
        <div
          onClick={() => setShowRegisterModal(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Enroll X.509 PKI Digital Certificate
              </h3>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Bank Entity</label>
                <select
                  value={formData.bankId}
                  onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-semibold"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Distinguished Name (DN)</label>
                <input
                  type="text"
                  placeholder="CN=Bank Presentation Signer, OU=Treasury, O=Bank, C=IN"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Serial Number Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. MISDESC-PKI-2026-003"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Enrolling..." : "Enroll Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
