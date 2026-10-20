import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ChequeUploadForm from "../components/ChequeUploadForm";
import BulkBatchUploadPanel from "../components/BulkBatchUploadPanel";
import ClearingStatusTable from "../components/ClearingStatusTable";
import { useClearingEvents } from "../hooks/useClearingEvents";
import client from "../api/client";

export default function PresentingBankDashboard() {
  const [cheques, setCheques] = useState([]);
  const [activeTab, setActiveTab] = useState("batch"); // "batch" or "single"

  async function load() {
    try {
      const { data } = await client.get("/cheques");
      setCheques(data);
    } catch (err) {
      console.error("Failed to load cheques:", err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useClearingEvents(() => {
    load();
  });

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 pb-16">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("batch")}
            className={`py-3.5 px-6 font-semibold text-sm transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "batch"
                ? "border-cyan-500 text-cyan-300 bg-cyan-950/40 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            Batch Ingestion (CSV)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`py-3.5 px-6 font-semibold text-sm transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "single"
                ? "border-cyan-500 text-cyan-300 bg-cyan-950/40 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            Single Instrument Presentation
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "batch" ? (
          <BulkBatchUploadPanel onBatchIngested={() => load()} />
        ) : (
          <ChequeUploadForm onCreated={() => load()} />
        )}

        {/* Clearing Status Table */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-xl text-white tracking-tight">
              Cheques Presented in Clearing
            </h2>
            <span className="text-xs font-mono font-semibold text-cyan-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
              Total Presented: {cheques.length} instruments
            </span>
          </div>
          <ClearingStatusTable cheques={cheques} />
        </div>
      </div>
    </div>
  );
}
