import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";

const ROLE_HOME = {
  PRESENTING_BANK: "/presenting",
  DRAWEE_BANK: "/drawee",
  ADMIN: "/admin",
  BRANCH_MANAGER: "/branch-manager",
  IT_STAFF: "/it-monitoring",
  COMPLIANCE_AUDITOR: "/auditor",
  SETTLEMENT_OFFICER: "/settlement",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-IN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(timeStr);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      const destination = ROLE_HOME[user.role] || "/";
      navigate(destination);
    } catch (err) {
      console.error("Login failed:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Unable to connect to MISDESC backend server. Verify service status."
          : "Invalid email or password. Please verify credentials.");
      setError(message);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="fixed inset-0 flex flex-col justify-between bg-[#080c14] text-slate-100 overflow-y-auto lg:overflow-hidden select-none">
      {/* Background Decorative Mesh & Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-600/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-600/8 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 px-5 sm:px-8 py-3 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="MISDESC Emblem"
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700/80 shadow-md shadow-brand-950/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base">MISDESC</span>
              <span className="text-slate-600 text-xs">|</span>
              <span className="text-xs font-semibold text-slate-200 tracking-wide">
                Cheque Truncation System
              </span>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-brand-950/80 border border-brand-800/70 text-brand-300">
                MISDESC-2010
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              National Interbank Clearing Gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded text-[11px] font-medium bg-emerald-950/50 border border-emerald-800/60 text-emerald-300">
            <span className="font-mono">{currentTime || "ONLINE"} IST</span>
            <span className="text-emerald-700">·</span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono">
              Switch 01 Active
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
              ISO 20022
            </span>
            <span className="text-[11px] text-slate-500">256-bit TLS</span>
          </div>
        </div>
      </header>

      {/* Main Viewport Content: Unified Single Card */}
      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 md:min-h-[480px]">
          {/* Left Side: Sign In Form */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div className="border-b border-slate-800 bg-slate-950/60 px-6 py-3.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Operator Authentication
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-5 flex-1 flex flex-col justify-center">
              {error && (
                <div className="bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs rounded-xl p-3.5">
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Bank ID / Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono transition-colors"
                    placeholder="presenting@snb.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-14 py-2 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono transition-colors"
                      placeholder="••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer px-1 py-0.5 rounded"
                      tabIndex={-1}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberTerminal}
                      onChange={(e) => setRememberTerminal(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Remember Workstation Terminal</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-semibold rounded-lg py-2.5 text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Side: MISDESC Emblem & Institutional Details */}
          <div className="md:col-span-5 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <img
                src={logo}
                alt="MISDESC Emblem"
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-700 shadow-md"
              />
            </div>

            <h3 className="text-base font-bold text-white tracking-tight">
              Cheque Truncation System
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              National Interbank Clearing Corporation of India
            </p>

            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                MISDESC-2010
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                ISO 20022
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                e-Kuber
              </span>
            </div>

            <div className="mt-4 px-3 py-1 rounded text-[10px] font-medium bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono">
              Central Switch Active
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Legal & Regulatory Footer */}
      <footer className="relative z-10 px-5 sm:px-8 py-2 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-950 flex-shrink-0 flex flex-wrap items-center justify-between gap-2">
        <span>Cheque Truncation System (MISDESC) · National Clearing Gateway</span>
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-mono text-slate-400">
          <span>SHA-256 Ledger</span>
          <span>•</span>
          <span>ISO 20022 XML</span>
          <span>•</span>
          <span>Continuous Clearing</span>
        </div>
      </footer>
    </div>
  );
}
