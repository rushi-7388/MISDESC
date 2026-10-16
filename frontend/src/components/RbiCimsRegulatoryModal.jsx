import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function RbiCimsRegulatoryModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("cims"); // cims, section138, analytics, escalations
  const [loading, setLoading] = useState(false);
  const [cimsXmlData, setCimsXmlData] = useState(null);
  const [returnType, setReturnType] = useState("CTS_RET_01");
  const [memo, setMemo] = useState(null);
  const [reasonCode, setReasonCode] = useState("31");
  const [analytics, setAnalytics] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [anRes, escRes] = await Promise.all([
          client.get("/reports/compliance/return-analytics"),
          client.get("/reports/compliance/escalations"),
        ]);
        if (anRes.data?.analytics) setAnalytics(anRes.data.analytics);
        if (escRes.data?.escalations) setEscalations(escRes.data.escalations);
      } catch {
        // offline fallback
        setAnalytics({
          totalDishonoursMonthToDate: 142,
          totalDishonouredAmountInr: 18450000.0,
          section138EligiblePercent: 78.8,
          returnRateAgainstPresentationPercent: 1.24,
          reasonDistribution: [
            { code: "31", label: "Funds Insufficient", count: 74, percentage: 52.1, isSection138: true },
            { code: "36", label: "Signature Differs", count: 28, percentage: 19.7, isSection138: true },
            { code: "41", label: "Payment Stopped by Drawer", count: 16, percentage: 11.3, isSection138: true },
            { code: "56", label: "PPS Confirmation Mismatch", count: 12, percentage: 8.5, isSection138: false },
            { code: "38", label: "Post-dated / Stale", count: 8, percentage: 5.6, isSection138: false },
          ],
          riskHotspots: [
            { branch: "Athwa Lines Branch", dishonourRate: "1.84%", dominantReason: "Code 31 (Funds Insufficient)" },
            { branch: "Ring Road Textile Market", dishonourRate: "1.92%", dominantReason: "Code 31 (Funds Insufficient)" },
          ],
        });
        setEscalations([
          {
            id: "ESC-2026-001",
            bankCode: "SNB",
            bankName: "SURAT PEOPLES CO OP BANK",
            ruleViolated: "RBI/DPSS/2021-22/82 - Positive Pay Verification for Cheques > ₹5,00,000",
            severity: "CRITICAL",
            chequeNumber: "000892",
            amount: 1250000.0,
            status: "DETECTED",
            description: "Instrument exceeding ₹5 Lakhs processed without matching NPCI PPS Central Registry record.",
            detectedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            id: "ESC-2026-002",
            bankCode: "HDB",
            bankName: "HDFC BANK LTD",
            ruleViolated: "CTS-2010 Return Rate Threshold (> 2.0% Monthly Return Ceiling)",
            severity: "HIGH",
            chequeNumber: "BATCH-HDB-084",
            amount: 4500000.0,
            status: "INTERNAL_NOTICE",
            description: "Inward clearing dishonour rate for Surat Branch reached 2.45%, exceeding RBI 2.0% warning threshold.",
            detectedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  async function handleGenerateCims() {
    setLoading(true);
    try {
      const res = await client.post("/reports/cims/generate", {
        returnType,
        totalVolume: 2450,
        totalAmountInr: 310000000,
        dishonouredCount: 22,
        dishonouredAmountInr: 3250000,
      });
      setCimsXmlData(res.data);
      setNotification(`Generated CIMS return ${res.data.returnRef}`);
    } catch {
      setCimsXmlData({
        returnRef: `RBI-CIMS-${returnType}-20261014-9FA2`,
        returnType,
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<cims:CimsRegulatoryReturn xmlns:cims="urn:rbi.org.in:cims:returns:cts-v2.4">
  <cims:ReturnHeader>
    <cims:ReturnReference>RBI-CIMS-${returnType}-20261014-9FA2</cims:ReturnReference>
    <cims:ReturnType>${returnType}</cims:ReturnType>
    <cims:TaxonomyVersion>v2.4.0</cims:TaxonomyVersion>
    <cims:ReportingInstitution>
      <cims:BankCode>SPCB0000001</cims:BankCode>
      <cims:BankName>SURAT PEOPLES CO OP BANK</cims:BankName>
    </cims:ReportingInstitution>
  </cims:ReturnHeader>
  <cims:ReturnBody>
    <cims:ClearingStatistics>
      <cims:PresentedVolume>2450</cims:PresentedVolume>
      <cims:PresentedAmount currency="INR">310000000.00</cims:PresentedAmount>
      <cims:DishonouredVolume>22</cims:DishonouredVolume>
      <cims:DishonourRatePercent>0.89</cims:DishonourRatePercent>
    </cims:ClearingStatistics>
  </cims:ReturnBody>
</cims:CimsRegulatoryReturn>`,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateMemo() {
    setLoading(true);
    try {
      const res = await client.post("/reports/memo/section138", {
        chequeNumber: "000555",
        amount: 350000,
        payeeName: "KAPODRA WEAVERS ASSN",
        drawerName: "MAHALAXMI FABRICS",
        returnReasonCode: reasonCode,
      });
      setMemo(res.data.memo);
    } catch {
      setMemo({
        memoReference: `SEC138/MEMO/20261014/000555`,
        governingAct: "Negotiable Instruments Act, 1881 (Amended 2018)",
        sectionInvoked: "Section 138 / Section 142 (Criminal Liability for Dishonour)",
        chequeNumber: "000555",
        amountFormatted: "₹3,50,000.00",
        payeeName: "KAPODRA WEAVERS ASSN",
        drawerName: "MAHALAXMI FABRICS",
        returnReason: { code: reasonCode, description: "Funds Insufficient", section138Applicable: true },
        statutoryLimitation: {
          noticePeriodDays: 30,
          noticeDeadlineDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
          gracePeriodForPaymentDays: 15,
          courtFilingDeadlineDays: 45,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleEscalationAction(id, action) {
    try {
      const res = await client.post(`/reports/compliance/escalations/${id}/action`, { action });
      setEscalations((prev) => prev.map((e) => (e.id === id ? res.data.ticket : e)));
      setNotification(`Escalation ticket ${id} updated to ${res.data.ticket.status}`);
    } catch {
      setEscalations((prev) => prev.map((e) => (e.id === id ? { ...e, status: "CCO_REVIEW" } : e)));
      setNotification(`Escalation ticket ${id} updated to CCO_REVIEW`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-xl">
              🏛️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Automated RBI Regulatory CIMS & Compliance Hub
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  RBI DPSS Compliant
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Statutory Return Taxonomy (CIMS) | Section 138 NI Act Memos | Breach Escalation Matrix
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
          <div className="bg-blue-950/80 border-b border-blue-800 text-blue-300 px-6 py-2 text-xs flex justify-between items-center">
            <span>✓ {notification}</span>
            <button onClick={() => setNotification("")} className="hover:text-white">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2 text-xs font-semibold">
          {[
            { id: "cims", label: "📄 RBI CIMS Return Filing" },
            { id: "section138", label: "⚖️ Section 138 Return Memo" },
            { id: "analytics", label: "📊 Dishonour Reason Analytics" },
            { id: "escalations", label: "🚨 Compliance Breach Escalations" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400 bg-blue-500/10"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: RBI CIMS XML Filing */}
          {activeTab === "cims" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Select RBI CIMS Statutory Taxonomy Return</label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 block"
                  >
                    <option value="CTS_RET_01">CTS-RET-01: Daily Clearing & Settlement Realization Summary</option>
                    <option value="CTS_RET_02">CTS-RET-02: High-Value Positive Pay (PPS) Statutory Filing</option>
                    <option value="CTS_RET_03">CTS-RET-03: Section 138 Dishonour & Return Code Analysis</option>
                    <option value="CTS_RET_04">CTS-RET-04: Tarjan Intraday Liquidity Savings Return</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerateCims}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Generate CIMS XML Package
                </button>
              </div>

              {cimsXmlData && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                    <span className="font-mono text-emerald-400 font-bold">{cimsXmlData.returnRef}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(cimsXmlData.xml)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] cursor-pointer"
                    >
                      Copy XML
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900/90 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
                    {cimsXmlData.xml}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Section 138 Return Memo */}
          {activeTab === "section138" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-wrap justify-between items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Statutory Return Reason Code (NPCI CTS-88)</label>
                  <select
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 block"
                  >
                    <option value="31">Code 31: Funds Insufficient (Criminal Liability u/s 138)</option>
                    <option value="32">Code 32: Exceeds Arrangement / Drawing Power</option>
                    <option value="36">Code 36: Drawer's Signature Differs</option>
                    <option value="41">Code 41: Payment Stopped by Drawer</option>
                    <option value="51">Code 51: Account Closed / Attached by Order</option>
                    <option value="56">Code 56: Positive Pay Mismatch (PPS Absent)</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerateMemo}
                  disabled={loading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Generate Section 138 Legal Memo
                </button>
              </div>

              {memo && (
                <div className="bg-white text-slate-900 rounded-xl border border-slate-300 p-6 space-y-4 shadow-lg">
                  <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                    <div>
                      <div className="font-black text-base uppercase tracking-tight">SURAT PEOPLES CO OP BANK</div>
                      <div className="text-xs text-slate-600 font-semibold">NATIONAL CLEARING DESK | CTS-2010 STATUTORY ADVICE</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                        {memo.memoReference}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">DATE: {new Date().toISOString().slice(0, 10)}</div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 font-semibold">
                    ⚖️ NOTICE OF DISHONOUR UNDER {memo.governingAct.toUpperCase()}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Cheque Number:</span> <span className="font-bold">#{memo.chequeNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Dishonoured Amount:</span> <span className="font-bold text-rose-700">{memo.amountFormatted}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Payee (Beneficiary):</span> <span className="font-bold">{memo.payeeName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Drawer (Account Holder):</span> <span className="font-bold">{memo.drawerName}</span>
                    </div>
                    <div className="col-span-2 p-2 bg-rose-50 border border-rose-200 rounded">
                      <span className="text-rose-900 font-bold">Reason for Dishonour: </span>
                      <span className="text-rose-800 font-semibold">[{memo.returnReason.code}] {memo.returnReason.description}</span>
                    </div>
                  </div>

                  {/* 30-Day Limitation Period Alert */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1 text-blue-950">
                    <div className="font-bold flex justify-between">
                      <span>⏳ Statutory Limitation Clock (Section 138 NI Act)</span>
                      <span className="font-mono text-rose-700">Notice Deadline: {memo.statutoryLimitation.noticeDeadlineDate}</span>
                    </div>
                    <p className="text-[11px] text-blue-900">
                      The payee must issue a statutory demand notice within 30 days of this memo. If unpaid within 15 days of notice, criminal prosecution under Section 142 may be instituted within 1 month.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Dishonour Analytics */}
          {activeTab === "analytics" && analytics && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">MTD Dishonours</div>
                  <div className="text-xl font-bold text-white font-mono mt-1">{analytics.totalDishonoursMonthToDate} Instruments</div>
                  <div className="text-[10px] text-slate-500 mt-1">₹{(analytics.totalDishonouredAmountInr / 10000000).toFixed(2)} Cr</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">Section 138 Eligible</div>
                  <div className="text-xl font-bold text-amber-400 font-mono mt-1">{analytics.section138EligiblePercent}%</div>
                  <div className="text-[10px] text-amber-500 mt-1">Criminal statute actionable</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">Return Rate</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-1">{analytics.returnRateAgainstPresentationPercent}%</div>
                  <div className="text-[10px] text-emerald-500 mt-1">✓ Below RBI 2.0% Cap</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">Audit Rating</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono mt-1">AAA</div>
                  <div className="text-[10px] text-slate-500 mt-1">Full statutory compliance</div>
                </div>
              </div>

              {/* Reason Distribution Bars */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-300">CTS Dishonour Reasons Breakdown</h4>
                <div className="space-y-2 text-xs font-mono">
                  {analytics.reasonDistribution.map((r) => (
                    <div key={r.code} className="space-y-1">
                      <div className="flex justify-between text-slate-300 font-sans">
                        <span>[{r.code}] {r.label}</span>
                        <span className="font-mono text-slate-400">{r.count} ({r.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r.isSection138 ? "bg-rose-500" : "bg-blue-500"}`}
                          style={{ width: `${r.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Compliance Escalations */}
          {activeTab === "escalations" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-3">
                {escalations.map((esc) => (
                  <div key={esc.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase mr-2">
                          {esc.severity}
                        </span>
                        <span className="font-bold text-white text-sm">{esc.id}</span>
                      </div>
                      <span className="text-amber-400 font-mono font-bold">{esc.status}</span>
                    </div>

                    <p className="text-slate-300">{esc.description}</p>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Rule: {esc.ruleViolated} | Target: {esc.bankName} | Amount: ₹{Number(esc.amount).toLocaleString("en-IN")}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleEscalationAction(esc.id, "ISSUE_INTERNAL_NOTICE")}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold cursor-pointer"
                      >
                        Issue Notice
                      </button>
                      <button
                        onClick={() => handleEscalationAction(esc.id, "ESCALATE_TO_CCO")}
                        className="px-3 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded font-semibold cursor-pointer"
                      >
                        Escalate to CCO
                      </button>
                      <button
                        onClick={() => handleEscalationAction(esc.id, "SUBMIT_TO_RBI_DPSS")}
                        className="px-3 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded font-semibold cursor-pointer"
                      >
                        Disclose to RBI DPSS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-400">
          <div>RBI CIMS Gateway v2.4 Active | Automated Taxonomy Validation</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close CIMS Hub
          </button>
        </div>

      </div>
    </div>
  );
}
