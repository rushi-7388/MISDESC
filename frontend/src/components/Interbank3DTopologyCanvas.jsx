import React, { useRef, useEffect, useState } from "react";
import { sovereignAudio } from "../utils/settlement-sound.util";

export default function Interbank3DTopologyCanvas({
  nodes = [],
  edges = [],
  isGridlocked = false,
  cycleBurstPulse = false,
  onSelectNode,
  selectedNodeId,
}) {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ yaw: 0.35, pitch: 0.22 });
  const [autoRotate, setAutoRotate] = useState(true);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // 3D coordinate definitions for clearing participant banks
  const BANK_3D_POS = {
    "bank-srt": { x: -150, y: -20, z: 50, label: "SRT", name: "Surat Peoples Co-op", color: "#f59e0b" },
    "bank-sbi": { x: 0, y: -130, z: -40, label: "SBI", name: "State Bank of India", color: "#38bdf8" },
    "bank-hdfc": { x: 150, y: -30, z: 70, label: "HDFC", name: "HDFC Bank Ltd", color: "#818cf8" },
    "bank-icici": { x: 90, y: 110, z: -60, label: "ICICI", name: "ICICI Bank", color: "#f472b6" },
    "bank-pnb": { x: -100, y: 100, z: -50, label: "PNB", name: "Punjab National Bank", color: "#34d399" },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;
    let burstScale = 0;

    // Background ambient particles
    const starfield = Array.from({ length: 48 }, () => ({
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 450,
      z: (Math.random() - 0.5) * 400,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    function project(x, y, z, rotX, rotY, cx, cy) {
      // Rotate around Y axis (yaw)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;

      // Rotate around X axis (pitch)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX;

      // Perspective projection
      const fov = 420;
      const cameraDistance = 380;
      const scale = fov / (cameraDistance + z2);

      return {
        x: cx + x1 * scale,
        y: cy + y2 * scale,
        scale,
        depth: z2,
      };
    }

    function render() {
      t += 0.016;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Current rotations
      let currentYaw = rotation.yaw;
      if (autoRotate && !isDragging) {
        currentYaw += t * 0.12;
      }
      const currentPitch = rotation.pitch;

      // 1. Draw Starfield
      starfield.forEach((star) => {
        const p = project(star.x, star.y, star.z, currentPitch, currentYaw, cx, cy);
        if (p.scale > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, star.size * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148, 163, 184, ${star.alpha * p.scale})`;
          ctx.fill();
        }
      });

      // 2. Project Bank Nodes
      const projectedNodes = Object.entries(BANK_3D_POS).map(([id, bank]) => {
        const p = project(bank.x, bank.y, bank.z, currentPitch, currentYaw, cx, cy);
        return { id, ...bank, proj: p };
      });

      // Sort by depth for correct 3D painter's algorithm
      const renderQueue = [];

      // 3. Process Edges / Interbank Liquidity Beams
      edges.forEach((edge) => {
        const sourceNode = projectedNodes.find((n) => n.id === edge.source);
        const targetNode = projectedNodes.find((n) => n.id === edge.target);
        if (!sourceNode || !targetNode) return;

        const isDeadlock = edge.isInGridlock && isGridlocked;
        const isSettled = edge.amount === 0;
        const avgDepth = (sourceNode.proj.depth + targetNode.proj.depth) / 2;

        renderQueue.push({
          type: "edge",
          depth: avgDepth,
          source: sourceNode,
          target: targetNode,
          edge,
          isDeadlock,
          isSettled,
        });
      });

      // Add Nodes to renderQueue
      projectedNodes.forEach((node) => {
        renderQueue.push({
          type: "node",
          depth: node.proj.depth,
          node,
        });
      });

      // Sort back-to-front
      renderQueue.sort((a, b) => b.depth - a.depth);

      // Render Queue
      renderQueue.forEach((item) => {
        if (item.type === "edge") {
          const { source, target, isDeadlock, isSettled, edge } = item;
          const p1 = source.proj;
          const p2 = target.proj;

          // Midpoint curved in 3D
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2 - 25 * p1.scale;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);

          if (isDeadlock) {
            ctx.strokeStyle = `rgba(244, 63, 94, ${0.75 + Math.sin(t * 6) * 0.25})`;
            ctx.lineWidth = 3.5 * p1.scale;
            ctx.setLineDash([6, 4]);
          } else if (isSettled) {
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 * p1.scale})`;
            ctx.lineWidth = 1.8 * p1.scale;
            ctx.setLineDash([]);
          } else {
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.45 * p1.scale})`;
            ctx.lineWidth = 2.2 * p1.scale;
            ctx.setLineDash([]);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Glowing Particle Packet
          if (!isSettled) {
            const particleSpeed = isDeadlock ? 1.6 : 0.8;
            const progress = (t * particleSpeed + (source.x % 10) * 0.1) % 1;
            // Quadratic Bezier interpolation: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
            const px = (1 - progress) * (1 - progress) * p1.x + 2 * (1 - progress) * progress * midX + progress * progress * p2.x;
            const py = (1 - progress) * (1 - progress) * p1.y + 2 * (1 - progress) * progress * midY + progress * progress * p2.y;

            ctx.beginPath();
            ctx.arc(px, py, (isDeadlock ? 4.5 : 3.0) * p1.scale, 0, Math.PI * 2);
            ctx.fillStyle = isDeadlock ? "#fda4af" : "#38bdf8";
            ctx.shadowColor = isDeadlock ? "#f43f5e" : "#0284c7";
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else if (item.type === "node") {
          const { node } = item;
          const p = node.proj;
          const isSelected = selectedNodeId === node.id;
          const radius = Math.max(14, 26 * p.scale);

          // Outer Glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + (isSelected ? 6 : 2), 0, Math.PI * 2);
          ctx.fillStyle = `${node.color}22`;
          ctx.fill();

          // Orbital Ring around bank node
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, radius * 1.5, radius * 0.6, t * 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}55`;
          ctx.lineWidth = 1.2 * p.scale;
          ctx.stroke();

          // Main Sphere
          const grad = ctx.createRadialGradient(p.x - radius * 0.3, p.y - radius * 0.3, radius * 0.1, p.x, p.y, radius);
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.3, node.color);
          grad.addColorStop(1, "#0f172a");

          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.strokeStyle = isSelected ? "#ffffff" : node.color;
          ctx.lineWidth = isSelected ? 3 : 1.5;
          ctx.stroke();

          // Node Text Label
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${Math.max(10, Math.round(12 * p.scale))}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(node.label, p.x, p.y + 4 * p.scale);

          // Sub-label (Bank Name)
          ctx.fillStyle = "#94a3b8";
          ctx.font = `500 ${Math.max(8, Math.round(10 * p.scale))}px sans-serif`;
          ctx.fillText(node.name, p.x, p.y + radius + 14 * p.scale);
        }
      });

      // 4. Tarjan Cycle Elimination Golden Shockwave Implosion
      if (cycleBurstPulse) {
        burstScale = (burstScale + 0.04) % 1;
        const maxRadius = Math.min(width, height) * 0.45;
        const currentRadius = burstScale * maxRadius;

        ctx.beginPath();
        ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${1 - burstScale})`;
        ctx.lineWidth = 4 * (1 - burstScale);
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Central Gold Core
        ctx.beginPath();
        ctx.arc(cx, cy, 18 * (1 - burstScale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253, 224, 71, ${0.8 * (1 - burstScale)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [rotation, isDragging, autoRotate, edges, isGridlocked, cycleBurstPulse, selectedNodeId]);

  function handleMouseDown(e) {
    setIsDragging(true);
    setAutoRotate(false);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setRotation((prev) => ({
      yaw: prev.yaw + dx * 0.008,
      pitch: Math.max(-0.8, Math.min(0.8, prev.pitch + dy * 0.008)),
    }));
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  return (
    <div className="relative w-full h-[460px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none cursor-grab active:cursor-grabbing">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={780}
        height={460}
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Control Overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer backdrop-blur-md ${
            autoRotate
              ? "bg-emerald-950/80 border-emerald-700 text-emerald-300"
              : "bg-slate-900/80 border-slate-700 text-slate-400"
          }`}
          title="Toggle automatic orbital rotation"
        >
          {autoRotate ? "🔄 Auto-Orbit ON" : "⏸️ Orbit Paused"}
        </button>

        <button
          type="button"
          onClick={() => {
            sovereignAudio.playTarjanGridlockChime();
            sovereignAudio.playSettlementChime(2500000);
          }}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-950/80 border border-amber-700 text-amber-300 hover:bg-amber-900 transition-all cursor-pointer backdrop-blur-md"
          title="Play synthetic e-Kuber settlement chime"
        >
          🔔 e-Kuber Chime
        </button>
      </div>

      {/* Orbit Tip Overlay */}
      <div className="absolute bottom-3 left-3 bg-slate-900/80 border border-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-slate-400 pointer-events-none flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>Drag anywhere to orbit in 3D space · Real-Time WebGL Liquidity Particles</span>
      </div>
    </div>
  );
}
