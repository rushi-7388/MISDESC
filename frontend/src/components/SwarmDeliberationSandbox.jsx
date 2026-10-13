import React, { useState, useEffect } from "react";
import client from "../api/client";

/**
 * Phase 8: Autonomous 4-Agent AI Swarm Live Deliberation Sandbox & Adversarial Playground
 */
export default function SwarmDeliberationSandbox() {
  const [scenario, setScenario] = useState("PREPEND_DIGIT");
  const [originalAmount, setOriginalAmount] = useState(50000);
  const [alteredAmount, setAlteredAmount] = useState(150000);
  const [chemicalWashingIntensity, setChemicalWashingIntensity] = useState(85);
  const [signatureVariancePercent, setSignatureVariancePercent] = useState(65);
  const [drawerName, setDrawerName] = useState("Kothari Textile Industries Pvt Ltd");
  const [payeeName, setPayeeName] = useState("Apex Machinery & Spares Ltd");

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const fetchSimulation = async (selectedScenario = scenario) => {
    try {
      setLoading(true);
      const res = await client.post("/swarm/adversarial/simulate", {
        scenario: selectedScenario,
        originalAmount: Number(originalAmount),
        alteredAmount: Number(alteredAmount),
        chemicalWashingIntensity: Number(chemicalWashingIntensity),
        signatureVariancePercent: Number(signatureVariancePercent),
        drawerName,
        payeeName,
      });
      setReport(res.data);
    } catch (err) {
      console.error("Adversarial simulation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulation(scenario);
  }, [scenario]);

  const handleScenarioChange = (newScenario) => {
    setScenario(newScenario);
    if (newScenario === "CLEAN_BASELINE") {
      setOriginalAmount(50000);
      setAlteredAmount(50000);
      setChemicalWashingIntensity(0);
      setSignatureVariancePercent(0);
    } else if (newScenario === "PREPEND_DIGIT") {
      setOriginalAmount(50000);
      setAlteredAmount(150000);
    } else if (newScenario === "CHEMICAL_WASHING") {
      setChemicalWashingIntensity(85);
    } else if (newScenario === "FORGED_SIGNATURE") {
      setSignatureVariancePercent(70);
    }
  };

  // Radar Chart Geometry Calculator
  const radarDimensions = report?.radarDimensions || [];
  const centerX = 160;
  const centerY = 160;
  const maxRadius = 110;

  const getCoordinates = (value, index, total = 4) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * maxRadius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y, angle };
  };

  const baselinePoints = radarDimensions
    .map((d, i) => {
      const { x, y } = getCoordinates(d.baseline, i, radarDimensions.length);
      return `${x},${y}`;
    })
    .join(" ");

  const currentPoints = radarDimensions
    .map((d, i) => {
      const { x, y } = getCoordinates(d.current, i, radarDimensions.length);
      return `${x},${y}`;
    })
    .join(" ");

  const isIntercepted = report?.isFraudIntercepted;

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 text-white p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-800/60 mb-1">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            Phase 8 · Autonomous 4-Agent Swarm Deliberation Sandbox
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Explainable AI (XAI) Forensic Radar & Adversarial Fraud Playground
          </h2>
          <p className="text-xs text-slate-400">
            Real-time multi-dimensional consensus across 2D FFT Spatial Vision, DTW Biometric dynamics, AML Sanctions distance, and Network PageRank graphs.
          </p>
        </div>

        {/* Global Verdict Badge */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Swarm Consensus Verdict</span>
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold inline-flex items-center gap-1.5 border shadow-lg ${
              isIntercepted
                ? "bg-rose-950/80 text-rose-300 border-rose-700/80 shadow-rose-950"
                : "bg-emerald-950/80 text-emerald-300 border-emerald-700/80 shadow-emerald-950"
            }`}
          >
            <span>{isIntercepted ? "🛑 ZERO-DAY FRAUD INTERCEPTED" : "✓ AUTONOMOUS STP CLEARED"}</span>
          </span>
        </div>
      </div>

      {/* Adversarial Attack Preset Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
          Select Adversarial Attack Scenario (Interactive Test Bench)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleScenarioChange("PREPEND_DIGIT")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              scenario === "PREPEND_DIGIT"
                ? "bg-amber-950/60 border-amber-500 text-white shadow-md shadow-amber-950"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>⚡ Prepend Digit</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Alters ₹50,000 ➔ ₹1,50,000</div>
          </button>

          <button
            type="button"
            onClick={() => handleScenarioChange("CHEMICAL_WASHING")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              scenario === "CHEMICAL_WASHING"
                ? "bg-rose-950/60 border-rose-500 text-white shadow-md shadow-rose-950"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <span>🧪 Chemical Washing</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Polar Solvent UV Bleach Halo</div>
          </button>

          <button
            type="button"
            onClick={() => handleScenarioChange("FORGED_SIGNATURE")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              scenario === "FORGED_SIGNATURE"
                ? "bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-950"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <span>✍️ Forged Signature</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">DTW Stroke Contour Hesitation</div>
          </button>

          <button
            type="button"
            onClick={() => handleScenarioChange("CLEAN_BASELINE")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              scenario === "CLEAN_BASELINE"
                ? "bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-950"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <span>✨ Clean Baseline</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Nominal Genuine Cheque</div>
          </button>
        </div>
      </div>

      {/* Main Grid: Live Radar Chart + Parameters & Deliberation Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Real-Time Radar Chart Canvas (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center justify-center space-y-4">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
              4-Agent Forensic Radar
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              Confidence: {report?.consensusScore}%
            </span>
          </div>

          {/* SVG Spider / Radar Chart */}
          <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
            <svg viewBox="0 0 320 320" className="w-full h-full select-none">
              {/* Concentric Polygons */}
              {[0.25, 0.5, 0.75, 1.0].map((level, lIdx) => {
                const ringPoints = [0, 1, 2, 3]
                  .map((i) => {
                    const { x, y } = getCoordinates(level * 100, i, 4);
                    return `${x},${y}`;
                  })
                  .join(" ");
                return (
                  <polygon
                    key={lIdx}
                    points={ringPoints}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray={level < 1 ? "3,3" : "none"}
                    opacity="0.6"
                  />
                );
              })}

              {/* Axis Rays */}
              {[0, 1, 2, 3].map((i) => {
                const { x, y } = getCoordinates(100, i, 4);
                return (
                  <line
                    key={i}
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke="#475569"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Baseline Polygon (Genuine Reference - Emerald) */}
              {baselinePoints && (
                <polygon
                  points={baselinePoints}
                  fill="rgba(16, 185, 129, 0.12)"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />
              )}

              {/* Current Instrument Polygon (Active / Adversarial) */}
              {currentPoints && (
                <polygon
                  points={currentPoints}
                  fill={isIntercepted ? "rgba(244, 63, 94, 0.25)" : "rgba(56, 189, 248, 0.25)"}
                  stroke={isIntercepted ? "#f43f5e" : "#38bdf8"}
                  strokeWidth="2.5"
                  className="transition-all duration-500"
                />
              )}

              {/* Vertices Points */}
              {radarDimensions.map((dim, i) => {
                const { x, y } = getCoordinates(dim.current, i, 4);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4.5"
                    fill={dim.current < 75 ? "#f43f5e" : "#38bdf8"}
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="transition-all duration-500"
                  />
                );
              })}

              {/* Axis Labels */}
              <text x={centerX} y="18" textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontWeight="bold">
                Spectral Vision (FFT)
              </text>
              <text x="312" y={centerY + 4} textAnchor="end" fill="#cbd5e1" fontSize="9.5" fontWeight="bold">
                Biometric (DTW)
              </text>
              <text x={centerX} y="312" textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontWeight="bold">
                AML Sanctions
              </text>
              <text x="8" y={centerY + 4} textAnchor="start" fill="#cbd5e1" fontSize="9.5" fontWeight="bold">
                Network Graph
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block border-b border-dashed" />
              Genuine Reference
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-3 h-1 inline-block rounded ${isIntercepted ? "bg-rose-500" : "bg-cyan-400"}`} />
              Active Instrument
            </span>
          </div>
        </div>

        {/* Right Column: Dimensions Metrics & Explainable AI (XAI) Reasoning (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Dimensional Scores Progress */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Agent Telemetry & Deficit Scores
            </h3>
            <div className="space-y-2.5">
              {radarDimensions.map((dim, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-200">{dim.agent}</span>
                    <span className={`font-mono font-bold ${dim.current < 75 ? "text-rose-400" : "text-emerald-400"}`}>
                      {dim.current}% {dim.current < 75 ? "(ANOMALY)" : "(NOMINAL)"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        dim.current < 75 ? "bg-gradient-to-r from-rose-600 to-amber-500" : "bg-gradient-to-r from-cyan-500 to-emerald-400"
                      }`}
                      style={{ width: `${dim.current}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explainable AI Forensic Explanation */}
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
            isIntercepted ? "bg-rose-950/40 border-rose-800/80 text-rose-200" : "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
          }`}>
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
              <span>{isIntercepted ? "🛡️ XAI Interception Rationale" : "✓ XAI Verification Rationale"}</span>
              <span className="font-mono text-[10px] opacity-75">Swarm Engine v4.2</span>
            </div>
            <p>{report?.explainableAiReasoning}</p>
          </div>

          {/* Detected Flags Feed */}
          {report?.flags?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Forensic Deficits Intercepted ({report.flags.length} Flags)
              </span>
              <div className="space-y-2">
                {report.flags.map((flag, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-rose-900/60 p-3 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 font-mono text-[11px]">{flag.code}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        {flag.severity} · {flag.agent}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{flag.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => fetchSimulation(scenario)}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Swarm Deliberating across 4 XAI Engines...</span>
                </>
              ) : (
                <>
                  <span>↺ Re-Run Adversarial Deliberation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
