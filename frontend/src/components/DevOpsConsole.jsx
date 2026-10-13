import React, { useEffect, useState } from "react";
import client from "../api/client";
import { reportError } from "../utils/telemetry";

export default function DevOpsConsole() {
  const [stats, setStats] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dbPingResult, setDbPingResult] = useState(null);
  const [pingingDb, setPingingDb] = useState(false);
  const [chaosActionMessage, setChaosActionMessage] = useState(null);
  const [probeResult, setProbeResult] = useState(null);

  async function loadData() {
    try {
      const [statsRes, infoRes, telemRes] = await Promise.allSettled([
        client.get("/devops/sre-stats"),
        client.get("/devops/system-info"),
        client.get("/telemetry/recent"),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (infoRes.status === "fulfilled") setSystemInfo(infoRes.value.data);
      if (telemRes.status === "fulfilled") setTelemetry(telemRes.value.data);
    } catch (err) {
      console.error("Failed to load DevOps stats:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function handlePingDb() {
    setPingingDb(true);
    try {
      const res = await client.get("/devops/db-ping");
      setDbPingResult(res.data);
    } catch (err) {
      setDbPingResult({ success: false, error: err.response?.data?.error || err.message });
    } finally {
      setPingingDb(false);
    }
  }

  async function applyChaos(config, label) {
    try {
      const res = await client.post("/devops/chaos", config);
      setChaosActionMessage(`Action applied: ${label}`);
      loadData();
      setTimeout(() => setChaosActionMessage(null), 4000);
    } catch (err) {
      setChaosActionMessage(`Failed to apply chaos: ${err.message}`);
    }
  }

  async function handleResetChaos() {
    try {
      await client.post("/devops/chaos/reset");
      setChaosActionMessage("All chaos simulations reset. System restored to baseline.");
      loadData();
      setTimeout(() => setChaosActionMessage(null), 4000);
    } catch (err) {
      setChaosActionMessage(`Failed to reset chaos: ${err.message}`);
    }
  }

  async function sendProbeRequest() {
    const start = Date.now();
    try {
      const res = await client.get("/cheques");
      setProbeResult({
        status: res.status,
        durationMs: Date.now() - start,
        success: true,
      });
    } catch (err) {
      setProbeResult({
        status: err.response?.status || 500,
        durationMs: Date.now() - start,
        success: false,
        message: err.response?.data?.error || err.message,
      });
    }
  }



  if (loading && !stats) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
        Loading real-time SRE metrics & observability telemetry...
      </div>
    );
  }

  const isChaosActive = stats?.chaos?.enabled;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isChaosActive ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`}></span>
            <span className="font-bold text-gray-900 text-sm tracking-wide uppercase">
              {isChaosActive ? "Chaos Simulation Active" : "Operational: All Systems Nominal"}
            </span>
          </div>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs text-gray-500">
            Node: <span className="font-mono">{stats?.system?.nodeVersion}</span>
          </span>
          <span className="text-xs text-gray-500">
            Uptime: <span className="font-mono">{stats?.system?.uptimeSeconds}s</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-brand-600"
            />
            Live 3s Polling
          </label>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {chaosActionMessage && (
        <div className="bg-brand-50 border border-brand-200 text-brand-900 px-4 py-2.5 rounded-lg text-xs font-medium animate-in fade-in duration-150">
          {chaosActionMessage}
        </div>
      )}

      {/* SRE Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SLO & Error Budget */}
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-brand-500">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            99.9% Target SLO
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-gray-900">
              {stats?.slo?.currentAvailabilityPercent}%
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Target 99.9%
            </span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Error Budget Remaining</span>
              <span className="font-bold">{stats?.slo?.errorBudgetPercentRemaining}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  stats?.slo?.errorBudgetPercentRemaining > 50
                    ? "bg-emerald-500"
                    : stats?.slo?.errorBudgetPercentRemaining > 20
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${stats?.slo?.errorBudgetPercentRemaining}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Latency Percentiles */}
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-indigo-500">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Response Latency
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-gray-900">
              {stats?.latency?.p95} <span className="text-sm font-normal text-gray-400">ms</span>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              P95 Latency
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 text-center text-xs pt-1 border-t">
            <div>
              <div className="text-gray-400 text-[10px]">P50</div>
              <div className="font-bold text-gray-700">{stats?.latency?.p50}ms</div>
            </div>
            <div>
              <div className="text-gray-400 text-[10px]">P99</div>
              <div className="font-bold text-gray-700">{stats?.latency?.p99}ms</div>
            </div>
            <div>
              <div className="text-gray-400 text-[10px]">Avg</div>
              <div className="font-bold text-gray-700">{stats?.latency?.avg}ms</div>
            </div>
          </div>
        </div>

        {/* Throughput & Volume */}
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Throughput & Volume
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-gray-900">
              {stats?.throughput?.totalRequests}
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
              {stats?.throughput?.requestsPerSecond} req/s
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-1 border-t">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
              2xx: {stats?.throughput?.byStatus["2xx"]}
            </span>
            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">
              4xx: {stats?.throughput?.byStatus["4xx"]}
            </span>
            <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-mono">
              5xx: {stats?.throughput?.byStatus["5xx"]}
            </span>
          </div>
        </div>

        {/* Memory & MTTC */}
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-teal-500">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Runtime Resources
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-gray-900">
              {stats?.resources?.heapUsedMb} <span className="text-sm font-normal text-gray-400">MB</span>
            </div>
            <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
              Heap Used
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-1 border-t text-gray-600">
            <span>RSS: {stats?.resources?.rssMb} MB</span>
            <span>MTTC: {stats?.clearingMetrics?.mttcSeconds}s</span>
          </div>
        </div>
      </div>

      {/* Chaos Engineering & Resilience Control Panel */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              System Fault Injection & Resilience Testing
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify circuit breakers, timeout thresholds, and telemetry ingestion under load
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetChaos}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Restore Normal Operations
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          {/* Fault 1: High Latency */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-xs font-bold text-gray-800 mb-1">Simulate DB Network Lag</div>
            <p className="text-[11px] text-gray-500 mb-3">
              Injects +1200ms synthetic delay to test request timeout handling.
            </p>
            <button
              onClick={() => applyChaos({ latencyMs: 1200 }, "1200ms Latency Injection")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
            >
              Inject +1200ms Lag
            </button>
          </div>

          {/* Fault 2: 500 Error Spike */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-xs font-bold text-gray-800 mb-1">Simulate 500 Error Storm</div>
            <p className="text-[11px] text-gray-500 mb-3">
              Forces 40% of incoming API requests to fail with HTTP 500.
            </p>
            <button
              onClick={() => applyChaos({ errorRate: 0.4 }, "40% Synthetic 500 Failure Rate")}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
            >
              Inject 40% Error Spike
            </button>
          </div>

          {/* Fault 3: Circuit Breaker Trip */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-800">Core Circuit Breaker</span>
                {stats?.chaos?.circuitBreakerTripped ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    {stats?.chaos?.circuitState || "OPEN"} ({stats?.chaos?.remainingCooldownSeconds || 0}s)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    CLOSED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mb-3">
                {stats?.chaos?.circuitBreakerTripped
                  ? `Active: Downstream requests return 503 to prevent cascading failure. Auto-recovers in ${stats?.chaos?.remainingCooldownSeconds || 0}s.`
                  : "Trips circuit breaker to OPEN state, halting downstream calls with 503 (auto-recovers after 15s)."}
              </p>
            </div>
            {stats?.chaos?.circuitBreakerTripped ? (
              <button
                type="button"
                onClick={handleResetChaos}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
              >
                Restore Circuit Breaker (Now)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => applyChaos({ circuitBreakerTripped: true }, "Circuit Breaker Tripped OPEN (15s auto-cooldown)")}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
              >
                Trip Circuit Breaker
              </button>
            )}
          </div>

          {/* Live Probe Tester */}
          <div className="p-4 rounded-lg bg-brand-50/50 border border-brand-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-brand-900 mb-1">Test Resilience Probe</div>
              <p className="text-[11px] text-brand-700 mb-3">
                Fires a live request through the stack to observe the active fault.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={sendProbeRequest}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
              >
                Send Live Probe
              </button>
              {probeResult && (
                <div className="mt-2 text-[11px] font-mono p-2 rounded bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>
                      Status:{" "}
                      <span
                        className={
                          probeResult.status === 200
                            ? "text-emerald-600 font-bold"
                            : probeResult.status === 503
                            ? "text-amber-600 font-bold"
                            : "text-rose-600 font-bold"
                        }
                      >
                        {probeResult.status}
                      </span>
                    </span>
                    <span className="text-gray-400 text-[10px]">{probeResult.durationMs}ms</span>
                  </div>
                  {probeResult.status === 503 && (
                    <div className="text-[10px] text-amber-700 font-sans leading-tight">
                      Circuit Breaker OPEN: Downstream Core Banking call blocked to prevent cascade failure.
                    </div>
                  )}
                  {probeResult.status === 200 && (
                    <div className="text-[10px] text-emerald-700 font-sans leading-tight">
                      Downstream Core Banking pipeline healthy (HTTP 200 OK).
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Database Health & System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Health & Ping */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <h3 className="text-sm font-bold text-gray-900">PostgreSQL Database Diagnostics</h3>
            <button
              onClick={handlePingDb}
              disabled={pingingDb}
              className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white text-xs rounded transition-colors disabled:opacity-50"
            >
              {pingingDb ? "Pinging..." : "Ping Database"}
            </button>
          </div>

          {dbPingResult && (
            <div className={`p-3 rounded-lg text-xs font-mono mb-4 ${dbPingResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
              {dbPingResult.success ? (
                <div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Connection Active · Roundtrip Latency: <span className="font-bold">{dbPingResult.latencyMs}ms</span></span>
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1">DB: {dbPingResult.database}</div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Ping Failed: {dbPingResult.error}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded bg-gray-50 border">
              <div className="text-gray-500">Database Engine</div>
              <div className="font-bold text-gray-900 mt-0.5">{systemInfo?.database?.provider}</div>
            </div>
            <div className="p-2.5 rounded bg-gray-50 border">
              <div className="text-gray-500">Cheques Recorded</div>
              <div className="font-bold text-gray-900 mt-0.5">{systemInfo?.tableCounts?.cheques}</div>
            </div>
            <div className="p-2.5 rounded bg-gray-50 border">
              <div className="text-gray-500">Clearing Batches</div>
              <div className="font-bold text-gray-900 mt-0.5">{systemInfo?.tableCounts?.batches}</div>
            </div>
            <div className="p-2.5 rounded bg-gray-50 border">
              <div className="text-gray-500">Telemetry Logs</div>
              <div className="font-bold text-gray-900 mt-0.5">{systemInfo?.tableCounts?.telemetryEvents}</div>
            </div>
          </div>
        </div>

        {/* Live Telemetry & Error Stream */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <h3 className="text-sm font-bold text-gray-900">Real-Time Telemetry & Exception Stream</h3>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {telemetry && telemetry.length > 0 ? (
              telemetry.map((t) => (
                <div key={t.id} className="p-2 rounded bg-gray-50 border border-gray-100 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-mono uppercase font-bold text-rose-600">{t.level}</span>
                    <span>{new Date(t.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="font-medium text-gray-800 mt-0.5 truncate">{t.message}</div>
                  {t.url && <div className="text-[10px] text-gray-400 truncate mt-0.5">{t.url}</div>}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 text-center py-8">
                No exceptions reported. Telemetry pipeline clean.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
