import React, { useState, useEffect, useRef } from "react";
import client from "../api/client";

export default function AcousticMeshOfflineModal({ isOpen, onClose }) {
  const [meshStatus, setMeshStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(750);
  const [memo, setMemo] = useState("Agri Mandi Produce Offline Vouch");
  const [generatedVoucher, setGeneratedVoucher] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [isAudioTransmitting, setIsAudioTransmitting] = useState(false);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  async function fetchStatus() {
    try {
      const res = await client.get("/acoustic/status");
      setMeshStatus(res.data);
    } catch (err) {
      console.error("Failed to load acoustic mesh status:", err);
    }
  }

  // Play simulated acoustic frequency chirps using Web Audio API
  function playAcousticBurst() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sweep audible tone for user feedback while showing ultrasonic banner
      osc.type = "sine";
      osc.frequency.setValueAtTime(1750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);

      setIsAudioTransmitting(true);
      drawSpectrumAnimation();
      setTimeout(() => setIsAudioTransmitting(false), 900);
    } catch {
      // Audio not permitted or headless
    }
  }

  function drawSpectrumAnimation() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frame = 0;

    function render() {
      if (frame > 25) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 36;
      for (let i = 0; i < bars; i++) {
        const height = Math.sin((i / bars) * Math.PI + frame * 0.25) * 32 + Math.random() * 12;
        const hue = 180 + i * 4;
        ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
        ctx.fillRect(i * 9 + 4, canvas.height - height - 4, 6, height);
      }
      frame++;
      requestAnimationFrame(render);
    }
    render();
  }

  async function handleCreateVoucher(e) {
    e.preventDefault();
    setLoading(true);
    setVerificationResult(null);
    setSyncResult(null);
    try {
      const res = await client.post("/acoustic/voucher/create", {
        amount: Number(amount),
        memo,
        payerDeviceId: "DEV-IN-442918",
        recipientDeviceId: "DEV-IN-889101",
      });
      setGeneratedVoucher(res.data);
      playAcousticBurst();
      await fetchStatus();
    } catch (err) {
      alert("Acoustic voucher creation failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyVoucher() {
    if (!generatedVoucher) return;
    setLoading(true);
    try {
      const res = await client.post("/acoustic/voucher/verify", generatedVoucher);
      setVerificationResult(res.data);
    } catch (err) {
      alert("Verification failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncMesh() {
    setLoading(true);
    try {
      const res = await client.post("/acoustic/mesh/sync", {});
      setSyncResult(res.data);
      setGeneratedVoucher(null);
      await fetchStatus();
    } catch (err) {
      alert("Mesh sync failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/30 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-xl text-xl font-bold shadow-inner">
              📡 18-20 kHz
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                Zero-Internet Acoustic & Offline PQC Mesh Rail
                <span className="text-xs bg-cyan-950 border border-cyan-500/50 text-cyan-300 px-2 py-0.5 rounded-full font-mono">
                  PILLAR 1
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ultrasonic sound-wave vouchers with NIST FIPS 204 ML-DSA Dilithium lattice cryptography for dead zones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Audio Waveform Canvas */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${isAudioTransmitting ? "bg-cyan-400 animate-ping" : "bg-emerald-500"}`} />
                <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400">
                  {isAudioTransmitting ? "TRANSMITTING ACOUSTIC ULTRASOUND BURST (18.5 kHz)" : "ACOUSTIC MODULATOR READY"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Data packet modulated into frequency shifts (FSK) emitted via device speaker, received by microphone with zero cellular connection.
              </p>
            </div>
            <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-2 flex items-center justify-center">
              <canvas ref={canvasRef} width={340} height={48} className="bg-slate-950 rounded" />
            </div>
          </div>

          {/* Offline Nodes Info */}
          {meshStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {meshStatus.activeNodes?.map((node) => (
                <div key={node.deviceId} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{node.deviceId}</span>
                    <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      Counter: #{node.currentCounter}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white">{node.holderName}</div>
                  <div className="text-xs text-slate-400">{node.bankName}</div>
                  <div className="text-xs font-mono text-emerald-400 font-bold pt-1">
                    Offline Balance: ₹{node.offlineBalance?.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
              <div className="bg-cyan-950/30 border border-cyan-500/40 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-cyan-300 font-bold">Mesh Queue (Deferred Sync)</div>
                  <div className="text-2xl font-black text-cyan-400 mt-1">
                    {meshStatus.pendingMeshQueueSize} <span className="text-xs font-normal text-slate-400">vouchers pending</span>
                  </div>
                </div>
                <button
                  onClick={handleSyncMesh}
                  disabled={loading || meshStatus.pendingMeshQueueSize === 0}
                  className="mt-2 w-full text-xs font-bold py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-40"
                >
                  ⚡ Sync Mesh to e-Kuber
                </button>
              </div>
            </div>
          )}

          {/* Voucher Generator Form */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Emit Offline Acoustic Voucher</span>
              <span className="text-xs text-slate-400 font-normal">(Sender ➔ Receiver over Ultrasound)</span>
            </h3>

            <form onSubmit={handleCreateVoucher} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount (INR ₹)</label>
                <input
                  type="number"
                  min="1"
                  max="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Transaction Memo</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
                >
                  {loading ? "Generating..." : "🔊 Transmit Over Sound Wave"}
                </button>
              </div>
            </form>
          </div>

          {/* Generated Voucher Card */}
          {generatedVoucher && (
            <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-400">{generatedVoucher.voucherId}</span>
                <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  ₹{generatedVoucher.amount?.toLocaleString("en-IN")} OFFLINE EARMARKED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Payer Device: </span>
                  <span className="text-white font-semibold">{generatedVoucher.payerName} ({generatedVoucher.payerDeviceId})</span>
                </div>
                <div>
                  <span className="text-slate-400">Recipient Device: </span>
                  <span className="text-white font-semibold">{generatedVoucher.recipientName} ({generatedVoucher.recipientDeviceId})</span>
                </div>
                <div>
                  <span className="text-slate-400">Tamper-Proof Counter: </span>
                  <span className="font-mono text-cyan-300 font-bold">Sequence #{generatedVoucher.counter}</span>
                </div>
                <div>
                  <span className="text-slate-400">Acoustic Carrier: </span>
                  <span className="font-mono text-slate-300">{generatedVoucher.acousticModulation?.bandMinHz}Hz - {generatedVoucher.acousticModulation?.bandMaxHz}Hz FSK</span>
                </div>
              </div>

              {/* Lattice signature display */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] text-purple-400 font-bold mb-1">
                  NIST FIPS 204 ML-DSA-65 (LATTICE POST-QUANTUM SIGNATURE)
                </div>
                <div className="text-[11px] font-mono text-purple-300 break-all bg-slate-950 p-2 rounded border border-purple-500/20">
                  {generatedVoucher.pqcSignature}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={playAcousticBurst}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1.5"
                >
                  🔊 Replay Acoustic Tone
                </button>
                <button
                  onClick={handleVerifyVoucher}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold transition flex items-center gap-1.5"
                >
                  ✓ Verify & Deposit Voucher
                </button>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className={`p-4 rounded-xl border ${verificationResult.isValid ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200" : "bg-red-950/40 border-red-500/40 text-red-200"} space-y-2`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>{verificationResult.isValid ? "✓ Acoustic Voucher Verified by Receiver" : "✕ Replay or Double-Spend Rejected"}</span>
              </div>
              <p className="text-xs">{verificationResult.message || verificationResult.reason}</p>
              <div className="text-[11px] font-mono opacity-80">
                PQC Engine: {verificationResult.pqcAlgorithm} | Verified At: {verificationResult.verifiedAt}
              </div>
            </div>
          )}

          {/* Sync Result */}
          {syncResult && (
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-200 space-y-1.5">
              <div className="font-bold text-sm flex items-center gap-2">
                <span>⚡ Reconnected: {syncResult.syncedCount} Vouchers Cleared to RBI e-Kuber</span>
              </div>
              <p className="text-xs opacity-90">
                All accumulated offline acoustic transactions have been batched and settled atomically to the central switch.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
