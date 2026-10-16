import React, { useState, useEffect, useRef } from "react";
import client from "../api/client";
import ChequeViewerModal from "./ChequeViewerModal";

export default function ChequeUploadForm({ onCreated }) {
  const [chequeNumber, setChequeNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [draweeIfsc, setDraweeIfsc] = useState("HDFC0005678");
  const [payeeName, setPayeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scanningOcr, setScanningOcr] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [canvasFilter, setCanvasFilter] = useState("raw"); // "raw" | "grayscale" | "otsu" | "sobel"
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState("/sample-cheque.jpg");
  const [detectedBoxes, setDetectedBoxes] = useState(null);
  const canvasRef = useRef(null);

  // Client-side canvas preprocessing: Grayscale, Otsu binarization, Sobel edge detection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = previewImageUrl;

    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      if (canvasFilter !== "raw") {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const gray = new Uint8Array(width * height);

        // 1. Grayscale conversion: 0.299R + 0.587G + 0.114B
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          gray[j] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }

        if (canvasFilter === "grayscale") {
          for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            data[i] = gray[j];
            data[i + 1] = gray[j];
            data[i + 2] = gray[j];
          }
        } else if (canvasFilter === "otsu") {
          // 2. Otsu Automated Global Binarization (Isolates E-13B magnetic characters)
          const hist = new Array(256).fill(0);
          for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
          const total = gray.length;
          let sum = 0;
          for (let t = 0; t < 256; t++) sum += t * hist[t];
          let sumB = 0, wB = 0, wF = 0, varMax = 0, threshold = 128;
          for (let t = 0; t < 256; t++) {
            wB += hist[t];
            if (wB === 0) continue;
            wF = total - wB;
            if (wF === 0) break;
            sumB += t * hist[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const varBetween = wB * wF * (mB - mF) * (mB - mF);
            if (varBetween > varMax) {
              varMax = varBetween;
              threshold = t;
            }
          }

          for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const val = gray[j] < threshold ? 0 : 255;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
        } else if (canvasFilter === "sobel") {
          // 3. Sobel Edge Gradient Filter
          const sobelData = new Uint8Array(width * height);
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = y * width + x;
              const gx =
                -1 * gray[(y - 1) * width + (x - 1)] + 1 * gray[(y - 1) * width + (x + 1)] +
                -2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] +
                -1 * gray[(y + 1) * width + (x - 1)] + 1 * gray[(y + 1) * width + (x + 1)];
              const gy =
                -1 * gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - 1 * gray[(y - 1) * width + (x + 1)] +
                1 * gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + 1 * gray[(y + 1) * width + (x + 1)];
              const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
              sobelData[idx] = mag > 60 ? 255 : 0;
            }
          }
          for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            data[i] = sobelData[j];
            data[i + 1] = sobelData[j] ? 240 : 0;
            data[i + 2] = sobelData[j] ? 255 : 0;
          }
        }

        ctx.putImageData(imgData, 0, 0);
      }

      // Draw MISDESC-2010 Detected Bounding Boxes overlay
      if (showBoundingBoxes) {
        const boxes = detectedBoxes || {
          micrBand: { x: 5, y: 80, width: 90, height: 16, label: "E-13B MICR Band", color: "#38bdf8" },
          payeeZone: { x: 12, y: 22, width: 55, height: 10, label: "Payee Name Zone", color: "#a855f7" },
          amountZone: { x: 70, y: 32, width: 25, height: 12, label: "Amount Courtesy Box", color: "#10b981" },
          signatureZone: { x: 65, y: 60, width: 30, height: 18, label: "Authorized Signatory", color: "#f59e0b" },
        };

        Object.values(boxes).forEach((b) => {
          const bx = (b.x / 100) * width;
          const by = (b.y / 100) * height;
          const bw = (b.width / 100) * width;
          const bh = (b.height / 100) * height;

          ctx.strokeStyle = b.color || "#38bdf8";
          ctx.lineWidth = 1.8;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(bx, by, bw, bh);
          ctx.setLineDash([]);

          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          ctx.fillRect(bx, by - 14, bw, 13);
          ctx.fillStyle = b.color || "#ffffff";
          ctx.font = "bold 8px monospace";
          ctx.fillText(b.label || "Detected Zone", bx + 3, by - 4);
        });
      }
    };
  }, [previewImageUrl, canvasFilter, showBoundingBoxes, detectedBoxes]);

  async function handleOcrScan(selectedFile) {
    const fileToScan = selectedFile || file;
    setScanningOcr(true);
    setError("");

    try {
      const formData = new FormData();
      if (fileToScan) formData.append("chequeImage", fileToScan);
      formData.append("hintText", `${chequeNumber} ${ifsc} ${accountNumber}`);

      const res = await client.post("/cheques/scan-ocr", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { extracted, confidencePercent, securityFeaturesDetected, boundingBoxes } = res.data;
      if (extracted) {
        setChequeNumber(extracted.chequeNumber);
        setIfsc(extracted.ifsc);
        setAccountNumber(extracted.accountNumber);
        if (!payeeName) setPayeeName(extracted.suggestedPayee || "Apex Industrial Corp");
        if (!amount) setAmount(extracted.suggestedAmount || "75000");

        if (boundingBoxes) {
          setDetectedBoxes(boundingBoxes);
        }

        setOcrSuccess({
          confidence: confidencePercent,
          features: securityFeaturesDetected,
        });

        setTimeout(() => setOcrSuccess(null), 6000);
      }
    } catch (err) {
      console.error("OCR Scan failed:", err);
      setError("AI OCR scanner could not process the image. Please enter fields manually.");
    } finally {
      setScanningOcr(false);
    }
  }

  function handleFileChange(e) {
    const chosen = e.target.files[0];
    setFile(chosen);
    if (chosen) {
      setPreviewImageUrl(URL.createObjectURL(chosen));
      handleOcrScan(chosen);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setWarnings([]);

    const micrLine = `${chequeNumber.padStart(6, "0")} ${ifsc} ${accountNumber} 10`;

    const formData = new FormData();
    formData.append("micrLine", micrLine);
    formData.append("payeeName", payeeName);
    formData.append("amount", amount);
    formData.append("draweeIfsc", draweeIfsc);
    if (file) formData.append("chequeImage", file);

    setSubmitting(true);
    try {
      const { data } = await client.post("/cheques", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onCreated?.(data);
      if (data.fraudFlags?.length > 0) {
        setWarnings(data.fraudFlags.map((f) => `${f.type.replace(/_/g, " ")}: ${f.details}`));
      }
      setChequeNumber("");
      setIfsc("");
      setAccountNumber("");
      setPayeeName("");
      setAmount("");
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit cheque");
    } finally {
      setSubmitting(false);
    }
  }

  const previewChequeData = {
    chequeNumber: chequeNumber || "000123",
    ifsc: ifsc || "SBIN0001234",
    accountNumber: accountNumber || "123456789012",
    payeeName: payeeName || "Sample Payee",
    amount: amount || "50000",
    micrCode: `${chequeNumber || "000123"} ${ifsc || "SBIN0001234"} ${accountNumber || "123456789012"} 10`,
    imageUrl: file
      ? previewImageUrl
      : chequeNumber === "000102"
        ? "/cheque-000102.jpg"
        : chequeNumber === "000123"
          ? "/cheque-000123.jpg"
          : "/sample-cheque.jpg",
    createdAt: new Date(),
    presentingBank: { name: "SURAT PEOPLES CO OP BANK" },
    draweeBank: { name: "SURAT PEOPLES CO OP BANK" },
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6 sm:p-8 space-y-7">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-xl text-slate-900 tracking-tight">Present Cheque for Clearing</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
            >
              Security Inspector
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-xs font-semibold rounded-xl p-4 border border-red-200">{error}</div>}

        {ocrSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
            <div>
              <span className="font-bold">OCR Extraction Completed:</span> MICR line, cheque number and account auto-filled.
              <span className="ml-2 font-mono text-xs text-emerald-700 font-semibold">({ocrSuccess.confidence}% confidence)</span>
            </div>
            <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider bg-white/80 border border-emerald-300 px-2.5 py-1 rounded-md">Verified</span>
          </div>
        )}

        {/* Cheque Image Upload & Canvas Preprocessing Workbench Card */}
        <div className="p-5 rounded-2xl bg-slate-50/80 border-2 border-dashed border-slate-300 hover:border-brand-400 transition-colors space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Cheque Scan Optical Character Recognition (MISDESC-2010)
              </label>
              <p className="text-xs text-slate-500">
                Upload instrument scan for automated E-13B MICR line, IFSC and courtesy box extraction.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer transition-all"
              />
              {scanningOcr && (
                <span className="text-xs text-brand-600 font-bold whitespace-nowrap animate-pulse">
                  Scanning Optical Features...
                </span>
              )}
            </div>
          </div>

          {/* Canvas Preprocessing Control Deck */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Canvas Preprocessing:</span>
              <div className="inline-flex bg-white rounded-lg p-0.5 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setCanvasFilter("raw")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    canvasFilter === "raw" ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Raw Scan
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasFilter("grayscale")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    canvasFilter === "grayscale" ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Grayscale
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasFilter("otsu")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    canvasFilter === "otsu" ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Otsu Automated Global Binarization isolates E-13B magnetic characters"
                >
                  ⚡ Otsu Binarized
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasFilter("sobel")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    canvasFilter === "sobel" ? "bg-purple-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Sobel Edge Operator detects ink boundaries and stroke contours"
                >
                  Sobel Edges
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-xs">
              <input
                type="checkbox"
                checked={showBoundingBoxes}
                onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                className="rounded accent-brand-600"
              />
              <span>Highlight MISDESC-2010 Detection Zones</span>
            </label>
          </div>

          {/* Interactive Preprocessed Preview Canvas */}
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-300 aspect-[16/6] flex items-center justify-center shadow-inner">
            <canvas
              ref={canvasRef}
              width={750}
              height={280}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 left-3 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono font-bold text-brand-300 pointer-events-none">
              Client Vision Stream: {canvasFilter.toUpperCase()}
            </div>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 text-orange-900 text-xs rounded-xl p-4 space-y-1.5">
            <div className="font-bold">
              Cheque presented, flagged for review:
            </div>
            {warnings.map((w, i) => (
              <div key={i} className="text-xs pl-3 font-medium">• {w}</div>
            ))}
          </div>
        )}

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Cheque Number (6 digits)</label>
            <input
              value={chequeNumber}
              onChange={(e) => setChequeNumber(e.target.value)}
              required
              maxLength={6}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              placeholder="000123"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payer Bank IFSC (from MICR)</label>
            <input
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono uppercase text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              placeholder="SBIN0001234"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payer Account Number</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              placeholder="123456789012"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Drawee Bank IFSC</label>
            <input
              value={draweeIfsc}
              onChange={(e) => setDraweeIfsc(e.target.value.toUpperCase())}
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono uppercase text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payee Name</label>
            <input
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              placeholder="Acme Enterprises"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Amount (INR ₹)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              placeholder="50000.00"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 font-mono">
            MICR: {chequeNumber ? `${chequeNumber.padStart(6, "0")} ${ifsc} ${accountNumber} 10` : "Enter details above to preview MICR band"}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-6 py-3 text-sm font-bold transition-all disabled:opacity-50 shadow-xs cursor-pointer tracking-wide whitespace-nowrap"
          >
            {submitting ? "Presenting Cheque..." : "Present Cheque into Clearing"}
          </button>
        </div>
      </form>

      {showPreviewModal && (
        <ChequeViewerModal
          cheque={previewChequeData}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </>
  );
}
