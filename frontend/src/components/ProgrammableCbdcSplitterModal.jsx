import React, { useState } from "react";
import client from "../api/client";

export default function ProgrammableCbdcSplitterModal({ isOpen, onClose }) {
  const [grossAmount, setGrossAmount] = useState(150000);
  const [vendorName, setVendorName] = useState("Gujarat Steel & Infrastructure Corp");
  const [loading, setLoading] = useState(false);
  const [splitResult, setSplitResult] = useState(null);

  // Geofence slider state
  const [distanceKm, setDistanceKm] = useState(2.8);
  const [geofenceResult, setGeofenceResult] = useState(null);

  async function handleExecuteSplit(e) {
    e.preventDefault();
    setLoading(true);
    setSplitResult(null);
    setGeofenceResult(null);
    try {
      const res = await client.post("/smart-cheques/tax-split", {
        grossAmount: Number(grossAmount),
        vendorName,
        gstRatePercent: 18.0,
        tdsRatePercent: 1.0,
      });
      setSplitResult(res.data);
    } catch (err) {
      alert("CBDC split execution failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyGeofence() {
    setLoading(true);
    try {
      // If distance is near 0, send coordinates inside geofence (21.1167, 72.6333)
      const lat = 21.1167 + (distanceKm * 0.005);
      const lng = 72.6333 + (distanceKm * 0.005);

      const res = await client.post("/smart-cheques/geofence-verify", {
        splitId: splitResult?.splitId,
        currentLat: lat,
        currentLng: lng,
        deliveryWaybill: "EWB-GUJ-9920194",
      });
      setGeofenceResult(res.data);
    } catch (err) {
      alert("Geofence verification failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-500/30 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/60 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xl font-bold shadow-inner">
              💎 e₹ CBDC
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                Programmable e-Rupee & Statutory Tax Auto-Splitter
                <span className="text-xs bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  PILLAR 4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Atomic 18% GSTN + 1% TDS routing to Sovereign Treasury + IoT GPS Geofence Escrow
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
          {/* Form */}
          <form onSubmit={handleExecuteSplit} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Gross Cheque / Remittance Amount (INR ₹)</label>
                <input
                  type="number"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Vendor Beneficiary Name</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
              >
                {loading ? "Executing Atomic Split..." : "💎 Execute Programmable e-Rupee Split"}
              </button>
            </div>
          </form>

          {/* Split Result Cards */}
          {splitResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* GSTN Card */}
                <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">GSTN Treasury Wallet</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      18% GST
                    </span>
                  </div>
                  <div className="text-xl font-black text-white">
                    ₹{splitResult.taxSovereignRouting?.gstnTreasury?.totalGst?.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <div>CGST (9%): ₹{splitResult.taxSovereignRouting?.gstnTreasury?.cgst_9pct}</div>
                    <div>SGST (9%): ₹{splitResult.taxSovereignRouting?.gstnTreasury?.sgst_9pct}</div>
                    <div className="truncate text-emerald-300 pt-1">
                      Tx: {splitResult.taxSovereignRouting?.gstnTreasury?.cbdcTokenTxHash}
                    </div>
                  </div>
                </div>

                {/* TDS Card */}
                <div className="bg-slate-950 border border-teal-500/40 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400">Income Tax (CBDT)</span>
                    <span className="text-[10px] bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                      1% TDS
                    </span>
                  </div>
                  <div className="text-xl font-black text-white">
                    ₹{splitResult.taxSovereignRouting?.cbdtIncomeTax?.tds_1pct?.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <div>Section: 194C Contractor</div>
                    <div className="truncate text-teal-300 pt-1">
                      Tx: {splitResult.taxSovereignRouting?.cbdtIncomeTax?.cbdcTokenTxHash}
                    </div>
                  </div>
                </div>

                {/* Vendor Escrow Card */}
                <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">Vendor Net Payout</span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                      81% Balance
                    </span>
                  </div>
                  <div className="text-xl font-black text-white">
                    ₹{splitResult.vendorDisbursement?.netPayable?.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>Beneficiary: {splitResult.vendorDisbursement?.vendorName}</div>
                    <div className="text-amber-400 font-semibold pt-1">
                      Status: {splitResult.vendorDisbursement?.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Geofence Delivery Escrow Simulator */}
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      IoT Delivery Geofence Telematics Simulator
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Target destination: Surat Hazira Port Logistics Hub (21.1167° N, 72.6333° E)
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
                    Distance: {distanceKm.toFixed(1)} km
                  </span>
                </div>

                <div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-900 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span className="text-emerald-400 font-bold">0 km (Arrived at Hazira Port)</span>
                    <span>5 km</span>
                    <span>10 km (In Transit / En Route)</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleVerifyGeofence}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-2"
                  >
                    📍 Transmit GPS Telemetry & Release Escrow
                  </button>
                </div>
              </div>

              {/* Geofence Unlock Status */}
              {geofenceResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    geofenceResult.isEscrowUnlocked
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                      : "bg-amber-950/40 border-amber-500/40 text-amber-200"
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span>{geofenceResult.isEscrowUnlocked ? "✓ Delivery Verified: e-Rupee Escrow Released!" : "⏳ Escrow Held in Transit"}</span>
                    <span className="font-mono text-xs">Distance: {geofenceResult.distanceToDestinationMeters}m</span>
                  </div>
                  <p className="text-xs opacity-90">{geofenceResult.message}</p>
                  {geofenceResult.cbdcDisbursementReceipt && (
                    <div className="text-[11px] font-mono bg-black/40 p-2 rounded text-emerald-300">
                      Receipt: {geofenceResult.cbdcDisbursementReceipt}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
