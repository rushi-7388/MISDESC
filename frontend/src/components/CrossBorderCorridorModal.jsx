import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function CrossBorderCorridorModal({ isOpen, onClose }) {
  const [fxRates, setFxRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [corridor, setCorridor] = useState("INR_TO_AED");
  const [inrAmount, setInrAmount] = useState(500000);
  const [beneficiaryName, setBeneficiaryName] = useState("Emirates Sovereign Logistics PJSC");
  const [beneficiaryCountry, setBeneficiaryCountry] = useState("AE");
  const [dvpResult, setDvpResult] = useState(null);
  const [showXml, setShowXml] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFxRates();
    }
  }, [isOpen]);

  async function fetchFxRates() {
    try {
      const res = await client.get("/crossborder/fx-rates");
      setFxRates(res.data.rates);
    } catch (err) {
      console.error("Failed to fetch FX rates:", err);
    }
  }

  async function handleExecuteDvp(e) {
    e.preventDefault();
    setLoading(true);
    setDvpResult(null);
    setShowXml(false);
    try {
      const res = await client.post("/crossborder/dvp-settle", {
        corridor,
        inrAmount: Number(inrAmount),
        beneficiaryName,
        beneficiaryCountry,
      });
      setDvpResult(res.data);
    } catch (err) {
      alert("Bilateral DvP failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-blue-500/40 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-500/30 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-xl text-xl font-bold shadow-inner">
              🌐 Direct DvP
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                De-Dollarized Sovereign Bilateral Cross-Border Corridor
                <span className="text-xs bg-blue-950 border border-blue-500/50 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                  PILLAR 5
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Non-USD Bilateral Central Bank Delivery vs Payment (INR-AED, INR-SGD, INR-SAR) with sub-50ms Sanctions Radar
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
          {/* FX Rates Ticker */}
          {fxRates && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              {Object.entries(fxRates).map(([ccy, data]) => (
                <div key={ccy} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold">{data.currencyName}</div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5">
                    1 {ccy} = ₹{data.rate}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">Spread: {data.spreadPercent}%</div>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleExecuteDvp} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Bilateral Corridor</label>
                <select
                  value={corridor}
                  onChange={(e) => {
                    setCorridor(e.target.value);
                    if (e.target.value === "INR_TO_AED") {
                      setBeneficiaryCountry("AE");
                      setBeneficiaryName("Emirates Sovereign Logistics PJSC");
                    } else if (e.target.value === "INR_TO_SGD") {
                      setBeneficiaryCountry("SG");
                      setBeneficiaryName("Marina Maritime Trading Pte Ltd");
                    } else if (e.target.value === "INR_TO_SAR") {
                      setBeneficiaryCountry("SA");
                      setBeneficiaryName("Riyadh Infrastructure Development Co");
                    } else if (e.target.value === "INR_TO_EUR") {
                      setBeneficiaryCountry("DE");
                      setBeneficiaryName("Bavaria Industrial Machinery GmbH");
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="INR_TO_AED">INR ➔ AED (India - UAE Bilateral)</option>
                  <option value="INR_TO_SGD">INR ➔ SGD (India - Singapore UPI/PayNow)</option>
                  <option value="INR_TO_SAR">INR ➔ SAR (India - Saudi Sovereign)</option>
                  <option value="INR_TO_EUR">INR ➔ EUR (Direct Bilateral Corridor)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Settlement Amount (INR ₹)</label>
                <input
                  type="number"
                  value={inrAmount}
                  onChange={(e) => setInrAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Beneficiary Entity</label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span>🛡️ Sub-50ms Sanctions Screening (UN / OFAC / RBI Watchlists)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Bypasses New York USD Correspondent Transit
              </span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
              >
                {loading ? "Screening & Settling..." : "⚡ Execute Sub-2-Second Atomic DvP"}
              </button>
            </div>
          </form>

          {/* DvP Settlement Result Card */}
          {dvpResult && (
            <div className="bg-slate-950 border border-blue-500/40 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-400">{dvpResult.txRef}</span>
                  <div className="text-[11px] text-slate-400 font-mono">UETR: {dvpResult.uetr}</div>
                </div>
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
                  {dvpResult.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">INR Disbursed:</span>
                  <span className="text-sm font-mono font-bold text-white">₹{dvpResult.inrAmount?.toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Foreign Credited:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {dvpResult.foreignAmount?.toLocaleString("en-US")} {dvpResult.foreignCurrency}
                  </span>
                </div>
                <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Estimated FX Savings:</span>
                  <span className="text-sm font-mono font-bold text-cyan-400">
                    ₹{dvpResult.savingsVersusUsdSpreadInr?.toLocaleString("en-IN")} (3.5%)
                  </span>
                </div>
                <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Sanctions Radar:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    PASS ({dvpResult.sanctionsCheck?.screenedInMs} ms)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-slate-400">
                  Conforms to ISO 20022 Financial Messaging Standards (CBPR+)
                </span>
                <button
                  onClick={() => setShowXml(!showXml)}
                  className="text-xs font-mono px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-blue-300 border border-blue-500/30 transition"
                >
                  {showXml ? "Hide XML" : "Inspect pacs.009 XML"}
                </button>
              </div>

              {showXml && (
                <pre className="text-[10px] font-mono bg-black p-3 rounded-lg border border-slate-800 text-slate-300 overflow-x-auto max-h-56">
                  {dvpResult.iso20022Pacs009Xml}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
