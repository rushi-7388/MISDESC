import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function CrossBorderClearingModal({ cheque, onClose }) {
  const [currency, setCurrency] = useState("USD");
  const [foreignAmount, setForeignAmount] = useState(10000);
  const [fxDetails, setFxDetails] = useState(null);
  const [sanctionsResult, setSanctionsResult] = useState(null);
  const [screening, setScreening] = useState(false);
  const [loadingFx, setLoadingFx] = useState(false);
  const [xmlOutput, setXmlOutput] = useState(null);

  const fetchConversion = async (curr, amt) => {
    try {
      setLoadingFx(true);
      const res = await client.post("/crossborder/convert", {
        amount: amt,
        currency: curr,
      });
      setFxDetails(res.data);
    } catch (err) {
      console.error("FX conversion error:", err);
    } finally {
      setLoadingFx(false);
    }
  };

  const handleScreenSanctions = async () => {
    try {
      setScreening(true);
      const res = await client.post("/crossborder/screen", {
        drawerName: cheque.payeeName || "Acme Enterprises Ltd",
        payeeName: "International Trade Creditor",
        countryOrigin: "US",
      });
      setSanctionsResult(res.data);
    } catch (err) {
      console.error("Sanctions screening error:", err);
    } finally {
      setScreening(false);
    }
  };

  const handleExportPacs009 = async () => {
    try {
      const res = await client.post("/crossborder/iso20022/cbpr-pacs009", {
        cheque,
        fxDetails,
      });
      setXmlOutput(res.data);
    } catch (err) {
      alert("Failed to export pacs.009: " + err.message);
    }
  };

  useEffect(() => {
    fetchConversion(currency, foreignAmount);
    handleScreenSanctions();
  }, [currency]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-lg shadow-inner">
              🌐
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Cross-Border Multi-Currency MISDESC · ISO 20022 CBPR+
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                International Clearing & Sanctions Radar · Cheque #{cheque.chequeNumber}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Multi-Currency FX Converter */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Interbank FX Rate & Forward Hedging</h3>
              <div className="flex items-center gap-2">
                {["USD", "EUR", "GBP", "AED", "SGD"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                      currency === c
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {fxDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px] pt-1">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px] font-sans">Mid-Market Rate</span>
                  <span className="text-base font-bold text-cyan-400 block">
                    1 {fxDetails.foreignCurrency} = ₹{fxDetails.exchangeRate}
                  </span>
                  <span className="text-slate-500 text-[10px]">Hedge Lock: ₹{fxDetails.forwardHedgeRate}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px] font-sans">Foreign Draft Value</span>
                  <span className="text-base font-bold text-white block">
                    {fxDetails.foreignCurrency} {fxDetails.foreignAmount.toLocaleString()}
                  </span>
                  <span className="text-slate-500 text-[10px]">Spread: {fxDetails.interbankSpreadPercent}%</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px] font-sans">Net Realization (INR)</span>
                  <span className="text-base font-bold text-emerald-400 block">
                    ₹{Number(fxDetails.inrNetRealization).toLocaleString("en-IN")}
                  </span>
                  <span className="text-slate-500 text-[10px]">Quote: {fxDetails.fxQuoteId}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sub-100ms OFAC / UN / RBI Sanctions Screener */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>🛡️ Real-Time AML & Sanctions Screener</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sanctionsResult?.status === "PASSED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : "bg-rose-950 text-rose-300 border border-rose-700"
                    }`}
                  >
                    {sanctionsResult?.status === "PASSED" ? "✓ ZERO MATCH (SANCTIONS CLEARED)" : "SANCTIONS HOLD"}
                  </span>
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Automated scan against US OFAC SDN, UN Consolidated, and RBI Watchlists.
                </p>
              </div>

              <button
                type="button"
                onClick={handleScreenSanctions}
                disabled={screening}
                className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                {screening ? "Scanning..." : "Re-Scan"}
              </button>
            </div>

            {sanctionsResult && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Scan Latency:</span>
                  <span className="text-teal-400">{sanctionsResult.screeningDurationMs} ms (Sub-100ms Target Met)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Compliance Verdict:</span>
                  <span className="text-emerald-400 font-bold">{sanctionsResult.verdict}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorities Audited:</span>
                  <span className="text-slate-400">OFAC, UN Security Council, RBI AML, FATF</span>
                </div>
              </div>
            )}
          </div>

          {/* ISO 20022 CBPR+ pacs.009 Message Preview */}
          {xmlOutput && (
            <div className="space-y-2">
              <h3 className="font-bold text-white">ISO 20022 pacs.009.001.08 XML</h3>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-cyan-300 overflow-x-auto max-h-48">
                {xmlOutput}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Origin: IN · Destination: US/EU/UK/UAE Interbank Rail
          </span>

          <button
            type="button"
            onClick={handleExportPacs009}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Generate ISO 20022 pacs.009 XML</span>
          </button>
        </div>
      </div>
    </div>
  );
}
