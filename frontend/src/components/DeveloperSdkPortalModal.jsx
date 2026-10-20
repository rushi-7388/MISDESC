import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function DeveloperSdkPortalModal({ isOpen, onClose }) {
  const [activeLang, setActiveLang] = useState("javascript");
  const [keys, setKeys] = useState([]);
  const [examples, setExamples] = useState(null);
  const [clientName, setClientName] = useState("My Indian FinTech App");
  const [tier, setTier] = useState("DEVELOPER_SANDBOX");
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      fetchExamples();
    }
  }, [isOpen]);

  async function fetchKeys() {
    try {
      const res = await client.get("/sdk/keys");
      setKeys(res.data.keys || []);
    } catch (err) {
      console.error("Failed to fetch keys:", err);
    }
  }

  async function fetchExamples() {
    try {
      const res = await client.get("/sdk/examples");
      setExamples(res.data);
    } catch (err) {
      console.error("Failed to fetch examples:", err);
    }
  }

  async function handleGenerateKey(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post("/sdk/keys/generate", { clientName, tier });
      await fetchKeys();
      setClientName("");
    } catch (err) {
      alert("Key generation failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text, id) {
    navigator.clipboard?.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-teal-500/40 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-teal-500/30 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/60 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 bg-teal-500/20 text-teal-400 border border-teal-500/40 rounded-xl text-xl font-bold shadow-inner">
              ⚡ SDK
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                Sovereign Developer SDK & Embedded Financial Protocol
                <span className="text-xs bg-teal-950 border border-teal-500/50 text-teal-300 px-2 py-0.5 rounded-full font-mono">
                  PILLAR 6
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Embed instant clearing, acoustic sound vouchers, and programmable e-Rupee in 3 lines of code
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

        {/* Tab Navigator */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          {["javascript", "python", "curl"].map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={`py-3 px-4 font-bold text-xs border-b-2 uppercase transition ${
                activeLang === lang
                  ? "border-teal-500 text-teal-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {lang === "javascript" ? "Node.js / React (TypeScript)" : lang}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quick Install Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2 text-teal-300">
              <span className="text-slate-400">$</span>
              <span>npm install @misdesc/sdk</span>
            </div>
            <button
              onClick={() => copyToClipboard("npm install @misdesc/sdk", "install")}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700 transition"
            >
              {copiedKey === "install" ? "✓ Copied" : "Copy"}
            </button>
          </div>

          {/* Code Viewer */}
          <div className="bg-black/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto relative shadow-inner">
            <button
              onClick={() => copyToClipboard(examples?.[activeLang] || "", "code")}
              className="absolute top-3 right-3 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800/80 rounded border border-slate-700 transition"
            >
              {copiedKey === "code" ? "✓ Copied" : "Copy Code"}
            </button>
            <pre>{examples?.[activeLang] || "// Loading code snippets..."}</pre>
          </div>

          {/* API Key Provisioning */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Generate Sovereign API Access Key</span>
              <span className="text-xs text-slate-400 font-normal">Instant developer credentials</span>
            </h3>

            <form onSubmit={handleGenerateKey} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Application Name / Startup Entity</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Surat AgriTech Solutions"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Access Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="DEVELOPER_SANDBOX">Developer Sandbox (250 req/s)</option>
                  <option value="SOVEREIGN_PARTICIPANT_UNLIMITED">Sovereign Live (5,000 req/s)</option>
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition"
                >
                  {loading ? "Issuing..." : "🔑 Issue New API Key"}
                </button>
              </div>
            </form>

            {/* Keys Table */}
            <div className="mt-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Credentials</div>
              <div className="space-y-2">
                {keys.map((k) => (
                  <div
                    key={k.keyId}
                    className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{k.clientName}</div>
                      <div className="font-mono text-teal-400 text-[11px] truncate mt-0.5">{k.apiKey}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        {k.tier}
                      </span>
                      <button
                        onClick={() => copyToClipboard(k.apiKey, k.keyId)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded transition"
                      >
                        {copiedKey === k.keyId ? "✓ Copied" : "Copy Key"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
