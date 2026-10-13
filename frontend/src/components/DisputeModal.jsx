import React, { useState } from "react";
import client from "../api/client";

const DISPUTE_TYPES = [
  { value: "UNAUTHORIZED_DEBIT", label: "Unauthorized Debit / Alleged Fraud" },
  { value: "FORGED_SIGNATURE", label: "Forged / Tampered Signature Specimen" },
  { value: "AMOUNT_MISMATCH", label: "Amount Words vs Figures Discrepancy" },
  { value: "DUPLICATE_PRESENTATION", label: "Duplicate Instrument Clearing" },
  { value: "LATE_RETURN", label: "Statutory Return Window Cutoff Breach" },
  { value: "PPS_BREACH", label: "Positive Pay System Validation Breach" },
];

export default function DisputeModal({ cheque, onClose, onSubmitted }) {
  const [disputeType, setDisputeType] = useState("UNAUTHORIZED_DEBIT");
  const [claimAmount, setClaimAmount] = useState(cheque?.amount || "");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!cheque) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!evidenceNotes.trim()) {
      setError("Please describe the dispute grounds and regulatory basis.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await client.post("/disputes", {
        chequeId: cheque.id,
        disputeType,
        claimAmount: claimAmount ? Number(claimAmount) : Number(cheque.amount),
        evidenceNotes,
      });

      onSubmitted?.(res.data.dispute);
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              NPCI MISDESC DRM · Rule 32
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-1">
              File Clearing Dispute & Chargeback
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Instrument #:</span>
            <span className="font-mono font-bold text-slate-900">#{cheque.chequeNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Original Amount:</span>
            <span className="font-mono font-bold text-slate-900">
              ₹{Number(cheque.amount).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payee Name:</span>
            <span className="font-semibold text-slate-800">{cheque.payeeName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Statutory Dispute Reason
            </label>
            <select
              value={disputeType}
              onChange={(e) => setDisputeType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-amber-600 font-semibold"
            >
              {DISPUTE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Disputed Claim Amount (₹ INR)
            </label>
            <input
              type="number"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-amber-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Evidentiary Statement & Mandate Discrepancies
            </label>
            <textarea
              rows={3}
              placeholder="State explicit evidence: e.g. Customer affidavit regarding forged endorsement or duplicate clearing debit trace..."
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-amber-600 resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Submitting this claim triggers an immediate 72-hour regulatory resolution timer under the Clearing House Arbitration Rules.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs disabled:opacity-50"
            >
              {submitting ? "Lodging Claim..." : "Lodge Dispute Claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
