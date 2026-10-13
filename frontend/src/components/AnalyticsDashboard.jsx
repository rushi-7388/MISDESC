import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await client.get("/admin/analytics");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500 text-xs">
        Compiling interbank financial intelligence analytics...
      </div>
    );
  }

  const { volumeTrends, returnReasonsDistribution, interbankFlows } = data;

  const maxDailyPresented = Math.max(...volumeTrends.map((d) => d.totalPresented), 5);

  const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#10b981"];

  return (
    <div className="space-y-6">
      {/* 7-Day Clearing Volume & Throughput Chart */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h3 className="font-bold text-sm text-gray-900">7-Day Clearing Velocity & Volume Trends</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Daily presented vs. successfully cleared cheques across participating financial institutions.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-3 h-3 rounded bg-brand-500 inline-block"></span> Presented
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Cleared
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 h-48 px-2">
          {volumeTrends.map((day, i) => {
            const presentedHeight = (day.totalPresented / maxDailyPresented) * 100;
            const clearedHeight = (day.totalCleared / maxDailyPresented) * 100;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="flex items-end gap-1.5 w-full justify-center h-40">
                  <div
                    style={{ height: `${Math.max(presentedHeight, 6)}%` }}
                    className="w-4 bg-brand-500 hover:bg-brand-600 rounded-t transition-all cursor-pointer relative group"
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {day.totalPresented} presented
                    </div>
                  </div>
                  <div
                    style={{ height: `${Math.max(clearedHeight, 4)}%` }}
                    className="w-4 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all cursor-pointer relative group"
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {day.totalCleared} cleared
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-gray-500">{day.dayName}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Return Reasons Breakdown + Interbank Flow Heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Return Reasons Distribution */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <h3 className="font-bold text-sm text-gray-900 mb-1">Cheque Return Reasons Breakdown</h3>
          <p className="text-xs text-gray-500 mb-5">
            Distribution of return codes issued under Section 138 / MISDESC-2010 rules.
          </p>

          <div className="space-y-3">
            {returnReasonsDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-700">{item.reason}</span>
                  <span className="font-bold text-gray-900">
                    {item.percent}% <span className="text-gray-400 font-normal">({item.count})</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: colors[idx % colors.length],
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interbank Liquidity Flow Matrix */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <h3 className="font-bold text-sm text-gray-900 mb-1">Interbank Liquidity Settlement Matrix</h3>
          <p className="text-xs text-gray-500 mb-5">
            Net capital flow and clearing volume between participating bank nodes.
          </p>

          <div className="space-y-3">
            {interbankFlows && interbankFlows.length > 0 ? (
              interbankFlows.map((flow, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">{flow.presentingBank}</span>
                    <span className="text-gray-400 font-bold">→</span>
                    <span className="font-bold text-brand-900">{flow.draweeBank}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-gray-200">
                    <span className="text-gray-500 font-mono text-[11px]">{flow.chequeCount} instruments settled</span>
                    <span className="font-bold text-emerald-700 font-mono text-sm">
                      ₹{flow.clearedVolume.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-100 text-xs text-brand-900">
                <div className="font-bold mb-1">Bilateral Clearing Channel Active</div>
                <p className="text-[11px] text-brand-700">
                  Surat Bank (SBIN0001234) ↔ Horizon Digital Bank (HDFC0005678). Bilateral clearing volume will reflect here as cheques are cleared and reconciled.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
