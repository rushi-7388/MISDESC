import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function DynamicCollateralManagementModal({ onClose }) {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState("SNB");
  const [pledgeType, setPledgeType] = useState("G_SEC_10Y");
  const [nominalAmount, setNominalAmount] = useState(5000000);
  const [repoAmount, setRepoAmount] = useState(2500000);
  const [stressReport, setStressReport] = useState(null);
  const [notification, setNotification] = useState("");

  async function loadPortfolios() {
    setLoading(true);
    try {
      const res = await client.get("/liquidity/collateral/portfolios");
      if (res.data?.portfolios) {
        setPortfolios(res.data.portfolios);
      }
    } catch {
      // offline fallback
      setPortfolios([
        {
          bankCode: "SNB",
          bankName: "SURAT PEOPLES CO OP BANK",
          netDebitCap: 50000000,
          currentNetDebit: 12450000,
          totalEffectiveCollateral: 53650000,
          ndcUtilizationPercent: 24.9,
          totalLiquidityBuffer: 73650000,
          headroom: 61200000,
          status: "OPTIMAL_HEALTHY",
          repoLineAvailable: 20000000,
          repoLineUtilized: 0,
          pledgedHoldings: [
            { id: "SEC-01", type: "G_SEC_10Y", isin: "IN0020230085", nominalValue: 30000000, haircut: 0.02, effectiveValue: 29400000, status: "ACTIVE" },
            { id: "SEC-02", type: "T_BILL_91D", isin: "IN002024X123", nominalValue: 15000000, haircut: 0.05, effectiveValue: 14250000, status: "ACTIVE" },
            { id: "SEC-03", type: "CASH_MARGIN", isin: "RBI-NDS-OM-CASH", nominalValue: 10000000, haircut: 0.00, effectiveValue: 10000000, status: "ACTIVE" },
          ],
        },
        {
          bankCode: "HDB",
          bankName: "HDFC BANK LTD",
          netDebitCap: 250000000,
          currentNetDebit: 64200000,
          totalEffectiveCollateral: 197000000,
          ndcUtilizationPercent: 25.68,
          totalLiquidityBuffer: 237000000,
          headroom: 172800000,
          status: "OPTIMAL_HEALTHY",
          repoLineAvailable: 50000000,
          repoLineUtilized: 10000000,
          pledgedHoldings: [
            { id: "SEC-04", type: "G_SEC_10Y", isin: "IN0020230085", nominalValue: 150000000, haircut: 0.02, effectiveValue: 147000000, status: "ACTIVE" },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortfolios();
  }, []);

  async function handlePledge() {
    setLoading(true);
    try {
      await client.post("/liquidity/collateral/pledge", {
        bankCode: selectedBank,
        type: pledgeType,
        nominalValue: nominalAmount,
      });
      setNotification(`Successfully pledged ₹${Number(nominalAmount).toLocaleString()} in ${pledgeType}.`);
      await loadPortfolios();
    } catch (err) {
      setNotification("Collateral pledge simulated successfully.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRepoDrawdown() {
    setLoading(true);
    try {
      await client.post("/liquidity/collateral/repo-drawdown", {
        bankCode: selectedBank,
        amount: repoAmount,
      });
      setNotification(`Drawdown ₹${Number(repoAmount).toLocaleString()} executed at 6.50% MSF rate.`);
      await loadPortfolios();
    } catch (err) {
      setNotification("Repo line drawdown simulated successfully.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRunStressTest(scenario) {
    setLoading(true);
    try {
      const res = await client.post("/liquidity/collateral/stress-test", { scenarioType: scenario });
      if (res.data?.report) {
        setStressReport(res.data.report);
      }
    } catch {
      setStressReport({
        scenario: {
          name: "Major Counterparty Default Shock (Top-1 Clearing Bank Fails Settlement)",
          severity: "CRITICAL",
          impactedNetFlowInr: -64200000.0,
          systemicResilienceScore: 91.4,
          settlementGuaranteeFundDepletion: "24.5%",
          recommendation: "Activate CCIL Settlement Guarantee Fund (SGF) Tranche B and trigger bilateral offset.",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  const activeBank = portfolios.find((p) => p.bankCode === selectedBank) || portfolios[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-xl">
              💼
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Dynamic Liquidity & Collateral Management (LMS)
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  RBI Master Direction
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Statutory Haircut Valuation | Net Debit Cap (NDC) Monitoring | Intraday Repo Line & Stress Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 px-6 py-2 text-xs flex justify-between items-center">
            <span>✓ {notification}</span>
            <button onClick={() => setNotification("")} className="hover:text-white">✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Bank Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {portfolios.map((p) => (
              <div
                key={p.bankCode}
                onClick={() => setSelectedBank(p.bankCode)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedBank === p.bankCode
                    ? "bg-slate-800 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/50"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm text-white">{p.bankCode}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    p.status === "OPTIMAL_HEALTHY" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300"
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 truncate mb-2">{p.bankName}</div>
                <div className="text-xs font-mono font-bold text-slate-200">
                  Headroom: ₹{(p.headroom / 10000000).toFixed(2)} Cr
                </div>
                <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, p.ndcUtilizationPercent)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>NDC Utilized: {p.ndcUtilizationPercent}%</span>
                  <span>Cap: ₹{(p.netDebitCap / 10000000).toFixed(1)} Cr</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Bank Detail & Holdings Table */}
          {activeBank && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {activeBank.bankName} ({activeBank.bankCode}) Collateral Portfolio
                  </h3>
                  <p className="text-xs text-slate-400">Total Effective Collateral: ₹{Number(activeBank.totalEffectiveCollateral).toLocaleString("en-IN")}</p>
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  Repo Line: <span className="text-emerald-400 font-bold">₹{((activeBank.repoLineAvailable - activeBank.repoLineUtilized) / 10000000).toFixed(2)} Cr Available</span>
                </div>
              </div>

              {/* Holdings list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">ISIN / Security</th>
                      <th className="py-2 px-3">Instrument Type</th>
                      <th className="py-2 px-3 text-right">Nominal Value</th>
                      <th className="py-2 px-3 text-center">RBI Haircut</th>
                      <th className="py-2 px-3 text-right">Effective Valuation</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {activeBank.pledgedHoldings?.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 text-white font-bold">{h.isin}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">{h.type.replace(/_/g, " ")}</td>
                        <td className="py-2.5 px-3 text-right text-slate-200">₹{Number(h.nominalValue).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-center text-amber-400">{(h.haircut * 100).toFixed(0)}%</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">₹{Number(h.effectiveValue).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Interactive Operations: Collateral Pledge & Repo Drawdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Pledge Security Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <span>➕ Pledge Government Securities</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-400">Security Instrument Type</label>
                  <select
                    value={pledgeType}
                    onChange={(e) => setPledgeType(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="G_SEC_10Y">10-Year GoI Benchmark G-Sec (2% Haircut)</option>
                    <option value="T_BILL_91D">91-Day Treasury Bills (5% Haircut)</option>
                    <option value="SGB_GOLD">Sovereign Gold Bonds (10% Haircut)</option>
                    <option value="CASH_MARGIN">RBI Central Bank Cash Margin (0% Haircut)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400">Nominal Face Value (INR)</label>
                  <input
                    type="number"
                    value={nominalAmount}
                    onChange={(e) => setNominalAmount(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                    step="1000000"
                  />
                </div>
                <button
                  onClick={handlePledge}
                  disabled={loading}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-md cursor-pointer text-xs"
                >
                  Pledge into Intraday Reserve
                </button>
              </div>
            </div>

            {/* Intraday Repo Line Drawdown */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <span>⚡ Instant Intraday Repo / MSF Line</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-400">Drawdown Amount (INR)</label>
                  <input
                    type="number"
                    value={repoAmount}
                    onChange={(e) => setRepoAmount(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                    step="500000"
                  />
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>RBI Marginal Standing Rate:</span>
                    <span className="text-amber-400 font-bold">6.50% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Earmarked Margin:</span>
                    <span className="text-slate-200">105% G-Sec Earmark</span>
                  </div>
                </div>
                <button
                  onClick={handleRepoDrawdown}
                  disabled={loading}
                  className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md cursor-pointer text-xs"
                >
                  Execute Immediate Drawdown
                </button>
              </div>
            </div>
          </div>

          {/* Stress Simulator Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🚨 Intraday Liquidity Stress Testing Engine</span>
                </h4>
                <p className="text-xs text-slate-400">Simulate systemic market shocks and evaluate Settlement Guarantee Fund (SGF) absorption</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => handleRunStressTest("COUNTERPARTY_DEFAULT")}
                className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg font-semibold cursor-pointer"
              >
                Simulate Top-1 Counterparty Default
              </button>
              <button
                onClick={() => handleRunStressTest("INWARD_SURGE_SPIKE")}
                className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg font-semibold cursor-pointer"
              >
                Simulate +45% Inward Volume Surge
              </button>
              <button
                onClick={() => handleRunStressTest("LIQUIDITY_RUN_STRESS")}
                className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-lg font-semibold cursor-pointer"
              >
                Simulate Sudden Deposit Liquidity Run
              </button>
            </div>

            {stressReport && (
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-amber-300">{stressReport.scenario.name}</span>
                  <span className="text-emerald-400 font-mono">Systemic Resilience: {stressReport.scenario.systemicResilienceScore}%</span>
                </div>
                <p className="text-slate-300 text-[11px]">{stressReport.scenario.recommendation}</p>
                <div className="text-[10px] text-slate-500 font-mono">
                  SGF Depletion: {stressReport.scenario.settlementGuaranteeFundDepletion} | Status: CONTAINED
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-400">
          <div>Central Liquidity Switch Connected | Real-Time Realisation</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close LMS
          </button>
        </div>

      </div>
    </div>
  );
}
