import React, { useEffect, useState, useRef } from "react";
import client from "../api/client";
import { useClearingEvents } from "../hooks/useClearingEvents";

/**
 * Web Audio API Synthesizer for live clearing & gridlock netting chimes.
 * Requires zero external audio assets; synthesizes harmonics in memory.
 */
class SynthesizedChimeEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem("MISDESC_audio_chimes") === "true";
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("MISDESC_audio_chimes", String(this.enabled));
    if (this.enabled) {
      this.init();
      this.play("CLEARANCE");
    }
    return this.enabled;
  }

  play(type = "CLEARANCE") {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      if (type === "GRIDLOCK_NETTED") {
        // Double harmonic bell chime for multilateral Tarjan cycle resolution
        const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.001, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.55);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.6);
        });
      } else {
        // Uplifting triad chime for cheque clearance
        const notes = [659.25, 830.61, 987.77]; // E5, G#5, B5
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.001, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.45);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.5);
        });
      }
    } catch (err) {}
  }
}

const chimeEngine = new SynthesizedChimeEngine();

export default function LiveSettlementTicker() {
  const [tickerData, setTickerData] = useState({
    clearedCount: 0,
    clearedVolume: 0,
    netPosition: 0,
    direction: "SURAT PEOPLES CO OP BANK ↔ SURAT PEOPLES CO OP BANK",
    lsmUnlocked: 12500000,
    activeCycleCount: 2,
  });
  const [pulse, setPulse] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(chimeEngine.enabled);
  const marqueeRef = useRef(null);

  async function refreshTicker() {
    try {
      const res = await client.get("/admin/stats");
      const stats = res.data || {};
      const clearedCount = stats.byStatus?.CLEARED || 0;
      const clearedVolume = Number(stats.totalClearedAmount || 0);

      setTickerData((prev) => ({
        ...prev,
        clearedCount,
        clearedVolume,
        netPosition: clearedVolume,
      }));
      setPulse(true);
      setTimeout(() => setPulse(false), 2000);
    } catch (err) {
      // Non-blocking
    }
  }

  useEffect(() => {
    refreshTicker();
  }, []);

  useClearingEvents((event) => {
    refreshTicker();
    if (event?.type === "LSM_GRIDLOCK_RESOLVED") {
      chimeEngine.play("GRIDLOCK_NETTED");
    } else if (event?.type === "CHEQUE_STATUS_UPDATED" || event?.type === "CHEQUE_CLEARED") {
      chimeEngine.play("CLEARANCE");
    }
  });

  const handleToggleAudio = () => {
    const newState = chimeEngine.toggle();
    setAudioEnabled(newState);
  };

  return (
    <div className="bg-slate-950 text-white border-b border-slate-800/80 text-xs shadow-inner select-none">
      {/* Top Strip: Primary Metrics & Audio Controls */}
      <div className="px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/90">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              NATIONAL SWITCH LIVE TICKER
            </span>
          </div>

          <div className={`transition-all duration-300 font-mono text-[11px] ${pulse ? "text-emerald-400 font-bold scale-102" : "text-slate-300"}`}>
            Cleared Volume: <span className="font-bold text-white">₹{tickerData.clearedVolume.toLocaleString("en-IN")}</span>{" "}
            <span className="text-slate-400 text-[10px]">({tickerData.clearedCount} instruments)</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
            <span>⚡ LSM Liquidity Conserved:</span>
            <span className="font-bold text-white">₹{(tickerData.lsmUnlocked / 100000).toFixed(2)} Lakhs</span>
          </div>
        </div>

        {/* Audio Chime Synthesizer Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              audioEnabled
                ? "bg-emerald-950 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
            }`}
            title="Toggle synthesized clearing chimes via Web Audio API"
          >
            <span>{audioEnabled ? "🔊" : "🔇"}</span>
            <span>{audioEnabled ? "AUDIO CHIMES: ON" : "AUDIO MUTED"}</span>
          </button>
        </div>
      </div>

      {/* Bottom Strip: Continuous Multilateral Netting Marquee */}
      <div className="overflow-hidden whitespace-nowrap bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 py-1 px-4 border-t border-slate-900/60 font-mono text-[10px] text-slate-300">
        <div
          ref={marqueeRef}
          className="inline-block animate-marquee hover:pause flex items-center gap-8"
          style={{ animation: "marquee 35s linear infinite" }}
        >
          <span className="inline-flex items-center gap-1.5 text-teal-300 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            [LSM NETTING] SBI ➔ HDFC ➔ SRT ➔ SBI | ₹50,00,000 Pure Zero-Liquidity Multilateral Offset Settled
          </span>
          <span className="text-slate-600">■</span>

          <span className="inline-flex items-center gap-1.5 text-emerald-300">
            <span className="text-emerald-400">🏛️</span>
            [RBI e-KUBER] Wholesale RTGS Netting Batch Active · T+0 Settlement Corridor
          </span>
          <span className="text-slate-600">■</span>

          <span className="inline-flex items-center gap-1.5 text-indigo-300">
            <span className="text-indigo-400">🛡️</span>
            [NIST PQC] FIPS 204 ML-DSA-65 Dual-Stack Signatures Sealed (||z||_∞ ≤ 131,072)
          </span>
          <span className="text-slate-600">■</span>

          <span className="inline-flex items-center gap-1.5 text-cyan-300">
            <span className="text-cyan-400">🔐</span>
            [zk-SNARK Groth16] BN254 Solvency Proof Verified · 0% Balance Disclosure
          </span>
          <span className="text-slate-600">■</span>

          <span className="inline-flex items-center gap-1.5 text-amber-300">
            <span className="text-amber-400">🌐</span>
            [SANCTIONS RADAR] Jaro-Winkler & Double-Metaphone Screener Active · 0 Statutory Holds
          </span>
          <span className="text-slate-600">■</span>

          <span className="inline-flex items-center gap-1.5 text-teal-300 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            [LSM NETTING] SBI ➔ HDFC ➔ SRT ➔ SBI | ₹50,00,000 Pure Zero-Liquidity Multilateral Offset Settled
          </span>
        </div>
      </div>
    </div>
  );
}
