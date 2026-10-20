import React, { useState, useEffect, useRef } from "react";
import client from "../api/client";
import logo from "../assets/logo.jpg";

export default function RegionalVoiceBankingModal({ onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [activeLang, setActiveLang] = useState("hi-IN"); // "hi-IN", "gu-IN", "en-IN"
  const [loading, setLoading] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState([
    {
      id: "init-1",
      query: "Cheque 000101 ka status batao",
      detectedIntent: "CHEQUE_STATUS",
      textResponse: "🏦 Cheque #000101 (Tata Steel Ltd ke naam par, ₹1,50,000) ka status hai: Safaltapoorvak Clear aur Settle ho chuka hai (CLEARED).",
      speechResponse: "Cheque number 0 0 0 1 0 1 for rupees 1,50,000 is Cleared and Settled.",
      timestamp: "Just now",
    },
  ]);
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState(true);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = activeLang;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setTranscript(spoken);
        handleSendVoiceQuery(spoken);
      };

      recognitionRef.current = recognition;
    }
  }, [activeLang]);

  function toggleListening() {
    if (!recognitionRef.current) {
      alert("Web Speech API is not supported in this browser. You can type or click the quick voice commands below!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      try {
        recognitionRef.current.lang = activeLang;
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  }

  function speakText(text) {
    if (!speechSynthesisActive || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = activeLang;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  async function handleSendVoiceQuery(queryToSend) {
    const query = (queryToSend || transcript).trim();
    if (!query) return;

    setLoading(true);
    try {
      const res = await client.post("/innovations/voice/process", {
        query,
        language: activeLang,
      });

      const voiceLog = res.data;
      setVoiceHistory((prev) => [voiceLog, ...prev]);
      setTranscript("");

      // Speak answer using Web Speech Synthesis
      if (voiceLog.speechResponse) {
        speakText(voiceLog.speechResponse);
      }
    } catch (err) {
      console.error("Voice processing failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const QUICK_PROMPTS = [
    { label: "Cheque Status (Hindi)", text: "Cheque 000101 ka status batao", lang: "hi-IN" },
    { label: "Check Balance (Gujarati)", text: "Maru account balance ketlu che", lang: "gu-IN" },
    { label: "Stop Payment (Hindi)", text: "Cheque 000102 par stop payment lagao", lang: "hi-IN" },
    { label: "Positive Pay Status", text: "Positive Pay status verify karo", lang: "hi-IN" },
    { label: "Surat Branch Info (Gujarati)", text: "Surat branch nu address ane timing shu che", lang: "gu-IN" },
    { label: "English Clearing Inquiry", text: "What is the clearing status for cheque 000108", lang: "en-IN" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-xl shadow-inner">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Multi-Lingual AI Voice Banking Assistant
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  NLP Voice 2.0
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  SURAT PEOPLES CO OP BANK
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time regional speech recognition & synthesis in Gujarati (ગુજરાતી), Hindi (हिन्दी), and English.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveLang("gu-IN")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeLang === "gu-IN" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                ગુજરાતી
              </button>
              <button
                type="button"
                onClick={() => setActiveLang("hi-IN")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeLang === "hi-IN" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setActiveLang("en-IN")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeLang === "en-IN" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={() => setSpeechSynthesisActive(!speechSynthesisActive)}
              className={`p-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                speechSynthesisActive
                  ? "bg-emerald-950 border-emerald-700 text-emerald-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
              title={speechSynthesisActive ? "Audio Speech Output ON" : "Audio Speech Output Muted"}
            >
              {speechSynthesisActive ? "🔊 Speech ON" : "🔇 Muted"}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-950/20">
          {/* Voice Microphone Centerpiece */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center relative overflow-hidden">
            {/* Ambient Audio Glow */}
            {isListening && (
              <div className="absolute inset-0 bg-purple-600/10 animate-pulse pointer-events-none" />
            )}

            {/* Glowing Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-2xl transition-all cursor-pointer select-none ${
                isListening
                  ? "bg-rose-600 text-white shadow-rose-600/50 scale-110 animate-pulse ring-8 ring-rose-500/20"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/40 hover:scale-105"
              }`}
            >
              <span>{isListening ? "⏹" : "🎙️"}</span>
            </button>

            <div className="mt-3 font-bold text-sm text-white">
              {isListening ? "Listening... Bolein (Speaking...)" : "Tap Microphone to Speak"}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Current Language: <span className="text-purple-300 font-bold">{activeLang === "gu-IN" ? "ગુજરાતી (Gujarati)" : activeLang === "hi-IN" ? "हिन्दी (Hindi)" : "English"}</span>
            </div>

            {/* Simulated Live Audio Waveform */}
            <div className="flex items-center gap-1.5 h-8 mt-4">
              {[4, 8, 14, 24, 18, 10, 22, 28, 16, 12, 20, 8, 4].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isListening ? "bg-purple-400" : "bg-slate-700"
                  }`}
                  style={{
                    height: isListening ? `${Math.min(32, Math.max(6, h * (0.8 + Math.random())))}px` : "6px",
                  }}
                />
              ))}
            </div>

            {/* Manual text input fallback */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendVoiceQuery();
              }}
              className="mt-4 w-full max-w-lg flex items-center gap-2"
            >
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Or type voice query here (e.g. Cheque 000101 ka status batao)..."
                className="flex-1 bg-slate-900 text-white placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={loading || !transcript.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
              >
                {loading ? "..." : "Send"}
              </button>
            </form>
          </div>

          {/* Quick Voice Prompt Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Quick Regional Voice Prompts (Tap to Execute)
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActiveLang(qp.lang);
                    setTranscript(qp.text);
                    handleSendVoiceQuery(qp.text);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 text-xs text-slate-300 font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span className="text-purple-400">🗣</span>
                  <span>{qp.text}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({qp.label})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Response Feed */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Voice Assistant Dialogue Ledger
            </span>

            <div className="space-y-2.5">
              {voiceHistory.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 animate-in fade-in"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="font-bold text-purple-300">"{item.query}"</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{item.timestamp || "Recent"}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
                    {item.textResponse}
                  </div>

                  {item.speechResponse && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span className="italic text-slate-500">TTS Audio: {item.speechResponse}</span>
                      <button
                        type="button"
                        onClick={() => speakText(item.speechResponse)}
                        className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                      >
                        🔊 Replay Audio
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
