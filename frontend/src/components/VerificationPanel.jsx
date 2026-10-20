import React, { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { authenticateWithWebAuthn } from "../utils/webauthn.util";
import { sovereignAudio } from "../utils/settlement-sound.util";

const COMMON_REASONS = [
  { code: "01", label: "01: Insufficient funds" },
  { code: "02", label: "02: Signature mismatch" },
  { code: "03", label: "03: Account closed" },
  { code: "04", label: "04: Stale / Post-dated" },
  { code: "05", label: "05: Words & figures differ" },
  { code: "06", label: "06: Maker-Checker rejected" },
  { code: "30", label: "30: Positive Pay Mismatch" },
];

export default function VerificationPanel({ cheque, onUpdated, layout = "compact" }) {
  const { user } = useAuth();
  const [reasonCodes, setReasonCodes] = useState({});
  const [selectedReason, setSelectedReason] = useState("01");
  const [remarks, setRemarks] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get("/clearing/return-reason-codes")
      .then(({ data }) => setReasonCodes(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") setShowReturnModal(false);
    }
    if (showReturnModal) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [showReturnModal]);

  async function transition(toStatus, returnReason = selectedReason) {
    setError("");
    if (toStatus === "RETURNED" && !returnReason) {
      setError("Please select a statutory return reason code");
      return;
    }
    setBusy(true);
    try {
      let fido2Proof = null;
      // High-Value Statutory Clearance (> ₹10 Lakhs) requires FIDO2 / WebAuthn Hardware Token
      if (toStatus === "CLEARED" && Number(cheque.amount) >= 1000000) {
        fido2Proof = await authenticateWithWebAuthn({
          username: user?.email || "checker@hdb.com",
          amount: Number(cheque.amount),
          action: "CLEAR_HIGH_VALUE_INSTRUMENT",
        });
      }

      const { data } = await client.patch(`/clearing/${cheque.id}/transition`, {
        toStatus,
        returnReasonCode: toStatus === "RETURNED" ? returnReason : undefined,
        remarks: remarks || (fido2Proof ? `FIDO2 Hardware Authenticated [${fido2Proof.credentialId.slice(0, 16)}...]` : undefined),
      });

      if (toStatus === "CLEARED") {
        sovereignAudio.playSettlementChime(Number(cheque.amount));
      }

      setShowReturnModal(false);
      onUpdated?.(data);
    } catch (err) {
      setError(err.response?.data?.error || "Clearing transition failed");
    } finally {
      setBusy(false);
    }
  }

  const isHighRiskOrValue = Number(cheque.amount) >= 100000 || cheque.riskTier === "HIGH";

  const nextActions = {
    PRESENTED: ["VERIFIED", "CLEARED", "RETURNED"],
    VERIFIED: ["CLEARED", "RETURNED"],
    AWAITING_CHECKER: ["CLEARED", "RETURNED"],
  }[cheque.status] || [];

  if (nextActions.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <span>Workflow Complete</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${layout === "compact" ? "min-w-[200px]" : "w-full"}`}>
      {error && (
        <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded flex items-center gap-1">
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {cheque.status === "AWAITING_CHECKER" && (
        <div className="text-[10px] text-purple-800 bg-purple-50 border border-purple-200 px-2 py-1 rounded flex items-center gap-1.5 font-medium">
          <span>Checker Sign-off Required</span>
        </div>
      )}

      {/* 3 Action Buttons Deck */}
      <div className={`flex ${layout === "compact" ? "flex-row flex-nowrap" : "flex-wrap"} gap-1.5`}>
        {/* Option 1: Verify */}
        {nextActions.includes("VERIFIED") && (
          <button
            type="button"
            disabled={busy}
            onClick={() => transition("VERIFIED")}
            className="flex-1 inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Perform Maker verification (routes to Checker if high-value/risk)"
          >
            <span>{isHighRiskOrValue ? "Verify (Send to Checker)" : "Verify"}</span>
          </button>
        )}

        {/* Option 2: Clear & Settle (e-Kuber) */}
        {nextActions.includes("CLEARED") && (
          <button
            type="button"
            disabled={busy}
            onClick={() => transition("CLEARED")}
            className={`flex-1 inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap ${
              cheque.status === "AWAITING_CHECKER"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            title="Approve instrument and trigger instant e-Kuber realization"
          >
            <span>{cheque.status === "AWAITING_CHECKER" ? "Authorize & Clear" : "Clear & Settle"}</span>
          </button>
        )}

        {/* Option 3: Return / Dishonour Cheque */}
        {nextActions.includes("RETURNED") && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowReturnModal(true)}
            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Dishonour instrument and issue statutory return memo"
          >
            <span>Return</span>
          </button>
        )}
      </div>

      {/* Clean Statutory Return Modal */}
      {showReturnModal && (
        <div
          onClick={() => setShowReturnModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-800 text-left text-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm">Statutory Cheque Dishonour</h3>
                <p className="text-[11px] text-slate-400">Section 138 Negotiable Instruments Act, 1881</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-500 text-[10px]">INSTRUMENT</div>
                  <div className="font-mono font-bold text-white">Cheque #{cheque.chequeNumber}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">PAYEE</div>
                  <div className="font-semibold text-slate-200">{cheque.payeeName}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-[10px]">AMOUNT</div>
                  <div className="font-mono font-bold text-cyan-400">₹{Number(cheque.amount).toLocaleString("en-IN")}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select RBI Clearing Return Reason Code:
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {COMMON_REASONS.map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => setSelectedReason(r.code)}
                      className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        selectedReason === r.code
                          ? "bg-rose-600 text-white font-bold"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-750"
                      }`}
                    >
                      {r.code}
                    </button>
                  ))}
                </div>

                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-xs bg-slate-950 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {Object.entries(reasonCodes).map(([code, label]) => (
                    <option key={code} value={code}>
                      Code {code}: {label}
                    </option>
                  ))}
                  <option value="30">Code 30: Positive Pay System Mismatch / Alteration Suspected</option>
                  <option value="88">Code 88: Clearing Window Cut-off Breached</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bank Return Remarks / Auditor Note:
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Insufficient cleared balance in account"
                  className="w-full border border-slate-700 bg-slate-950 text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-lg text-[11px] text-amber-200 leading-snug">
                Confirming this dishonour generates a Section 138 statutory return memo.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => transition("RETURNED")}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {busy ? "Dishonouring..." : "Confirm Statutory Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
