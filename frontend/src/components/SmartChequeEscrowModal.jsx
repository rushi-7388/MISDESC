import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function SmartChequeEscrowModal({ cheque, onClose }) {
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState(null);
  const [lienData, setLienData] = useState(null);
  const [acting, setActing] = useState(false);
  const [cbdcReceipt, setCbdcReceipt] = useState(null);

  const loadContract = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/smart-cheques/contracts/${cheque.id}`);
      setContractData(res.data.contract);
      setLienData(res.data.lien);
    } catch (err) {
      console.error("Failed to load smart contract:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cheque?.id) {
      loadContract();
    }
  }, [cheque]);

  const handleEarmarkLien = async () => {
    try {
      setActing(true);
      const res = await client.post("/smart-cheques/lien/earmark", {
        chequeId: cheque.id,
        amount: cheque.amount,
        drawerAccount: cheque.accountNumber || "123456789012",
      });
      setLienData(res.data.lien);
    } catch (err) {
      alert("Failed to earmark micro-lien: " + (err.response?.data?.error || err.message));
    } finally {
      setActing(false);
    }
  };

  const handleReleaseMilestone = async (stepId) => {
    try {
      setActing(true);
      const res = await client.post(`/smart-cheques/contracts/${cheque.id}/release-milestone`, { stepId });
      setContractData(res.data.contract);
    } catch (err) {
      alert("Milestone release failed: " + (err.response?.data?.error || err.message));
    } finally {
      setActing(false);
    }
  };

  const handleSettleCbdc = async () => {
    try {
      setActing(true);
      const res = await client.post("/smart-cheques/cbdc/settle", {
        chequeId: cheque.id,
        amount: cheque.amount,
        walletId: "WLT-RBI-eINR-992144",
      });
      setCbdcReceipt(res.data.receipt);
      await loadContract();
    } catch (err) {
      alert("CBDC settlement failed: " + (err.response?.data?.error || err.message));
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-lg shadow-inner">
              ⚡
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Programmable Smart Cheque & CBDC e-Rupee Bridge
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Smart Contract & Escrow Engine · Cheque #{cheque.chequeNumber}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-amber-400 animate-pulse">Loading programmable escrow rules...</p>
            </div>
          ) : (
            <>
              {/* Micro-Lien Earmarking Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>🔒 Real-Time Cryptographic Micro-Lien</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                        0% BOUNCE RISK GUARANTEED
                      </span>
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Locks funds in drawer's CBS account the instant the cheque enters the clearing cycle.
                    </p>
                  </div>

                  {!lienData && (
                    <button
                      type="button"
                      onClick={handleEarmarkLien}
                      disabled={acting}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
                    >
                      Earmark Micro-Lien
                    </button>
                  )}
                </div>

                {lienData && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lien Reference:</span>
                      <span className="text-amber-400 font-bold">{lienData.lienId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Earmarked Sum:</span>
                      <span className="text-white font-bold">₹{Number(lienData.earmarkedAmount).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CBS Hold ID:</span>
                      <span className="text-cyan-400">{lienData.cbsLockReference}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Automated Tax / GST Split Routing */}
              {contractData?.splitRouting && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-sm text-white">
                    Automated Split Routing (Vendor Net vs GST Tax Escrow)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">
                        Vendor Net Payout (82%)
                      </span>
                      <span className="text-base font-bold text-emerald-400 block">
                        ₹{Number(contractData.splitRouting.vendorBeneficiary.netPayoutAmount).toLocaleString("en-IN")}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate block">
                        To: {contractData.splitRouting.vendorBeneficiary.accountName}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-sans">
                        Statutory GST Escrow (18%)
                      </span>
                      <span className="text-base font-bold text-amber-400 block">
                        ₹{Number(contractData.splitRouting.statutoryTaxEscrow.taxDeductedAmount).toLocaleString("en-IN")}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate block">
                        Challan: {contractData.splitRouting.statutoryTaxEscrow.taxChallanRef}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Milestone Escrow */}
              {contractData?.milestones && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-sm text-white">
                    Conditional Milestone Escrow Releases
                  </h3>
                  <div className="space-y-2">
                    {contractData.milestones.map((m) => (
                      <div
                        key={m.stepId}
                        className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{m.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.status === "SATISFIED"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                                  : "bg-amber-950 text-amber-300 border border-amber-700"
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Share: {m.payoutPercent}% (₹{Number(m.amount).toLocaleString("en-IN")})
                          </span>
                        </div>

                        {m.status !== "SATISFIED" && (
                          <button
                            type="button"
                            onClick={() => handleReleaseMilestone(m.stepId)}
                            disabled={acting}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
                          >
                            Release Tranche
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CBDC e-Rupee Atomic Settlement Banner */}
              {cbdcReceipt && (
                <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 text-xs">
                      ✓ Settled via Central Bank Digital Currency (e₹ Wholesale)
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300">
                      Token ID: {cbdcReceipt.digitalTokenId}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 space-y-1">
                    <div>CBDC TXN: {cbdcReceipt.cbdcTxId}</div>
                    <div className="truncate">Token Hash: {cbdcReceipt.cryptographicTokenHash}</div>
                    <div>Finality: {cbdcReceipt.atomicFinality}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Amount: ₹{Number(cheque.amount).toLocaleString("en-IN")}
          </span>

          <button
            type="button"
            onClick={handleSettleCbdc}
            disabled={acting || contractData?.cbdcSettled}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              contractData?.cbdcSettled
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-lg"
            }`}
          >
            {contractData?.cbdcSettled ? "✓ Settle Complete (e₹ Token)" : "⚡ Atomic Settle with e-Rupee (CBDC)"}
          </button>
        </div>
      </div>
    </div>
  );
}
