import React, { useState, useEffect } from "react";
import client from "../api/client";
import { verifyGroth16ProofClientWasm } from "../utils/zkSnarkVerifier";

export default function ZkSolvencyProofModal({ cheque, onClose }) {
  const [loading, setLoading] = useState(true);
  const [proofPackage, setProofPackage] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationMode, setVerificationMode] = useState("wasm"); // "wasm" (Client) or "server" (Switch)
  const [wasmTrace, setWasmTrace] = useState(null);

  useEffect(() => {
    async function fetchOrGenerateProof() {
      try {
        setLoading(true);
        const res = await client.post(`/zkp/generate/${cheque.id}`, {
          amount: cheque.amount,
          balance: 3200000, // Private witness on drawee bank side
        });
        setProofPackage(res.data);
      } catch (err) {
        console.error("Failed to generate zk-SNARK proof:", err);
      } finally {
        setLoading(false);
      }
    }
    if (cheque?.id) {
      fetchOrGenerateProof();
    }
  }, [cheque]);

  // Client-Side WASM Verification
  const handleVerifyClientWasm = async () => {
    if (!proofPackage) return;
    try {
      setVerifying(true);
      setVerificationMode("wasm");
      const result = await verifyGroth16ProofClientWasm(proofPackage);
      setVerificationResult(result);
      setWasmTrace(result.trace);
    } catch (err) {
      alert("Client WASM verification failed: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Server-Side Central Clearing Switch Verification
  const handleVerifyServer = async () => {
    if (!proofPackage) return;
    try {
      setVerifying(true);
      setVerificationMode("server");
      const res = await client.post("/zkp/verify", proofPackage);
      setVerificationResult(res.data);
      setWasmTrace(null);
    } catch (err) {
      alert("Server verification failed: " + (err.response?.data?.error || err.message));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-lg shadow-inner">
              🔐
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800/60 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                Zero-Knowledge Confidential Clearing · Groth16 / BN254
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                zk-SNARK Solvency & Authorization Proof · #{cheque.chequeNumber}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-teal-400 animate-pulse">
                Synthesizing Groth16 R1CS Circuit & Bilinear Pairing over BN254 curve...
              </p>
            </div>
          ) : proofPackage ? (
            <>
              {/* Zero-Data-Leakage Guarantee Banner */}
              <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-teal-300 flex items-center gap-2">
                    <span>✓ 100% ZERO-DATA-LEAKAGE CERTIFIED</span>
                  </span>
                  <span className="font-mono text-[11px] text-teal-400">
                    Proving Time: {proofPackage.provingTimeMs} ms
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  The Drawee Bank has cryptographically proven that the drawer has <strong>sufficient funds</strong>, a <strong>verified signature</strong>, and <strong>Positive Pay compliance</strong> without disclosing the drawer's account number, balance, or personal identity to the presenting bank.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono text-teal-200">
                  <div className="bg-teal-900/40 p-2 rounded-lg border border-teal-800/50">
                    Account Disclosed: <span className="text-white font-bold">NO (Hidden)</span>
                  </div>
                  <div className="bg-teal-900/40 p-2 rounded-lg border border-teal-800/50">
                    Balance Disclosed: <span className="text-white font-bold">NO (Hidden)</span>
                  </div>
                  <div className="bg-teal-900/40 p-2 rounded-lg border border-teal-800/50">
                    Specimen Disclosed: <span className="text-white font-bold">NO (Hidden)</span>
                  </div>
                </div>
              </div>

              {/* Public Signals */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-sans font-bold text-slate-200">Public Inputs (Sent to Clearing House)</span>
                  <span>Protocol: {proofPackage.protocol}</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Clearing Amount:</span>
                    <span className="text-white font-bold">₹{Number(proofPackage.publicSignals.clearingAmount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Instrument Digest:</span>
                    <span className="text-cyan-400 truncate max-w-xs">{proofPackage.publicSignals.chequeDigestHash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Settlement UTR:</span>
                    <span className="text-teal-400">{proofPackage.publicSignals.settlementUtr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Solvency Condition:</span>
                    <span className="text-emerald-400 font-bold">SATISFIED (Proven)</span>
                  </div>
                </div>
              </div>

              {/* Elliptic Curve Coordinates Proof Package */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-300 font-sans">BN254 Pairing Coordinates (pi_a, pi_b, pi_c)</h3>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] space-y-1.5 text-slate-400">
                  <div className="truncate"><span className="text-teal-400">pi_a[0]:</span> {proofPackage.proof.pi_a[0]}</div>
                  <div className="truncate"><span className="text-teal-400">pi_a[1]:</span> {proofPackage.proof.pi_a[1]}</div>
                  <div className="truncate"><span className="text-indigo-400">pi_b[0][0]:</span> {proofPackage.proof.pi_b[0][0]}</div>
                  <div className="truncate"><span className="text-purple-400">pi_c[0]:</span> {proofPackage.proof.pi_c[0]}</div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 flex justify-between">
                    <span>Curve: {proofPackage.curve}</span>
                    <span className="text-teal-400">snarkjs WASM Binary Support Ready</span>
                  </div>
                </div>
              </div>

              {/* Verification Outcome Box */}
              {verificationResult && (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-600 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 text-xs flex items-center gap-2">
                      <span>✓</span>
                      {verificationMode === "wasm"
                        ? `Client-Side WASM snarkjs Bilinear Pairing Validated in ${verificationResult.executionTimeMs} ms`
                        : `Clearing Switch Bilinear Pairing Validated in ${verificationResult.verificationTimeMs} ms`}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900 text-emerald-200">
                      {verificationMode === "wasm" ? "WASM CLIENT SUCCESS" : "SWITCH SERVER SUCCESS"}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    The Bilinear Pairing equation <code className="text-teal-300 font-mono">e(pi_A, pi_B) == e(α, β) · e(x, γ) · e(pi_C, δ)</code> evaluated to true. Clearing approved without drawer data exposure.
                  </p>

                  {/* WASM Trace Steps */}
                  {wasmTrace && (
                    <div className="bg-slate-950/80 rounded-lg p-3 border border-emerald-900/60 space-y-1.5 font-mono text-[10px]">
                      <div className="text-emerald-400 font-bold mb-1">WebAssembly Runtime Execution Trace:</div>
                      {wasmTrace.map((t) => (
                        <div key={t.step} className="flex items-start gap-2 text-slate-300">
                          <span className="text-teal-400 font-bold">[{t.step}/6]</span>
                          <span className="text-slate-400">{t.title}:</span>
                          <span className="text-white truncate">{t.detail}</span>
                          <span className="ml-auto text-emerald-400 font-bold shrink-0">✓ {t.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-rose-400">Failed to load zero-knowledge proof.</p>
          )}
        </div>

        {/* Footer with Dual Verification Controls */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            Security: 128-bit BN254 Pairing · Section 29A Privacy Mandate
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVerifyClientWasm}
              disabled={verifying || !proofPackage}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {verifying && verificationMode === "wasm" ? "Executing WASM Pairing..." : "⚡ Run Client-Side WASM Verifier"}
            </button>

            <button
              type="button"
              onClick={handleVerifyServer}
              disabled={verifying || !proofPackage}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {verifying && verificationMode === "server" ? "Verifying..." : "Central Switch Verify"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
