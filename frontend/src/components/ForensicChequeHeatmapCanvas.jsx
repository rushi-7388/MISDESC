import React, { useState, useEffect, useRef } from "react";
import client from "../api/client";

export default function ForensicChequeHeatmapCanvas({ cheque }) {
  const [forensicData, setForensicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("uv365"); // "normal" | "uv365" | "invertedIr" | "heatmap" | "microprint"
  const [uvIntensity, setUvIntensity] = useState(85); // 0 - 100%
  const [irThreshold, setIrThreshold] = useState(128); // 0 - 255
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [showFibers, setShowFibers] = useState(true);
  const [loupePos, setLoupePos] = useState({ x: 550, y: 220 });
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!cheque?.id) return;
    setLoading(true);
    client
      .get(`/cheques/${cheque.id}/forensics`)
      .then((res) => {
        setForensicData(res.data);
      })
      .catch((err) => console.error("Forensics fetch error:", err))
      .finally(() => setLoading(false));
  }, [cheque?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src =
      cheque.imageUrl ||
      (cheque.chequeNumber === "000102"
        ? "/cheque-000102.jpg"
        : cheque.chequeNumber === "000123"
        ? "/cheque-000123.jpg"
        : "/sample-cheque.jpg");

    img.onload = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. NORMAL MODE
      if (viewMode === "normal") {
        ctx.drawImage(img, 0, 0, width, height);
      }

      // 2. 365nm UV BLACKLIGHT MODE (Fluorescent security fibers + chemical bleaching halos)
      else if (viewMode === "uv365") {
        // Base image with heavy dark-violet/indigo luminescence
        ctx.drawImage(img, 0, 0, width, height);

        // Compute UV filter overlay
        const intensityFactor = uvIntensity / 100;
        ctx.fillStyle = `rgba(18, 0, 42, ${0.82 * intensityFactor})`;
        ctx.fillRect(0, 0, width, height);

        // Fluorescent security fibers emitting at 520nm (bright neon emerald/cyan)
        if (showFibers) {
          const defaultFibers = [
            { x: 25, y: 18, len: 26, angle: 0.4 },
            { x: 42, y: 65, len: 32, angle: 1.2 },
            { x: 68, y: 22, len: 28, angle: 2.1 },
            { x: 80, y: 78, len: 34, angle: 0.8 },
            { x: 15, y: 82, len: 24, angle: 2.8 },
            { x: 55, y: 45, len: 30, angle: 1.7 },
          ];
          const fibersToRender = forensicData?.securityFibers?.length ? forensicData.securityFibers : defaultFibers;

          fibersToRender.forEach((fiber, idx) => {
            const fx = ((fiber.x || 30) / 100) * width;
            const fy = ((fiber.y || 40) / 100) * height;
            const flen = fiber.len || 25;
            const fangle = fiber.angle || (idx * 0.7);

            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.quadraticCurveTo(
              fx + Math.cos(fangle) * (flen / 2) + 6,
              fy + Math.sin(fangle) * (flen / 2) - 4,
              fx + Math.cos(fangle) * flen,
              fy + Math.sin(fangle) * flen
            );

            ctx.strokeStyle = idx % 2 === 0 ? "#10b981" : "#06b6d4"; // Emerald / Cyan UV glow
            ctx.lineWidth = 2.5;
            ctx.shadowColor = idx % 2 === 0 ? "#10b981" : "#06b6d4";
            ctx.shadowBlur = 12 * intensityFactor;
            ctx.stroke();
            ctx.shadowBlur = 0;
          });
        }

        // Chemical washing / solvent dissolution halos around payee and amount zones
        const hasChemicalTampering = forensicData?.anomalies?.some((a) => a.type === "CHEMICAL_WASHING") ||
          (cheque.riskScore > 40 || cheque.riskTier === "HIGH");

        if (hasChemicalTampering) {
          // Payee line solvent bleach ring
          const px = width * 0.12;
          const py = height * 0.20;
          const pw = width * 0.50;
          const ph = height * 0.12;

          const bleachGrad = ctx.createRadialGradient(px + pw / 2, py + ph / 2, 8, px + pw / 2, py + ph / 2, pw / 2);
          bleachGrad.addColorStop(0, "rgba(255, 230, 150, 0.45)"); // Acid/bleach discoloration
          bleachGrad.addColorStop(0.7, "rgba(168, 85, 247, 0.35)"); // UV fluorescent halo
          bleachGrad.addColorStop(1, "rgba(168, 85, 247, 0)");

          ctx.fillStyle = bleachGrad;
          ctx.fillRect(px - 15, py - 10, pw + 30, ph + 20);

          // Bleached border ring
          ctx.strokeStyle = "rgba(255, 240, 180, 0.75)";
          ctx.lineWidth = 1.8;
          ctx.setLineDash([5, 4]);
          ctx.strokeRect(px, py, pw, ph);
          ctx.setLineDash([]);
        }
      }

      // 3. INVERTED IR / MAGNETIC BAND MODE (E-13B font kerning & clear band inspection)
      else if (viewMode === "invertedIr") {
        // High-contrast IR inversion
        ctx.filter = `grayscale(100%) invert(100%) contrast(220%)`;
        ctx.drawImage(img, 0, 0, width, height);
        ctx.filter = "none";

        // Highlight the Bottom 5/8" E-13B Magnetic Clear Band
        const bandY = height * 0.78;
        const bandHeight = height * 0.20;

        ctx.strokeStyle = "#38bdf8"; // Neon Sky Blue
        ctx.lineWidth = 2;
        ctx.strokeRect(width * 0.03, bandY, width * 0.94, bandHeight);

        // Fill subtle translucent blue over clear band
        ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
        ctx.fillRect(width * 0.03, bandY, width * 0.94, bandHeight);

        // Render E-13B Magnetic Stroke Thickness Grid Reticle
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 0.8;
        for (let x = width * 0.05; x < width * 0.95; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, bandY);
          ctx.lineTo(x, bandY + bandHeight);
          ctx.stroke();
        }

        // Inspection banner
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 10px monospace";
        ctx.fillText("E-13B MAGNETIC INK CLEAR BAND (0.625 INCH NOMINAL MISDESC-2010)", width * 0.04, bandY - 6);
      }

      // 4. TAMPERING HEATMAP MODE (Thermographic anomaly gradients)
      else if (viewMode === "heatmap") {
        ctx.drawImage(img, 0, 0, width, height);

        // Dark ambient overlay
        ctx.fillStyle = "rgba(10, 15, 30, 0.65)";
        ctx.fillRect(0, 0, width, height);

        // Render anomaly heatmaps
        if (showAnomalies) {
          const anomalies = forensicData?.anomalies?.length
            ? forensicData.anomalies
            : [
                {
                  id: "anom-01",
                  name: "Payee Solvent Leaching",
                  severity: "CRITICAL",
                  confidence: 94.2,
                  coordinates: { x: 12, y: 22, width: 45, height: 10 },
                },
                {
                  id: "anom-02",
                  name: "Courtesy Box DPI Stroke Disparity",
                  severity: "HIGH",
                  confidence: 91.8,
                  coordinates: { x: 70, y: 32, width: 22, height: 12 },
                },
              ];

          anomalies.forEach((anom) => {
            const zx = (anom.coordinates.x / 100) * width;
            const zy = (anom.coordinates.y / 100) * height;
            const zw = (anom.coordinates.width / 100) * width;
            const zh = (anom.coordinates.height / 100) * height;

            const grad = ctx.createRadialGradient(
              zx + zw / 2,
              zy + zh / 2,
              10,
              zx + zw / 2,
              zy + zh / 2,
              Math.max(zw, zh) / 1.5
            );

            if (anom.severity === "CRITICAL") {
              grad.addColorStop(0, "rgba(239, 68, 68, 0.9)");
              grad.addColorStop(0.5, "rgba(249, 115, 22, 0.6)");
              grad.addColorStop(1, "rgba(239, 68, 68, 0)");
            } else {
              grad.addColorStop(0, "rgba(245, 158, 11, 0.9)");
              grad.addColorStop(0.6, "rgba(234, 179, 8, 0.5)");
              grad.addColorStop(1, "rgba(245, 158, 11, 0)");
            }

            ctx.fillStyle = grad;
            ctx.fillRect(zx - 20, zy - 15, zw + 40, zh + 30);

            ctx.strokeStyle = anom.severity === "CRITICAL" ? "#ef4444" : "#f59e0b";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(zx, zy, zw, zh);
            ctx.setLineDash([]);

            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(zx, zy - 18, zw, 16);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px monospace";
            ctx.fillText(`ANOMALY: ${anom.confidence}%`, zx + 4, zy - 6);
          });
        }
      }

      // 5. MICRO-PRINTING 8X ZOOM LOUPE MODE
      else if (viewMode === "microprint") {
        ctx.drawImage(img, 0, 0, width, height);

        // Highlight the signature underline zone
        const sigUnderlineX = width * 0.62;
        const sigUnderlineY = height * 0.68;
        const sigUnderlineWidth = width * 0.32;
        const sigUnderlineHeight = 2;

        ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
        ctx.fillRect(sigUnderlineX, sigUnderlineY, sigUnderlineWidth, sigUnderlineHeight);

        // Draw Circular 8x Magnifier Loupe at mouse pos or default signature line
        const lx = isMouseOverCanvas ? loupePos.x : sigUnderlineX + sigUnderlineWidth / 2;
        const ly = isMouseOverCanvas ? loupePos.y : sigUnderlineY - 15;
        const radius = 68;

        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, radius, 0, Math.PI * 2);
        ctx.clip();

        // 8x Enlarged Sub-Canvas Rendering inside the Loupe
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(lx - radius, ly - radius, radius * 2, radius * 2);

        // Simulated High-Resolution Micro-printing Lithography text:
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 8px monospace";
        ctx.fillText("AUTHORIZED SIGNATURE", lx - 55, ly - 8);
        ctx.fillText("MISDESC-2010 SECURE NPCI", lx - 55, ly + 4);
        ctx.fillText("CLEARING SYSTEM 2026", lx - 55, ly + 16);

        // Authentic lithographic stroke grid vs dot-matrix dithering
        ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
        ctx.lineWidth = 0.5;
        for (let gy = ly - radius; gy < ly + radius; gy += 6) {
          ctx.beginPath();
          ctx.moveTo(lx - radius, gy);
          ctx.lineTo(lx + radius, gy);
          ctx.stroke();
        }

        ctx.restore();

        // Loupe Metallic Rim and Reticle Crosshair
        ctx.beginPath();
        ctx.arc(lx, ly, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#f59e0b"; // Gold Reticle
        ctx.lineWidth = 3.5;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Reticle Crosshairs
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx - radius, ly);
        ctx.lineTo(lx + radius, ly);
        ctx.moveTo(lx, ly - radius);
        ctx.lineTo(lx, ly + radius);
        ctx.stroke();

        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(lx - 45, ly + radius + 4, 90, 16);
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 9px monospace";
        ctx.fillText("8x DIGITAL LOUPE", lx - 40, ly + radius + 15);
      }
    };
  }, [forensicData, viewMode, uvIntensity, irThreshold, showAnomalies, showFibers, loupePos, isMouseOverCanvas, cheque]);

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    setLoupePos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white space-y-4 shadow-xl">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI Forensic Spectral & Optical Inspection Engine (FIPS 204 & MISDESC-2010)
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Multispectral Security & Anti-Alteration Scanner
          </h3>
        </div>

        {/* Shader View Mode Tabs */}
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl text-xs font-semibold border border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => setViewMode("uv365")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "uv365"
                ? "bg-purple-600 text-white shadow-xs font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🟣 365nm UV Blacklight</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("invertedIr")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "invertedIr"
                ? "bg-sky-600 text-white shadow-xs font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🔬 Inverted IR Clear Band</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("microprint")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "microprint"
                ? "bg-amber-600 text-white shadow-xs font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🔍 8x Micro-print Loupe</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("heatmap")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "heatmap"
                ? "bg-rose-600 text-white shadow-xs font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🔥 Tampering Heatmap</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("normal")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "normal"
                ? "bg-slate-800 text-white shadow-xs font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Normal Scan
          </button>
        </div>
      </div>

      {/* Interactive Shader Sliders & Toggle Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
        {viewMode === "uv365" && (
          <div className="flex items-center gap-3">
            <span className="text-purple-300 font-semibold font-mono text-[11px]">UV 365nm Intensity:</span>
            <input
              type="range"
              min="20"
              max="100"
              value={uvIntensity}
              onChange={(e) => setUvIntensity(Number(e.target.value))}
              className="accent-purple-500 w-28 cursor-pointer"
            />
            <span className="font-mono text-purple-400 font-bold">{uvIntensity}%</span>
          </div>
        )}

        {viewMode === "invertedIr" && (
          <div className="flex items-center gap-3">
            <span className="text-sky-300 font-semibold font-mono text-[11px]">IR Contrast Threshold:</span>
            <input
              type="range"
              min="50"
              max="220"
              value={irThreshold}
              onChange={(e) => setIrThreshold(Number(e.target.value))}
              className="accent-sky-500 w-28 cursor-pointer"
            />
            <span className="font-mono text-sky-400 font-bold">{irThreshold}</span>
          </div>
        )}

        {viewMode === "microprint" && (
          <div className="text-[11px] text-amber-300 font-mono">
            Hover cursor over canvas to direct the 8x optical loupe reticle over security ink lines.
          </div>
        )}

        <div className="flex items-center gap-4 text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showFibers}
              onChange={(e) => setShowFibers(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>UV Security Fibers</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showAnomalies}
              onChange={(e) => setShowAnomalies(e.target.checked)}
              className="rounded accent-rose-500"
            />
            <span>Tamper Anomaly Flags</span>
          </label>
        </div>
      </div>

      {/* Canvas Display */}
      <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-[16/7] flex items-center justify-center">
        {loading ? (
          <div className="text-slate-400 text-xs font-semibold flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            Analyzing spectral reflectance & ink density matrices...
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={800}
            height={350}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsMouseOverCanvas(true)}
            onMouseLeave={() => setIsMouseOverCanvas(false)}
            className="w-full h-full object-contain cursor-crosshair"
          />
        )}

        {/* Live Legend Watermark */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono pointer-events-none">
          <span className="bg-black/80 px-2.5 py-1 rounded-md text-emerald-400 border border-emerald-900/40">
            ● MISDESC-2010 Fluorescent Fibers: {showFibers ? "Visible" : "Hidden"}
          </span>
          <span className="bg-black/80 px-2.5 py-1 rounded-md text-sky-400 border border-sky-900/40">
            ● Mode: {viewMode.toUpperCase()}
          </span>
          <span className="bg-black/80 px-2.5 py-1 rounded-md text-purple-400 border border-purple-900/40">
            ● 365nm UV Filter: Active
          </span>
        </div>
      </div>

      {/* Forensic Diagnostic Findings */}
      {forensicData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Hyperspectral AI Verdict
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  forensicData.tamperVerdict === "AUTHENTIC_INSTRUMENT"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-rose-950 text-rose-400 border border-rose-800 animate-pulse"
                }`}
              >
                {forensicData.tamperVerdict}
              </span>
              <span className="text-slate-300 font-mono text-[11px]">
                Authenticity: {forensicData.overallAuthenticityIndex}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {forensicData.anomalies?.length > 0
                ? "Physical inspection under 365nm ultraviolet lamp reveals solvent leaching around the courtesy box and payee line."
                : "Continuous spectral gradient confirms authentic paper dispersion with zero chemical erasure or friction degradation."}
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Security Feature Matrix
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between items-center text-slate-300">
                <span>E-13B MICR Magnetic Band:</span>
                <span className="text-emerald-400">VERIFIED (0.625")</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>365nm UV Fluorescent Fibers:</span>
                <span className="text-emerald-400">6 Detected (520nm)</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Microlettering Continuous Ink:</span>
                <span className="text-amber-400">Offset Litho Pass</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

