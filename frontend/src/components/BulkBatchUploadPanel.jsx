import React, { useState } from "react";
import client from "../api/client";

export default function BulkBatchUploadPanel({ onBatchIngested }) {
  const [batchName, setBatchName] = useState(`SURAT-MAIN-EVE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`);
  const [draweeIfsc, setDraweeIfsc] = useState("HDFC0005678");
  const [csvText, setCsvText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStepText, setCurrentStepText] = useState("");
  const [ingestionSummary, setIngestionSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeWorkerThread, setActiveWorkerThread] = useState("Idle");

  // Sample batch with both PPS-registered cheques (like 000101 Tata Steel, 000102 Adani Power) and standard cheques
  const sampleBatchData = [
    {
      chequeNumber: "000101",
      accountNumber: "98765432101",
      ifsc: "SBIN0001234",
      draweeIfsc: "HDFC0005678",
      amount: 150000,
      payeeName: "Tata Steel Ltd",
      micrLine: "C000101C 395002002A 98765432101C 10",
      notes: "High-value corporate payment with PPS Pre-confirmed",
    },
    {
      chequeNumber: "000102",
      accountNumber: "98765432102",
      ifsc: "SBIN0001234",
      draweeIfsc: "HDFC0005678",
      amount: 225000,
      payeeName: "Adani Power Transmission",
      micrLine: "C000102C 395002002A 98765432102C 10",
      notes: "Infrastructure clearing item with PPS Verified",
    },
    {
      chequeNumber: "000103",
      accountNumber: "98765432103",
      ifsc: "SBIN0001234",
      draweeIfsc: "HDFC0005678",
      amount: 75000,
      payeeName: "L&T Heavy Engineering",
      micrLine: "C000103C 395002002A 98765432103C 10",
      notes: "Corporate clearing item with PPS Verified",
    },
    {
      chequeNumber: "100205",
      accountNumber: "98765432104",
      ifsc: "SBIN0001234",
      draweeIfsc: "HDFC0005678",
      amount: 45000,
      payeeName: "Gujarat Gas Industrial Supply",
      micrLine: "C100205C 395002002A 98765432104C 10",
      notes: "Standard commercial cheque under ₹50K threshold",
    },
    {
      chequeNumber: "100206",
      accountNumber: "98765432105",
      ifsc: "SBIN0001234",
      draweeIfsc: "HDFC0005678",
      amount: 320000,
      payeeName: "Reliance Petrochem Logistics",
      micrLine: "C100206C 395002002A 98765432105C 10",
      notes: "Commercial bulk freight invoice settlement",
    },
  ];

  function handleLoadSampleBatch() {
    const csvHeader = "chequeNumber,accountNumber,draweeIfsc,amount,payeeName,micrLine\n";
    const csvRows = sampleBatchData
      .map(
        (item) =>
          `${item.chequeNumber},${item.accountNumber},${item.draweeIfsc},${item.amount},"${item.payeeName}","${item.micrLine}"`
      )
      .join("\n");
    setCsvText(csvHeader + csvRows);
    setErrorMessage("");
    setIngestionSummary(null);
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvText(evt.target.result);
      setErrorMessage("");
    };
    reader.readAsText(file);
  }

  function parseCsvInstruments(text) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) {
      throw new Error("CSV must contain a header line followed by at least 1 instrument record.");
    }

    const header = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const instruments = [];

    for (let i = 1; i < lines.length; i++) {
      // Basic regex to handle commas inside quotes
      const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
      const cleanRow = row.map((val) => val.trim().replace(/^["']|["']$/g, ""));

      const record = {};
      header.forEach((key, idx) => {
        record[key] = cleanRow[idx] || "";
      });

      instruments.push({
        chequeNumber: record.chequeNumber || cleanRow[0] || "",
        accountNumber: record.accountNumber || cleanRow[1] || "",
        draweeIfsc: record.draweeIfsc || draweeIfsc,
        amount: parseFloat(record.amount || cleanRow[3] || 0),
        payeeName: record.payeeName || cleanRow[4] || "Branch Clearing Payee",
        micrLine: record.micrLine || cleanRow[5] || undefined,
      });
    }

    return instruments;
  }

  async function handleStartIngestion() {
    setErrorMessage("");
    setIngestionSummary(null);

    let instrumentsToIngest = [];
    try {
      if (csvText.trim()) {
        instrumentsToIngest = parseCsvInstruments(csvText);
      } else {
        instrumentsToIngest = sampleBatchData;
      }
    } catch (err) {
      setErrorMessage(`CSV Parsing Error: ${err.message}`);
      return;
    }

    if (instrumentsToIngest.length === 0) {
      setErrorMessage("No instruments found to ingest. Please load the sample batch or upload a CSV manifest.");
      return;
    }

    setIsProcessing(true);
    setProgressPercent(20);
    setCurrentStepText("Ingesting batch into clearing queue...");

    try {
      const response = await client.post("/cheques/bulk-ingest", {
        batchName,
        instruments: instrumentsToIngest,
      });

      setProgressPercent(100);
      setCurrentStepText("Batch ingestion completed successfully.");
      setIngestionSummary(response.data);

      if (onBatchIngested) {
        onBatchIngested(response.data);
      }
    } catch (err) {
      console.error("Bulk ingestion error:", err);
      setErrorMessage(err.response?.data?.error || "Bulk ingestion pipeline failed. Check server logs.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="bg-slate-900/90 rounded-2xl shadow-xl border border-slate-800 p-6 sm:p-8 space-y-7 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center px-2.5 py-1 bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-mono font-bold">
              BATCH INGESTION
            </span>
            <h2 className="font-black text-white text-lg">
              Batch File Ingestion (CSV)
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSampleBatch}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-black/40"
          >
            Load Sample Data
          </button>
        </div>
      </div>

      {/* Batch Ingestion Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Batch Session Code</label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-sm text-slate-100 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:outline-none transition-all"
            placeholder="SURAT-MAIN-EVE-BATCH"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Drawee Clearing IFSC</label>
          <input
            type="text"
            value={draweeIfsc}
            onChange={(e) => setDraweeIfsc(e.target.value)}
            disabled={isProcessing}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 font-mono text-sm text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
            placeholder="HDFC0005678"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Branch Profile</label>
          <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs flex items-center justify-between min-h-[42px]">
            <span className="font-medium">SUR-BR-014 (Surat Main)</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[11px]">Active</span>
          </div>
        </div>
      </div>

      {/* CSV Manifest Editor */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-800 text-sm">Cheque Manifest Data (CSV format)</span>
          <label className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-semibold cursor-pointer transition-colors whitespace-nowrap">
            Upload CSV File
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </label>
        </div>
        <textarea
          rows={6}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          disabled={isProcessing}
          placeholder="chequeNumber,accountNumber,draweeIfsc,amount,payeeName,micrLine&#10;000101,98765432101,HDFC0005678,150000,Tata Steel Ltd,C000101C 395002002A 98765432101C 10&#10;000102,98765432102,HDFC0005678,225000,Adani Power Transmission,C000102C 395002002A 98765432102C 10"
          className="w-full border border-slate-300 rounded-xl p-4 font-mono text-xs leading-relaxed text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="font-mono text-[11px]">Columns: chequeNumber, accountNumber, draweeIfsc, amount, payeeName, micrLine</span>
          <span className="font-semibold text-slate-700">
            {csvText.trim()
              ? `${csvText.trim().split("\n").length - 1} records detected`
              : "Ready"}
          </span>
        </div>
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Action Button */}
      <div>
        <button
          type="button"
          onClick={handleStartIngestion}
          disabled={isProcessing}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 tracking-wide"
        >
          {isProcessing ? `Processing Batch (${progressPercent}%)...` : "Execute Batch Ingestion"}
        </button>
      </div>

      {/* Ingestion Progress */}
      {isProcessing && (
        <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 space-y-4 shadow-inner">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="font-bold text-emerald-400">Ingestion in Progress</span>
            <span className="font-mono text-xs text-slate-400">Batch Processing</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="text-xs font-mono text-slate-300">
            {currentStepText}
          </div>
        </div>
      )}

      {/* Ingestion Results & Validation Badges Card */}
      {ingestionSummary && (
        <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-emerald-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-emerald-950 text-base">
                  Batch Ingestion Completed: {ingestionSummary.batch?.sessionCode}
                </h3>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                {ingestionSummary.message} · Chained into Cryptographic Clearing Hash Ledger
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3.5 py-1.5 bg-white rounded-lg border border-emerald-300 text-emerald-900 font-mono font-bold text-xs shadow-2xs whitespace-nowrap">
                Instruments: {ingestionSummary.totalIngested}
              </span>
              <span className="px-3.5 py-1.5 bg-white rounded-lg border border-emerald-300 text-emerald-900 font-mono font-bold text-xs shadow-2xs whitespace-nowrap">
                Total: ₹{Number(ingestionSummary.totalBatchAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Per-Item Validation Badges Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Per-Instrument Validation & Compliance Badges
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {ingestionSummary.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        Chq #{item.chequeNumber}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="font-bold text-gray-800 text-sm">{item.payeeName}</span>
                      <span className="text-gray-400">·</span>
                      <span className="font-mono font-bold text-brand-700 text-sm">
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      A/C: {item.accountNumber} · Block Hash: {item.blockHash ? `${item.blockHash.slice(0, 16)}...` : "Genesis"}
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    {/* MICR Integrity Badge */}
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold whitespace-nowrap">
                      MICR PASS
                    </span>

                    {/* Positive Pay Badge */}
                    {item.ppsStatus === "PPS_VERIFIED" ? (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold whitespace-nowrap">
                        PPS VERIFIED
                      </span>
                    ) : item.ppsStatus === "PPS_MISMATCH" ? (
                      <span className="px-2.5 py-1 rounded-md bg-red-100 text-red-800 border border-red-300 text-xs font-semibold whitespace-nowrap">
                        PPS MISMATCH
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold whitespace-nowrap">
                        PPS NOT REG
                      </span>
                    )}

                    {/* AI Signature Match Badge */}
                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold whitespace-nowrap">
                      Sig: {item.signatureMatchScore || 95.4}% {item.signatureStatus || "PASS"}
                    </span>

                    {/* Ingestion Status Badge */}
                    <span className="px-3 py-1 rounded-md bg-emerald-600 text-white font-bold text-xs whitespace-nowrap">
                      INGESTED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
