import React, { useEffect, useState } from "react";
import client from "../api/client";

export default function BatchManagementPanel() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSessionName, setNewSessionName] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  async function loadBatches() {
    try {
      const res = await client.get("/batches");
      setBatches(res.data);
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  async function handleCreateBatch(e) {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    setCreating(true);
    try {
      await client.post("/batches", { sessionName: newSessionName });
      setNewSessionName("");
      setActionMessage("Clearing session opened successfully.");
      loadBatches();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleLock(id) {
    try {
      await client.patch(`/batches/${id}/lock`);
      setActionMessage("Session locked. Reconciling batch totals...");
      loadBatches();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage(`Failed to lock session: ${err.response?.data?.error || err.message}`);
    }
  }

  async function handleProcess(id) {
    try {
      const res = await client.post(`/batches/${id}/process`);
      setActionMessage(res.data.message || "Batch processed successfully.");
      loadBatches();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionMessage(`Failed to process batch: ${err.response?.data?.error || err.message}`);
    }
  }

  async function handleSignBatch(id) {
    try {
      const res = await client.post(`/pki/batches/${id}/sign`);
      setActionMessage(`Batch manifest digitally signed with X.509 Certificate #${res.data.signature.certificate.serialNumber}`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      alert("Failed to digitally sign batch: " + (err.response?.data?.error || err.message));
    }
  }

  async function handleVerifyBatchSignature(id) {
    try {
      const res = await client.get(`/pki/batches/${id}/verify`);
      if (res.data.verified) {
        alert(
          `✓ PKI Signature VERIFIED\n\nSession: ${res.data.sessionCode}\nSigner: ${res.data.certificate.bankName}\nIssuer: ${res.data.certificate.issuer}\nSerial: ${res.data.certificate.serialNumber}\nDigest: ${res.data.signatureDigest.slice(0, 32)}...`
        );
      } else {
        alert(`Notice: ${res.data.message || "No valid signature found on this batch"}`);
      }
    } catch (err) {
      alert("Signature verification error: " + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div className="bg-slate-900/90 rounded-2xl shadow-xl border border-slate-800 p-6 space-y-6 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-black text-white">Clearing Batch Sessions</h2>
          <p className="text-xs text-slate-400">
            Clearing batch management and reconciliation sessions
          </p>
        </div>

        <form onSubmit={handleCreateBatch} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. Afternoon Clearing Session"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs w-64 focus:ring-2 focus:ring-cyan-500 outline-none"
          />
          <button
            type="submit"
            disabled={creating || !newSessionName.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-950/40 cursor-pointer"
          >
            {creating ? "Opening..." : "Open New Session"}
          </button>
        </form>
      </div>

      {actionMessage && (
        <div className="bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 px-4 py-2 rounded-xl text-xs font-medium">
          {actionMessage}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-slate-400 text-center py-6">Loading clearing sessions...</div>
      ) : batches.length === 0 ? (
        <div className="text-xs text-slate-400 text-center py-6">No clearing sessions created yet.</div>
      ) : (
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Session Code</th>
                <th className="py-2.5 px-3">Session Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Cheques Count</th>
                <th className="py-2.5 px-3 text-right">Total Volume</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-3 font-mono font-medium text-gray-900">{b.sessionCode}</td>
                  <td className="py-3 px-3 font-medium text-gray-800">{b.sessionName}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.status === "OPEN"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : b.status === "LOCKED"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-gray-600">
                    {b._count?.cheques ?? b.totalCount} cheque(s)
                  </td>
                  <td className="py-3 px-3 font-mono text-gray-900 font-semibold text-right">
                    ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-[11px]">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    {b.status === "OPEN" && (
                      <button
                        type="button"
                        onClick={() => handleLock(b.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                      >
                        Lock Session
                      </button>
                    )}
                    {b.status === "LOCKED" && (
                      <button
                        type="button"
                        onClick={() => handleProcess(b.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
                      >
                        Process Batch
                      </button>
                    )}
                    {b.status === "RECONCILED" && (
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        Reconciled
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSignBatch(b.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer shadow-2xs"
                      title="Digitally sign batch manifest using bank X.509 certificate"
                    >
                      Sign PKI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyBatchSignature(b.id)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                      title="Verify X.509 digital signature"
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
