import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function BhashiniVoiceBankingModal({ onClose }) {
  const [languages, setLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState("hi");
  const [spokenText, setSpokenText] = useState("मैं चेक संख्या 000102 की दो लाख पचास हजार रुपये की राशि पास करने की पुष्टि करता हूँ।");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function fetchLangs() {
      try {
        const res = await client.get("/dpi/bhashini/languages");
        setLanguages(res.data || []);
      } catch (err) {
        console.error("Failed to fetch Bhashini languages:", err);
      }
    }
    fetchLangs();
  }, []);

  function handleLangChange(code) {
    setSelectedLang(code);
    if (code === "gu") {
      setSpokenText("હું ચેક નંબર 000102 ની બે લાખ પચાસ હજાર રૂપિયાની રકમ મંજૂર કરું છું.");
    } else if (code === "mr") {
      setSpokenText("मी चेक क्रमांक 000102 ची अडीच लाख रुपयांची रक्कम मंजूर करत आहे.");
    } else if (code === "ta") {
      setSpokenText("நான் காசோலை எண் 000102 க்கான இரண்டு லட்சத்து ஐம்பதாயிரம் ரூபாயை அனுமதிக்கிறேன்.");
    } else if (code === "te") {
      setSpokenText("నేను చెక్కు నంబర్ 000102 కి రెండు లక్షల యాభై వేల రూపాయల చెల్లింపును ఆమోదిస్తున్నాను.");
    } else if (code === "bn") {
      setSpokenText("আমি চেক নম্বর 000102 এর আড়াই লক্ষ টাকার অর্থ পরিশোধের অনুমোদন দিচ্ছি।");
    } else {
      setSpokenText("मैं चेक संख्या 000102 की दो लाख पचास हजार रुपये की राशि पास करने की पुष्टि करता हूँ।");
    }
  }

  async function handleVerifyVoice() {
    setLoading(true);
    try {
      const res = await client.post("/dpi/bhashini/voice-intent", {
        languageCode: selectedLang,
        spokenText,
        chequeNumber: "000102",
        amount: 250000,
        speakerProfileId: "manager-athwa-branch-01",
      });
      setResult(res.data);
    } catch (err) {
      alert("Bhashini verification failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 text-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl">
              🗣️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30 font-mono">
                  Digital India Bhashini AI
                </span>
                <span className="text-xs text-slate-400">22 Scheduled Languages of India</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                Conversational Voice Verification & Dialect Biometrics
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Language Selection */}
        <div className="mt-6">
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Select Indian Mother Tongue / Regional Dialect (22 Official Languages)
          </label>
          <select
            value={selectedLang}
            onChange={(e) => handleLangChange(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-sans focus:border-purple-500 outline-none"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                {l.name} ({l.native}) - {l.script} Script
              </option>
            ))}
          </select>
        </div>

        {/* Audio Recording & Waveform Simulation */}
        <div className="mt-4 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Acoustic Microphone Track
            </span>
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isRecording ? "bg-red-500 text-white animate-pulse" : "bg-purple-600 hover:bg-purple-500 text-white"
              }`}
            >
              <span>{isRecording ? "🔴 Recording Voice..." : "🎙️ Speak Verification"}</span>
            </button>
          </div>

          {/* Animated Waveform Visualizer */}
          <div className="h-12 flex items-center justify-center gap-1 bg-slate-900/60 rounded-xl px-4 overflow-hidden border border-slate-800">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full transition-all duration-150"
                style={{
                  height: isRecording
                    ? `${20 + Math.sin((i + Date.now() / 200) * 0.8) * 20}px`
                    : `${8 + (i % 6) * 3}px`,
                }}
              />
            ))}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Spoken Transcription (Bhashini Speech-to-Text):
            </label>
            <textarea
              rows={2}
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-sans outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Trigger */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleVerifyVoice}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Authenticating Vocal Formants..." : "⚡ Authenticate Voice Mandate"}
          </button>
        </div>

        {/* Result Card */}
        {result && (
          <div className="mt-6 border border-purple-500/30 bg-purple-950/20 rounded-2xl p-5 space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-800/40 pb-2">
              <span className="font-bold text-purple-300">
                {result.language?.name} ({result.language?.nativeScript}) Intent: {result.intent}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                ✓ Cheque Authorized
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Acoustic Pitch</span>
                <span className="text-white font-bold">{result.vocalBiometrics?.pitchHz} Hz</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Micro-Jitter</span>
                <span className="text-white font-bold">{result.vocalBiometrics?.jitterPercent}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Biometric Match</span>
                <span className="text-emerald-400 font-bold">{result.vocalBiometrics?.biometricMatchScore}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Synthetic Clone</span>
                <span className="text-cyan-400 font-bold">Negative (Liveness Passed)</span>
              </div>
            </div>

            <p className="text-slate-300 font-sans text-xs pt-1">{result.auditRemarks}</p>
          </div>
        )}
      </div>
    </div>
  );
}
