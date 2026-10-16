import React, { useEffect, useState } from "react";
import client from "../api/client";
import ISO20022Modal from "./ISO20022Modal";

export default function SettlementSummary() {
  const [settlements, setSettlements] = useState([]);
  const [liquidityData, setLiquidityData] = useState(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedSettlementId, setSelectedSettlementId] = useState(null);

  async function loadData() {
    try {
      const [settlementsRes, liquidityRes] = await Promise.all([
        client.get("/settlements"),
        client.get("/settlements/liquidity-monitor"),
      ]);
      setSettlements(settlementsRes.data);
      setLiquidityData(liquidityRes.data);
    } catch (err) {
      console.error("Failed to load settlement/liquidity data:", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRun() {
    setRunning(true);
    setMessage("");
    try {
      const { data } = await client.post("/settlements/run");
      setMessage(data.message);
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || "Settlement run failed");
    } finally {
      setRunning(false);
    }
  }

  // Identify if any bank in the clearing network has breached the 85% liquidity limit
  const warningBanks = liquidityData?.banks?.filter((b) => b.liquidityWarning) || [];
  const primaryBank =
    liquidityData?.banks?.find((b) => b.ifsc === "SBIN0001234") ||
    liquidityData?.banks?.[0];
  const counterpartyBank =
    liquidityData?.banks?.find((b) => b.ifsc === "HDFC0005678") ||
    liquidityData?.banks?.[1];

  return (
    <div className="space-y-6">
      {/* 1. Interbank Liquidity Cap & Settlement Credit Limit Monitor */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono font-semibold">
                RBI/MISDESC MONITOR
              </span>
              <h2 className="font-bold text-base text-gray-900">
                Interbank Liquidity Cap & Central Bank Settlement Credit Monitor
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Real-time Bilateral Exposure Caps & Intraday Multilateral Net Settlement Collateral Limits
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-500">
              System Cap Status:{" "}
              {warningBanks.length > 0 ? (
                <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  LIQUIDITY WARNING ACTIVE
                </span>
              ) : (
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  STABLE (&lt;85%)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* LIQUIDITY_WARNING Regulatory Alert Banner */}
        {warningBanks.length > 0 && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-red-800 tracking-wide uppercase">
                REGULATORY NOTICE: INTRADAY LIQUIDITY WARNING
              </h3>
            </div>
            <p className="text-xs text-red-700 leading-relaxed font-medium">
              Intraday debit clearing exposure has breached the statutory{" "}
              <strong>85.0% Collateral Limit</strong> for{" "}
              <strong>{warningBanks.map((b) => b.bankName).join(", ")}</strong>.
              Under Central Bank / Clearing House regulations, failure to pledge additional high-quality
              liquid assets (HQLA) or adjust bilateral credit limits may cause multilateral net settlement
              rejection.
            </p>
            <div className="flex items-center gap-4 text-[11px] font-mono font-bold text-red-800 pt-1">
              {warningBanks.map((b) => (
                <span key={b.bankId} className="bg-white/80 px-2.5 py-1 rounded border border-red-300">
                  {b.bankName}: {b.utilizationPercent}% of ₹{b.allocatedCollateral.toLocaleString("en-IN")} Cap
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Bilateral Exposure Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SURAT PEOPLES CO OP BANK Card */}
          {primaryBank && (
            <div
              className={`p-4 rounded-xl border transition-all ${primaryBank.liquidityWarning
                ? "bg-red-50/40 border-red-300 shadow-sm"
                : "bg-slate-50 border-gray-200"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-xs text-gray-900">{primaryBank.bankName}</h4>
                  <span className="text-[10px] font-mono text-gray-500">
                    A/C: {primaryBank.clearingAccount} · IFSC: {primaryBank.ifsc}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${primaryBank.liquidityWarning
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                >
                  {primaryBank.liquidityWarning ? "LIQUIDITY_WARNING" : "NORMAL"}
                </span>
              </div>

              {/* Stress Bar for Primary Bank */}
              <div className="space-y-1.5 my-3">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-gray-600">Intraday Collateral Stress Bar:</span>
                  <span
                    className={`font-mono font-bold ${primaryBank.liquidityWarning
                      ? "text-red-600 font-extrabold"
                      : primaryBank.utilizationPercent >= 60
                        ? "text-amber-600"
                        : "text-emerald-700"
                      }`}
                  >
                    {primaryBank.utilizationPercent}% Utilized
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${primaryBank.liquidityWarning
                      ? "bg-red-600"
                      : primaryBank.utilizationPercent >= 60
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                      }`}
                    style={{ width: `${Math.min(100, primaryBank.utilizationPercent)}%` }}
                  />
                  {/* 85% Warning threshold line marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-800 z-10"
                    style={{ left: "85%" }}
                    title="85% Regulatory Warning Threshold"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                  <span>0%</span>
                  <span className="text-red-500 font-bold">85% Cap Threshold</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Exposure Metrics Table */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-200/60 font-mono">
                <div>
                  <span className="text-[10px] text-gray-500 block">Allocated Collateral Cap</span>
                  <span className="font-bold text-gray-900">
                    ₹{primaryBank.allocatedCollateral.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Gross Clearing Outflow</span>
                  <span className="font-bold text-gray-800">
                    ₹{primaryBank.outflowAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Net Clearing Position</span>
                  <span
                    className={`font-bold ${primaryBank.netPosition >= 0 ? "text-emerald-700" : "text-red-700"
                      }`}
                  >
                    {primaryBank.netPosition >= 0 ? "+" : "-"}₹
                    {Math.abs(primaryBank.netPosition).toLocaleString("en-IN")}{" "}
                    ({primaryBank.netPosition >= 0 ? "Creditor" : "Debtor"})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Remaining Buffer</span>
                  <span className="font-bold text-gray-800">
                    ₹{Math.max(0, primaryBank.allocatedCollateral - (primaryBank.netDebitExposure || primaryBank.outflowAmount)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SURAT PEOPLES CO OP BANK Card */}
          {counterpartyBank && (
            <div
              className={`p-4 rounded-xl border transition-all ${counterpartyBank.liquidityWarning
                ? "bg-red-50/40 border-red-300 shadow-sm"
                : "bg-slate-50 border-gray-200"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-xs text-gray-900">{counterpartyBank.bankName}</h4>
                  <span className="text-[10px] font-mono text-gray-500">
                    A/C: {counterpartyBank.clearingAccount} · IFSC: {counterpartyBank.ifsc}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${counterpartyBank.liquidityWarning
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                >
                  {counterpartyBank.liquidityWarning ? "LIQUIDITY_WARNING" : "NORMAL"}
                </span>
              </div>

              {/* Stress Bar for Counterparty Bank */}
              <div className="space-y-1.5 my-3">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-gray-600">Intraday Collateral Stress Bar:</span>
                  <span
                    className={`font-mono font-bold ${counterpartyBank.liquidityWarning
                      ? "text-red-600 font-extrabold"
                      : counterpartyBank.utilizationPercent >= 60
                        ? "text-amber-600"
                        : "text-emerald-700"
                      }`}
                  >
                    {counterpartyBank.utilizationPercent}% Utilized
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${counterpartyBank.liquidityWarning
                      ? "bg-red-600"
                      : counterpartyBank.utilizationPercent >= 60
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                      }`}
                    style={{ width: `${Math.min(100, counterpartyBank.utilizationPercent)}%` }}
                  />
                  {/* 85% Warning threshold line marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-800 z-10"
                    style={{ left: "85%" }}
                    title="85% Regulatory Warning Threshold"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                  <span>0%</span>
                  <span className="text-red-500 font-bold">85% Cap Threshold</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Exposure Metrics Table */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-200/60 font-mono">
                <div>
                  <span className="text-[10px] text-gray-500 block">Allocated Collateral Cap</span>
                  <span className="font-bold text-gray-900">
                    ₹{counterpartyBank.allocatedCollateral.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Gross Clearing Outflow</span>
                  <span className="font-bold text-gray-800">
                    ₹{counterpartyBank.outflowAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Net Clearing Position</span>
                  <span
                    className={`font-bold ${counterpartyBank.netPosition >= 0 ? "text-emerald-700" : "text-red-700"
                      }`}
                  >
                    {counterpartyBank.netPosition >= 0 ? "+" : "-"}₹
                    {Math.abs(counterpartyBank.netPosition).toLocaleString("en-IN")}{" "}
                    ({counterpartyBank.netPosition >= 0 ? "Creditor" : "Debtor"})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Remaining Buffer</span>
                  <span className="font-bold text-gray-800">
                    ₹{Math.max(0, counterpartyBank.allocatedCollateral - (counterpartyBank.netDebitExposure || counterpartyBank.outflowAmount)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Multilateral Net Settlement Ledger */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-base text-gray-900">Multilateral Net Settlement Ledger</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Interbank clearing bilateral netting and pacs.008 export
            </p>
          </div>
          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            {running ? "Executing Settlement..." : "Run Net Settlement Cycle"}
          </button>
        </div>

        {message && (
          <div className="text-xs font-medium p-2.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 mb-3">
            {message}
          </div>
        )}

        {settlements.length === 0 ? (
          <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg text-center">
            No settlement cycles have been executed yet. Cleared cheques will be netted and reconciled here.
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider border-b">
                <tr>
                  <th className="text-left px-3 py-2.5">Cycle Date</th>
                  <th className="text-left px-3 py-2.5">Creditor Bank</th>
                  <th className="text-left px-3 py-2.5">Debtor Bank</th>
                  <th className="text-left px-3 py-2.5">Direction</th>
                  <th className="text-right px-3 py-2.5">Netted Volume</th>
                  <th className="text-right px-3 py-2.5">Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-gray-500">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800">{s.bankA?.name}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800">{s.bankB?.name}</td>
                    <td className="px-3 py-2.5 font-mono">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
                        {s.direction === "A_TO_B"
                          ? `${s.bankA?.code || "Bank A"} → ${s.bankB?.code || "Bank B"}`
                          : `${s.bankB?.code || "Bank B"} → ${s.bankA?.code || "Bank A"}`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                      ₹{Number(s.netAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSettlementId(s.id)}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 text-[10px] transition-colors cursor-pointer"
                      >
                        pacs.008 XML
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedSettlementId && (
          <ISO20022Modal
            settlementId={selectedSettlementId}
            onClose={() => setSelectedSettlementId(null)}
          />
        )}
      </div>
    </div>
  );
}
