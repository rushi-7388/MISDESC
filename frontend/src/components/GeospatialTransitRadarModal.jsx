import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function GeospatialTransitRadarModal({ onClose }) {
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedVan, setSelectedVan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockdownLoading, setLockdownLoading] = useState(false);
  const [alertNotice, setAlertNotice] = useState(null);
  const [radarAngle, setRadarAngle] = useState(0);

  const fetchTelemetry = async () => {
    try {
      const res = await client.get("/innovations/transit/telemetry");
      setVehicles(res.data.telemetry || []);
      setBranches(res.data.branches || []);
      if (!selectedVan && res.data.telemetry?.length > 0) {
        setSelectedVan(res.data.telemetry[0]);
      } else if (selectedVan) {
        // preserve selected van update
        const updated = res.data.telemetry?.find((v) => v.vanId === selectedVan.vanId);
        if (updated) setSelectedVan(updated);
      }
    } catch (err) {
      console.error("Telemetry fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(interval);
  }, []);

  // Radar sweep animation
  useEffect(() => {
    const sweep = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 40);
    return () => clearInterval(sweep);
  }, []);

  const handleLockdown = async (vanId) => {
    if (!window.confirm("⚠️ ARMED ESCORT PROTOCOL ALERT: Are you sure you want to engage remote solenoid vault lockdown? This will immediately halt vehicle engine ignition and dispatch local armed police units!")) {
      return;
    }

    try {
      setLockdownLoading(true);
      const res = await client.post(`/innovations/transit/lockdown/${vanId}`);
      setAlertNotice({
        type: "EMERGENCY_LOCKDOWN",
        message: res.data.message || "Lockdown engaged successfully!",
      });
      await fetchTelemetry();
    } catch (err) {
      alert(err.response?.data?.error || "Lockdown trigger failed");
    } finally {
      setLockdownLoading(false);
    }
  };

  // Radar projection helper: projects lat/lng to SVG canvas coords
  // Center roughly at Surat (21.17, 72.83)
  const getRadarCoords = (lat, lng, centerLat = 21.18, centerLng = 72.83, scale = 160) => {
    const cx = 200;
    const cy = 200;
    const dx = (lng - centerLng) * scale;
    const dy = (centerLat - lat) * scale;
    return {
      x: Math.max(20, Math.min(380, cx + dx)),
      y: Math.max(20, Math.min(380, cy + dy)),
    };
  };

  const totalCarriedAcrossFleet = vehicles.reduce((acc, v) => acc + (v.totalCarriedValue || 0), 0);
  const totalInstrumentsCount = vehicles.reduce((acc, v) => acc + (v.instrumentsCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shadow-inner">
              🗺️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                  Geospatial Branch Radar & Armed CIT Escort
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                  NAVIC LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Surat Peoples Co-Op Bank • South Gujarat & Western Clearing Transit Corridor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTelemetry}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔄</span> Refresh Telemetry
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-700 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Global Alert Notice if Lockdown engaged */}
        {alertNotice && (
          <div className="bg-rose-950/80 border-b border-rose-600/50 px-6 py-2.5 flex items-center justify-between text-rose-200 text-xs font-semibold animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-base">🚨</span>
              <span>{alertNotice.message}</span>
            </div>
            <button
              onClick={() => setAlertNotice(null)}
              className="text-rose-400 hover:text-white text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[11px] text-slate-400 block font-medium">Active CIT Convoys</span>
            <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
              {vehicles.length} Armored Vans
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[11px] text-slate-400 block font-medium">Transit Instruments</span>
            <span className="text-base font-black text-blue-400 font-mono mt-0.5 block">
              {totalInstrumentsCount} Cheques & Drafts
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[11px] text-slate-400 block font-medium">Secured In-Transit Value</span>
            <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
              ₹{(totalCarriedAcrossFleet / 10000000).toFixed(2)} Crore
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[11px] text-slate-400 block font-medium">Clearing Hubs Linked</span>
            <span className="text-base font-black text-purple-400 font-mono mt-0.5 block">
              {branches.length} Nodes (Surat/BOM/AHM)
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Interactive Radar Canvas */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] shadow-2xl">
              <div className="absolute top-3 left-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400">
                  SURAT-MUMBAI CIT AIR/GROUND SWEEP
                </span>
              </div>
              <div className="absolute top-3 right-4 text-[10px] font-mono text-slate-500">
                ZOOM: 1:250K • RANGE: 300 KM
              </div>

              {/* Tactical Radar SVG */}
              <svg
                viewBox="0 0 400 400"
                className="w-full max-w-[340px] aspect-square select-none relative z-10"
              >
                <defs>
                  <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                    <stop offset="70%" stopColor="#059669" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#022c22" stopOpacity="0.3" />
                  </radialGradient>
                  <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Radar Background & Rings */}
                <circle cx="200" cy="200" r="180" fill="url(#radarGlow)" stroke="#059669" strokeWidth="1.5" strokeOpacity="0.5" />
                <circle cx="200" cy="200" r="140" fill="none" stroke="#059669" strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="3 3" />
                <circle cx="200" cy="200" r="95" fill="none" stroke="#059669" strokeWidth="0.8" strokeOpacity="0.35" />
                <circle cx="200" cy="200" r="50" fill="none" stroke="#059669" strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="2 2" />

                {/* Crosshairs */}
                <line x1="20" y1="200" x2="380" y2="200" stroke="#059669" strokeWidth="0.6" strokeOpacity="0.3" />
                <line x1="200" y1="20" x2="200" y2="380" stroke="#059669" strokeWidth="0.6" strokeOpacity="0.3" />

                {/* Rotating Sweep Beam */}
                <g transform={`rotate(${radarAngle} 200 200)`}>
                  <path
                    d="M 200 200 L 380 200 A 180 180 0 0 0 327 73 Z"
                    fill="url(#sweepGrad)"
                  />
                  <line x1="200" y1="200" x2="380" y2="200" stroke="#34d399" strokeWidth="1.5" />
                </g>

                {/* Branch Pins */}
                {branches.map((b) => {
                  const pt = getRadarCoords(b.lat, b.lng);
                  return (
                    <g key={b.id} className="cursor-pointer group">
                      <rect
                        x={pt.x - 3}
                        y={pt.y - 3}
                        width="6"
                        height="6"
                        fill="#60a5fa"
                        stroke="#1e3a8a"
                        strokeWidth="1"
                        transform={`rotate(45 ${pt.x} ${pt.y})`}
                      />
                      <text
                        x={pt.x + 6}
                        y={pt.y + 3}
                        fill="#93c5fd"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                        className="opacity-70 group-hover:opacity-100"
                      >
                        {b.code}
                      </text>
                    </g>
                  );
                })}

                {/* CIT Vehicles */}
                {vehicles.map((v) => {
                  const pt = getRadarCoords(v.currentLocation.lat, v.currentLocation.lng);
                  const isSelected = selectedVan?.vanId === v.vanId;
                  const isLockdown = v.status.includes("LOCKDOWN");

                  return (
                    <g
                      key={v.vanId}
                      className="cursor-pointer"
                      onClick={() => setSelectedVan(v)}
                    >
                      {/* Pulsing ring around vehicle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? "11" : "7"}
                        fill="none"
                        stroke={isLockdown ? "#ef4444" : isSelected ? "#38bdf8" : "#10b981"}
                        strokeWidth="1.5"
                        strokeOpacity="0.8"
                      />
                      {/* Vehicle Center Dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? "4.5" : "3.5"}
                        fill={isLockdown ? "#f43f5e" : isSelected ? "#0284c7" : "#059669"}
                      />
                      {/* Tag Label */}
                      <text
                        x={pt.x + 8}
                        y={pt.y - 4}
                        fill={isLockdown ? "#f87171" : isSelected ? "#38bdf8" : "#34d399"}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {v.vehicleReg.slice(-4)}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Radar Legend */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 mt-2 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> CIT Van
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-500 rotate-45 inline-block" /> Branch Hub
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" /> Alert / Lockdown
                </span>
              </div>
            </div>

            {/* Quick Fleet Carousel List */}
            <div className="grid grid-cols-2 gap-2">
              {vehicles.map((v) => {
                const isSelected = selectedVan?.vanId === v.vanId;
                const isLockdown = v.status.includes("LOCKDOWN");
                return (
                  <button
                    key={v.vanId}
                    onClick={() => setSelectedVan(v)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-800 border-emerald-500 text-white shadow-lg shadow-emerald-950/50"
                        : "bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold">{v.vehicleReg}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                          isLockdown
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        }`}
                      >
                        {v.currentLocation.speedKmh} km/h
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-1">
                      {v.currentLocation.name}
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono mt-1 font-semibold">
                      ₹{(v.totalCarriedValue / 10000000).toFixed(2)} Cr ({v.instrumentsCount} Chqs)
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Telemetry Dossier & Remote Solenoid Controls */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {selectedVan ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                
                {/* Dossier Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black font-mono text-emerald-400">
                        {selectedVan.vehicleReg}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300 border border-slate-700">
                        {selectedVan.vanId}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Route: <span className="text-slate-200 font-medium">{selectedVan.route}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider ${
                        selectedVan.status.includes("LOCKDOWN")
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {selectedVan.status}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      ETA: {selectedVan.etaMinutes} mins
                    </div>
                  </div>
                </div>

                {/* Tactical Parameters Matrix */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Armed Escort Chief</span>
                    <span className="font-semibold text-slate-200 mt-1 block">
                      🛡️ {selectedVan.securityChief}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Driver: {selectedVan.driverName}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Vault Tamper Sensor</span>
                    <span
                      className={`font-semibold mt-1 block font-mono text-[11px] ${
                        selectedVan.vaultTamperSensor.includes("LOCKED_INTACT")
                          ? "text-emerald-400"
                          : "text-rose-400 animate-pulse"
                      }`}
                    >
                      🔒 {selectedVan.vaultTamperSensor}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Geofence: {selectedVan.geofenceStatus}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Instruments in Transit</span>
                    <span className="font-bold text-blue-400 text-sm mt-1 block font-mono">
                      {selectedVan.instrumentsCount} Cheques
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Physical clearing docket sealed
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Total Carried Value</span>
                    <span className="font-bold text-amber-400 text-sm mt-1 block font-mono">
                      ₹{(selectedVan.totalCarriedValue / 10000000).toFixed(2)} Crore
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Insured under SPCB Transit Policy
                    </span>
                  </div>
                </div>

                {/* GPS Coordinates & Speed */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">LIVE GPS TELEMETRY</span>
                    <span className="text-slate-300">
                      LAT: {selectedVan.currentLocation.lat.toFixed(5)} • LNG: {selectedVan.currentLocation.lng.toFixed(5)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">SPEED & VECTOR</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedVan.currentLocation.speedKmh} km/h • {selectedVan.currentLocation.heading}°
                    </span>
                  </div>
                </div>

                {/* Emergency Solenoid Lockdown Action */}
                <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <span>⚠️</span> Central Switch Emergency Override
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Remotely triggers solenoid lock on the armored vault door and alerts police dispatch.
                    </div>
                  </div>

                  <button
                    onClick={() => handleLockdown(selectedVan.vanId)}
                    disabled={lockdownLoading || selectedVan.status.includes("LOCKDOWN")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      selectedVan.status.includes("LOCKDOWN")
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                        : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 active:scale-95"
                    }`}
                  >
                    <span>🔒</span>
                    {selectedVan.status.includes("LOCKDOWN")
                      ? "Vault Lockdown Active"
                      : lockdownLoading
                      ? "Engaging..."
                      : "Engage Solenoid Lockdown"}
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                Select a vehicle from the radar or fleet list to inspect telemetry.
              </div>
            )}

            {/* Branch Network Summary Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-mono font-bold text-slate-300 mb-2.5 flex items-center gap-2">
                <span>🏛️</span> Clearing Corridors & Branch Waypoints
              </h3>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{b.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {b.code} • {b.city} ({b.type})
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-emerald-400">
                      ₹{(b.activeClearanceVol / 10000000).toFixed(1)} Cr Clear
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Encrypted Telemetry via NavIC Satellite Constellation (ISRO)</span>
          </div>
          <span>SPCB Security & Physical Transit Protocol • Zero Cost Telemetry Stack</span>
        </div>

      </div>
    </div>
  );
}
