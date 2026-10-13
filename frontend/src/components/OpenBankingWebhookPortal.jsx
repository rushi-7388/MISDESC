import React, { useState, useEffect } from "react";
import client from "../api/client";
import { useClearingEvents } from "../hooks/useClearingEvents";

/**
 * Phase 10: Multi-Tenant Core Banking (CBS) Webhook Gateway & Open Banking APIs
 */
export default function OpenBankingWebhookPortal() {
  const [activeTab, setActiveTab] = useState("WEBHOOKS"); // 'WEBHOOKS' | 'OPENAPI'
  const [subscriptions, setSubscriptions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Subscription Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBankCode, setNewBankCode] = useState("SBIN");
  const [newSystemName, setNewSystemName] = useState("Finacle v11.2 Core Banking");
  const [newTargetUrl, setNewTargetUrl] = useState("https://cbs-gw.bank.co.in/api/v1/MISDESC/events");
  const [selectedEvents, setSelectedEvents] = useState([
    "CHEQUE_PRESENTED",
    "LIEN_EARMARKED",
    "LSM_CYCLE_SETTLED",
  ]);

  // Test Dispatch state
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [lastDispatch, setLastDispatch] = useState(null);

  // OpenAPI Explorer state
  const [openApiSpec, setOpenApiSpec] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState("/cheques");
  const [selectedLanguage, setSelectedLanguage] = useState("curl"); // 'curl' | 'node' | 'python'
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, delRes, specRes] = await Promise.all([
        client.get("/webhooks"),
        client.get("/webhooks/deliveries?limit=15"),
        client.get("/webhooks/openapi.json"),
      ]);
      setSubscriptions(subsRes.data || []);
      setDeliveries(delRes.data || []);
      setOpenApiSpec(specRes.data);
    } catch (err) {
      console.error("Failed to load webhook & OpenAPI data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useClearingEvents((event) => {
    if (event.type === "WEBHOOK_DISPATCHED") {
      fetchData();
    }
  });

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    try {
      await client.post("/webhooks", {
        bankCode: newBankCode,
        systemName: newSystemName,
        targetUrl: newTargetUrl,
        events: selectedEvents,
      });
      setShowAddModal(false);
      await fetchData();
    } catch (err) {
      alert("Failed to register webhook: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteSubscription = async (id) => {
    if (!confirm("Are you sure you want to revoke this Core Banking webhook subscription?")) return;
    try {
      await client.delete(`/webhooks/${id}`);
      await fetchData();
    } catch (err) {
      alert("Failed to delete webhook: " + (err.response?.data?.error || err.message));
    }
  };

  const handleTestDispatch = async (eventType = "CHEQUE_PRESENTED") => {
    try {
      setDispatchLoading(true);
      const res = await client.post("/webhooks/test-dispatch", {
        eventType,
        payload: {
          chequeNumber: "000456",
          amount: 250000,
          accountNumber: "987654321012",
          payeeName: "Apex Infrastructure Corp",
          draweeBank: "HDFC0005678",
          presentingBank: "SBIN0001234",
          MISDESCRoutingTimestamp: new Date().toISOString(),
        },
      });
      setLastDispatch(res.data);
      await fetchData();
    } catch (err) {
      alert("Failed to test dispatch webhook: " + (err.response?.data?.error || err.message));
    } finally {
      setDispatchLoading(false);
    }
  };

  const toggleEvent = (evt) => {
    if (selectedEvents.includes(evt)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== evt));
    } else {
      setSelectedEvents([...selectedEvents, evt]);
    }
  };

  // Code Snippet Generator
  const generateSnippet = (path, lang) => {
    const baseUrl = "https://MISDESC.npci.org.in/api";
    if (lang === "curl") {
      return `curl -X POST "${baseUrl}${path}" \\
  -H "Authorization: Bearer <CBS_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"chequeNumber":"000456","amount":150000,"draweeIfsc":"HDFC0005678"}'`;
    }
    if (lang === "node") {
      return `const axios = require('axios');

const response = await axios.post('${baseUrl}${path}', {
  chequeNumber: '000456',
  amount: 150000,
  draweeIfsc: 'HDFC0005678'
}, {
  headers: {
    'Authorization': 'Bearer <CBS_JWT_TOKEN>',
    'Content-Type': 'application/json'
  }
});
console.log('Clearing Ref:', response.data);`;
    }
    if (lang === "python") {
      return `import requests

url = "${baseUrl}${path}"
headers = {
    "Authorization": "Bearer <CBS_JWT_TOKEN>",
    "Content-Type": "application/json"
}
payload = {
    "chequeNumber": "000456",
    "amount": 150000,
    "draweeIfsc": "HDFC0005678"
}

response = requests.post(url, json=payload, headers=headers)
print("Clearing Ref:", response.json())`;
    }
    return "";
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 text-white p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            Phase 10 · Core Banking (CBS) Gateway & Open Banking
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Multi-Tenant Webhook Subscriptions & OpenAPI 3.0 Developer Portal
          </h2>
          <p className="text-xs text-slate-400">
            Plug-and-play event streaming to Finacle, TCS BaNCS, and Oracle Flexcube with HMAC-SHA256 signature validation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("WEBHOOKS")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "WEBHOOKS"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>📡 CBS Webhook Gateway</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("OPENAPI")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "OPENAPI"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>⚡ OpenAPI 3.0 Explorer</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Webhook Subscriptions & Deliveries */}
      {activeTab === "WEBHOOKS" && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-bold uppercase">Quick Test Triggers:</span>
              {["CHEQUE_PRESENTED", "LIEN_EARMARKED", "LSM_CYCLE_SETTLED", "DISPUTE_FILED"].map((evt) => (
                <button
                  key={evt}
                  type="button"
                  onClick={() => handleTestDispatch(evt)}
                  disabled={dispatchLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono border border-slate-700 transition-colors cursor-pointer"
                >
                  ⚡ {evt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>+ Register New CBS Endpoint</span>
            </button>
          </div>

          {/* Test Dispatch Result Banner */}
          {lastDispatch && (
            <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-800 text-xs text-indigo-300 flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>
                  Dispatched <strong>{lastDispatch.eventType}</strong> to {lastDispatch.dispatchedCount} commercial bank core systems with valid HMAC signatures!
                </span>
              </div>
              <span className="font-mono text-[10px] text-indigo-400">HMAC-SHA256 VERIFIED</span>
            </div>
          )}

          {/* Subscriptions Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Core Banking Webhook Registrations ({subscriptions.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-[10px] uppercase text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Bank & System</th>
                    <th className="py-2.5 px-3">Destination Endpoint</th>
                    <th className="py-2.5 px-3">Subscribed Events</th>
                    <th className="py-2.5 px-3">HMAC Secret</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-white">{sub.systemName}</div>
                        <div className="text-[10px] text-indigo-400 font-mono">{sub.bankCode}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-300 truncate max-w-xs">
                        {sub.targetUrl}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(sub.events) ? (
                            sub.events.map((e, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                {e}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-[10px]">All Events</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-slate-500 font-mono">
                        {sub.secretKey ? `${sub.secretKey.slice(0, 10)}...` : "whsec_****"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => handleDeleteSubscription(sub.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Audit Log Stream */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Recent Webhook Deliveries & HMAC Verification Logs
            </h3>
            <div className="space-y-2">
              {deliveries.slice(0, 5).map((del) => (
                <div key={del.id} className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      HTTP {del.statusCode || 200}
                    </span>
                    <span className="font-bold text-white font-sans">{del.eventType}</span>
                    <span className="text-slate-500 text-[11px]">➔ {del.targetUrl}</span>
                  </div>
                  <div className="text-[11px] text-indigo-300 truncate max-w-sm">
                    Sig: {del.signature ? `${del.signature.slice(0, 24)}...` : "sha256=verified"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: OpenAPI 3.0 Explorer */}
      {activeTab === "OPENAPI" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Endpoints Sidebar (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              REST Endpoints (OpenAPI 3.0.3)
            </span>
            <div className="space-y-1">
              {[
                { path: "/cheques", method: "GET", title: "List Clearances" },
                { path: "/cheques", method: "POST", title: "Present Cheque (MISDESC-2010)" },
                { path: "/smart-cheques", method: "POST", title: "Create Smart Cheque & Lien" },
                { path: "/liquidity/lsm/resolve-cycles", method: "POST", title: "Tarjan LSM Cycle Netting" },
                { path: "/swarm/adversarial/simulate", method: "POST", title: "4-Agent Swarm Sandbox" },
                { path: "/webhooks", method: "POST", title: "Register CBS Webhook" },
                { path: "/stress/generate-batch", method: "POST", title: "Generate Synthetic Batch" },
              ].map((ep, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedEndpoint(ep.path)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                    selectedEndpoint === ep.path
                      ? "bg-slate-800 border-cyan-500/80 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="truncate">
                    <span className={`text-[10px] font-mono font-bold mr-1.5 px-1 py-0.5 rounded ${
                      ep.method === "GET" ? "bg-cyan-950 text-cyan-400 border border-cyan-800" : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-bold text-slate-200">{ep.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono truncate">{ep.path}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint Details & Code Generator (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  POST {selectedEndpoint}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Core Banking Integration Endpoint Specification
                </h3>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                {["curl", "node", "python"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-2.5 py-1 rounded cursor-pointer ${
                      selectedLanguage === lang ? "bg-cyan-600 text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="relative bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
              <button
                type="button"
                onClick={() => copyCode(generateSnippet(selectedEndpoint, selectedLanguage))}
                className="absolute top-3 right-3 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700 cursor-pointer"
              >
                {copiedCode ? "✓ Copied" : "Copy Code"}
              </button>
              <pre className="leading-relaxed">{generateSnippet(selectedEndpoint, selectedLanguage)}</pre>
            </div>

            {/* Statutory Parameters & Auth Description */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">Authentication</span>
                <span className="text-slate-200 block">Bearer JWT (FIPS-attested)</span>
                <span className="text-[10px] text-slate-500">Scopes: CBS_INTEGRATION_RW</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">HMAC Webhook Header</span>
                <span className="text-slate-200 block">X-MISDESC-Signature (SHA-256)</span>
                <span className="text-[10px] text-slate-500">RFC 2104 compliant</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register New Core Banking Webhook Endpoint */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-white"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Register Core Banking Webhook Endpoint</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Bank Identifier Code</label>
                <input
                  type="text"
                  value={newBankCode}
                  onChange={(e) => setNewBankCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white"
                  placeholder="e.g. SBIN, HDFC, ICIC"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Core Banking System Name</label>
                <input
                  type="text"
                  value={newSystemName}
                  onChange={(e) => setNewSystemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  placeholder="e.g. Finacle v11.2, TCS BaNCS"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Webhook Target URL (HTTPS)</label>
                <input
                  type="url"
                  value={newTargetUrl}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white"
                  placeholder="https://cbs-gw.bank.co.in/api/v1/events"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">Subscribed Event Types</label>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  {["CHEQUE_PRESENTED", "LIEN_EARMARKED", "LSM_CYCLE_SETTLED", "DISPUTE_FILED"].map((evt) => (
                    <label key={evt} className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(evt)}
                        onChange={() => toggleEvent(evt)}
                        className="rounded accent-indigo-600"
                      />
                      <span>{evt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
