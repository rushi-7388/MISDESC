import React, { useState } from "react";
import client from "../api/client";

export default function DeepfakeForensicLabModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("voice"); // 'voice' | 'uv'
  const [loading, setLoading] = useState(false);

  // Voice State
  const [callerPhone, setCallerPhone] = useState("+91 98250 11223");
  const [claimedIdentity, setClaimedIdentity] = useState("Hasmukhbhai Patel (Account Holder)");
  const [simulateDeepfakeVoice, setSimulateDeepfakeVoice] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);

  // UV Optical State
  const [chequeNumber, setChequeNumber] = useState("000101");
  const [simulateAlteredCheque, setSimulateAlteredCheque] = useState(false);
  const [uvResult, setUvResult] = useState(null);

  async function handleAnalyzeVoice(e) {
    e.preventDefault();
    setLoading(true);
    setVoiceResult(null);
    try {
      const res = await client.post("/forensics/voice-liveness", {
        callerPhone,
        claimedIdentity,
        sampleLengthSec: 3.5,
        isSimulatedDeepfake: simulateDeepfakeVoice,
      });
      setVoiceResult(res.data.result);
    } catch (err) {
      alert("Voice liveness test failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyzeUv(e) {
    e.preventDefault();
    setLoading(true);
    setUvResult(null);
    try {
      const res = await client.post("/forensics/micro-kerning", {
        chequeNumber,
        isAltered: simulateAlteredCheque,
      });
      setUvResult(res.data.result);
    } catch (err) {
      alert("UV/Kerning scan failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-purple-500/40 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-500/30 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/60 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-xl text-xl font-bold shadow-inner">
              🧬 AI Forensics
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                AI Deepfake, Voice-Clone & Physical Alteration Interceptor
                <span className="text-xs bg-purple-950 border border-purple-500/50 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                  PILLAR 3
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Biological throat-physics acoustic jitter + 365nm multi-spectral UV optical Fourier kerning
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

        {/* Tab Navigator */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          <button
            onClick={() => setActiveTab("voice")}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === "voice"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🎙️ Acoustic Throat-Physics Voice Liveness
          </button>
          <button
            onClick={() => setActiveTab("uv")}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === "uv"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🔦 Multi-Spectral 365nm UV & Fourier Scanner
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === "voice" ? (
            <div className="space-y-6">
              <form onSubmit={handleAnalyzeVoice} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Inbound Caller Phone</label>
                    <input
                      type="text"
                      value={callerPhone}
                      onChange={(e) => setCallerPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Claimed High-Value Mandate Holder</label>
                    <input
                      type="text"
                      value={claimedIdentity}
                      onChange={(e) => setClaimedIdentity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">Simulate AI Neural Vocoder Attack</span>
                    <span className="text-[11px] text-slate-400">Inject ElevenLabs / Tortoise synthetic voice-clone sample</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateDeepfakeVoice}
                      onChange={(e) => setSimulateDeepfakeVoice(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                  >
                    {loading ? "Analyzing Acoustic Physics..." : "🧬 Scan Voice Biometric Liveness"}
                  </button>
                </div>
              </form>

              {voiceResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    voiceResult.deepfakeProbabilityPercent < 25
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                      : "bg-red-950/40 border-red-500/40 text-red-200"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-sm tracking-wide">{voiceResult.livenessStatus}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40">
                      Deepfake Risk: {voiceResult.deepfakeProbabilityPercent}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="opacity-70">Fundamental Pitch (F0):</span>
                      <div className="font-mono font-bold text-white">{voiceResult.vocalTractMetrics?.fundamentalFrequencyF0Hz} Hz</div>
                    </div>
                    <div>
                      <span className="opacity-70">Vocal Cord Jitter:</span>
                      <div className="font-mono font-bold text-white">{voiceResult.vocalTractMetrics?.vocalJitterPercent}%</div>
                    </div>
                    <div>
                      <span className="opacity-70">Vocal Shimmer:</span>
                      <div className="font-mono font-bold text-white">{voiceResult.vocalTractMetrics?.vocalShimmerPercent}%</div>
                    </div>
                    <div>
                      <span className="opacity-70">Formant Coherence:</span>
                      <div className="font-mono font-bold text-white">{voiceResult.vocalTractMetrics?.formantResonanceCoherence}</div>
                    </div>
                  </div>

                  <p className="text-xs opacity-90">{voiceResult.recommendation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleAnalyzeUv} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cheque Instrument Number</label>
                  <input
                    type="text"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">Simulate Chemical Wash & Kerning Alteration</span>
                    <span className="text-[11px] text-slate-400">Simulate acetone bleaching + secondary pen micro-alteration</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateAlteredCheque}
                      onChange={(e) => setSimulateAlteredCheque(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                  >
                    {loading ? "Scanning 365nm UV..." : "🔦 Run 365nm Optical Radar Scan"}
                  </button>
                </div>
              </form>

              {uvResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    !uvResult.alterationDetected
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                      : "bg-red-950/40 border-red-500/40 text-red-200"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-sm tracking-wide">{uvResult.verdict}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40">
                      Wavelength: {uvResult.uvSpectrometry?.wavelengthNm}nm
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-black/30 p-2.5 rounded border border-white/10">
                      <span className="font-bold block mb-1">UV Spectrometry Analysis:</span>
                      <div>Fluorescence: {uvResult.uvSpectrometry?.fluorescenceLevel}</div>
                      <div>Chemical Wash: {uvResult.uvSpectrometry?.chemicalBleachStatus}</div>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded border border-white/10">
                      <span className="font-bold block mb-1">Fourier Micro-Kerning Analysis:</span>
                      <div>Line Status: {uvResult.fourierMicroKerning?.microPrintLineStatus}</div>
                      <div>Ink Penetration: {uvResult.fourierMicroKerning?.inkPenetrationIndex}</div>
                      <div>Variance: {uvResult.fourierMicroKerning?.spatialFrequencyVariance}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
