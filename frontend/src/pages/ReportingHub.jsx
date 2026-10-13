import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ReportingHub() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("generate"); // "generate", "preview", "archive", "scheduled"
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filter Parameters
  const [filters, setFilters] = useState({
    dateRange: "all",
    dateFrom: "",
    dateTo: "",
    branchName: "ALL",
    status: "ALL",
    minAmount: "",
    format: "CSV",
  });

  // In-table search & pagination for Active Report
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  async function loadData() {
    try {
      setLoading(true);
      const [tplRes, kpiRes, repRes] = await Promise.all([
        client.get("/reports/templates"),
        client.get("/reports/kpis"),
        client.get("/reports?limit=100"),
      ]);
      const availableTemplates = tplRes.data.templates || [];
      setTemplates(availableTemplates);
      setKpis(kpiRes.data);
      const reportList = repRes.data.reports || [];
      setReports(reportList);

      if (availableTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(availableTemplates[0]);
      }
      if (reportList.length > 0 && !currentReport) {
        setCurrentReport(reportList[0]);
      }
    } catch (err) {
      console.error("Failed to load reporting suite:", err);
      notify("Failed to connect to Bank Reporting Engine.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleGenerate(templateToUse) {
    const tpl = templateToUse || selectedTemplate;
    if (!tpl) return;
    try {
      setGenerating(true);
      const res = await client.post("/reports/generate", {
        reportType: tpl.id || tpl.type,
        format: filters.format,
        filters: {
          dateRange: filters.dateRange,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          branchName: filters.branchName,
          status: filters.status,
          minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        },
      });

      const generated = res.data.report;
      setCurrentReport(generated);
      setCurrentPage(1);
      setTableSearch("");
      setActiveTab("preview");
      notify(`Report ${generated.reportRef} generated successfully.`);

      // Refresh list & KPIs
      const [repRes, kpiRes] = await Promise.all([
        client.get("/reports?limit=100"),
        client.get("/reports/kpis"),
      ]);
      setReports(repRes.data.reports || []);
      setKpis(kpiRes.data);
    } catch (err) {
      console.error("Report generation error:", err);
      notify(err.response?.data?.error || "Report generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownloadCsv(reportId, reportRef) {
    try {
      const res = await client.get(`/reports/${reportId}/export?format=csv`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportRef || "SPCB_bank_report"}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notify("CSV report downloaded successfully.");
    } catch (err) {
      console.error("Failed to download CSV:", err);
      notify("Download failed. Please try again.");
    }
  }

  async function handleDownloadJson(reportId, reportRef) {
    try {
      const res = await client.get(`/reports/${reportId}/export?format=json`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportRef || "SPCB_bank_report"}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notify("JSON audit file downloaded.");
    } catch (err) {
      console.error("Failed to download JSON:", err);
      notify("JSON download failed.");
    }
  }

  async function handleViewReport(report) {
    if (report.records && report.records.length > 0) {
      setCurrentReport(report);
      setCurrentPage(1);
      setTableSearch("");
      setActiveTab("preview");
    } else {
      try {
        const res = await client.get(`/reports/${report.id}`);
        setCurrentReport(res.data.report);
        setCurrentPage(1);
        setTableSearch("");
        setActiveTab("preview");
      } catch (err) {
        notify("Failed to retrieve report details.");
      }
    }
  }

  function handlePrint() {
    window.print();
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Filtered & Paginated records for active report
  const filteredRecords = useMemo(() => {
    if (!currentReport || !currentReport.records) return [];
    let list = [...currentReport.records];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter((r) =>
        Object.values(r).some((v) => String(v || "").toLowerCase().includes(q))
      );
    }

    if (sortField) {
      list.sort((a, b) => {
        const valA = a[sortField] ?? "";
        const valB = b[sortField] ?? "";
        if (typeof valA === "number" && typeof valB === "number") {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return list;
  }, [currentReport, tableSearch, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRecords.slice(start, start + rowsPerPage);
  }, [filteredRecords, currentPage, rowsPerPage]);

  function handleSort(colKey) {
    if (sortField === colKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(colKey);
      setSortAsc(true);
    }
  }

  // Predefined standard Bank Scheduled Report Jobs
  const scheduledJobs = [
    {
      id: "SCHED-EOD-01",
      title: "Daily EOD CTS Clearing Reconciled Summary",
      frequency: "Daily at 18:00 IST",
      targetType: "DAILY_CLEARING_SUMMARY",
      department: "Central Clearing & Settlement Desk",
      lastRun: "Today, 18:00 IST",
      status: "ACTIVE",
    },
    {
      id: "SCHED-RBI-02",
      title: "RBI Statutory Form VI Cheque Dishonour Return Memo",
      frequency: "Daily at 16:30 IST",
      targetType: "RBI_STATUTORY_RETURN",
      department: "Regulatory Compliance & Ombudsman Wing",
      lastRun: "Today, 16:30 IST",
      status: "ACTIVE",
    },
    {
      id: "SCHED-PPS-03",
      title: "Positive Pay High-Value Mandate Audit (≥ ₹50,000)",
      frequency: "Hourly (09:00 - 19:00 IST)",
      targetType: "HIGH_VALUE_PPS_RECON",
      department: "Risk Management & Fraud Control",
      lastRun: "1 hour ago",
      status: "ACTIVE",
    },
    {
      id: "SCHED-MNS-04",
      title: "e-Kuber Multilateral Net Settlement (MNS) Finality File",
      frequency: "Clearing Cutoff (Session Close)",
      targetType: "INTERBANK_SETTLEMENT_MNS",
      department: "National Treasury & Liquidity Desk",
      lastRun: "Previous Session Close",
      status: "ACTIVE",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <Navbar />

      {/* Floating Institutional Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Printable Bank Letterhead (Visible ONLY on print) */}
      <div className="hidden print:block p-8 border-b-2 border-slate-900 bg-white">
        <div className="text-center pb-4">
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            THE SURAT PEOPLES CO-OPERATIVE BANK LTD.
          </h1>
          <p className="text-xs font-semibold text-slate-600">
            Central Management Information Systems (MIS) & Regulatory Reporting Division
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            RBI CTS-2010 Statutory Returns · e-Kuber Multilateral Net Clearing Settlement
          </p>
        </div>
        {currentReport && (
          <div className="flex justify-between items-center text-xs border-t border-slate-300 pt-3 font-mono">
            <div>
              <strong>Report Ref:</strong> {currentReport.reportRef}
            </div>
            <div>
              <strong>Generated:</strong> {new Date(currentReport.createdAt).toLocaleString("en-IN")}
            </div>
            <div>
              <strong>Officer:</strong> {currentReport.generatedByName} ({currentReport.generatedByRole})
            </div>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Institutional Bank Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold tracking-wider uppercase bg-blue-50 text-blue-800 border border-blue-200">
                SURAT PEOPLES CO OP BANK
              </span>
              <span className="text-xs font-mono text-slate-400">
                · MISDESC Central Reporting Software
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bank MIS & Regulatory Reporting Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Official banking software for generating, auditing, and archiving regulatory clearing summaries, RBI statutory returns, Positive Pay reconciliations, and multilateral treasury settlement ledgers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 cursor-pointer"
            >
              Refresh Data
            </button>
            <button
              type="button"
              onClick={() => handleGenerate(selectedTemplate)}
              disabled={generating || !selectedTemplate}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Compiling Bank Ledger...</span>
                </>
              ) : (
                <>
                  <span>Compile & Run Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Statutory Templates
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {templates.length || 6}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              RBI CTS-2010 & NPCI
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Archived Reports
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-1">
              {reports.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Digitally sealed records
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Instruments Audited
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {kpis?.totalInstrumentsAudited?.toLocaleString() || "—"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              CTS Clearing Records
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Clearing Volume Audited
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 truncate">
              {formatCurrency(kpis?.totalVolumeAudited || 0)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              100% Reconciled
            </div>
          </div>
        </div>

        {/* Primary Reporting Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("generate")}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "generate"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Report Generator & Catalog
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            disabled={!currentReport}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 ${
              activeTab === "preview"
                ? "bg-blue-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Live Report Ledger {currentReport && `(${currentReport.reportRef})`}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("archive")}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "archive"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Report Archive & Audit Ledger ({reports.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scheduled")}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "scheduled"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Automated EOD Schedules
          </button>
        </div>

        {/* =========================================================================
            TAB 1: REPORT GENERATOR & CATALOG
           ========================================================================= */}
        {activeTab === "generate" && (
          <div className="space-y-6">
            {/* Filter Parameters Console */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Report Compilation Filters
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  Issuing Bank: SURAT PEOPLES CO OP BANK
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Date Window
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="all">All Available Clearing Cycles</option>
                    <option value="today">Today's Session</option>
                    <option value="yesterday">Previous Business Day</option>
                    <option value="week">Current Clearing Week (7 Days)</option>
                    <option value="month">Current Month to Date</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Branch Operating Unit
                  </label>
                  <select
                    value={filters.branchName}
                    onChange={(e) => setFilters({ ...filters, branchName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="ALL">All Branches (Consolidated)</option>
                    <option value="Athwa Branch">Athwa Main Branch (Surat)</option>
                    <option value="Varachha Branch">Varachha Commercial Branch</option>
                    <option value="Rander Road Branch">Rander Road Branch</option>
                    <option value="Ring Road Branch">Ring Road Textile Market Branch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Clearing Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="ALL">All Instrument Statuses</option>
                    <option value="CLEARED">Cleared / Honoured Instruments</option>
                    <option value="RETURNED">Returned / Dishonoured</option>
                    <option value="PRESENTED">Presented in Clearing</option>
                    <option value="AWAITING_CHECKER">Awaiting Checker Approval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Min Instrument Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50000 (PPS Threshold)"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Export Format
                  </label>
                  <select
                    value={filters.format}
                    onChange={(e) => setFilters({ ...filters, format: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="CSV">Standard CSV (Excel Compatible)</option>
                    <option value="JSON">Auditable JSON Ledger</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Template Catalog Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Official Bank MIS & Statutory Reporting Catalog
                </h2>
                <span className="text-xs text-slate-500">
                  Select a standard report template to configure and run
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((tpl) => {
                  const isSelected = selectedTemplate?.id === tpl.id || selectedTemplate?.type === tpl.type;
                  return (
                    <div
                      key={tpl.id || tpl.type}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white relative flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {tpl.code}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                            {tpl.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {tpl.name || tpl.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-400">
                          {tpl.columns?.length || 0} Dimensions
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(tpl);
                            handleGenerate(tpl);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-700 text-white hover:bg-blue-800"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          Compile & Run
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: LIVE REPORT LEDGER & ANALYTICS
           ========================================================================= */}
        {activeTab === "preview" && currentReport && (
          <div className="space-y-6">
            {/* Active Report Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded">
                      {currentReport.reportRef}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      SURAT PEOPLES CO OP BANK
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {currentReport.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prepared by: <span className="font-semibold text-slate-700">{currentReport.generatedByName || currentReport.generatedBy}</span> ({currentReport.generatedByRole || currentReport.userRole}) · Branch: {currentReport.branchName || "All Branches"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 cursor-pointer"
                  >
                    Print Official Bank PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadJson(currentReport.id, currentReport.reportRef)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 cursor-pointer"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadCsv(currentReport.id, currentReport.reportRef)}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    Download CSV (RFC-4180)
                  </button>
                </div>
              </div>

              {/* Summary Stats Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-2">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    Total Instruments
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
                    {currentReport.recordCount}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    Total Volume Reconciled
                  </div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5 font-mono">
                    {formatCurrency(currentReport.totalAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    Clearing Realization Ratio
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
                    {currentReport.summary?.settlementRatePercent || currentReport.summary?.clearRate || "100.0%"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    Generated Date
                  </div>
                  <div className="text-sm font-semibold text-slate-700 mt-1">
                    {new Date(currentReport.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Data Ledger Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Audit Dataset ({filteredRecords.length} Rows)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    · RBI CTS-2010 Standard
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search ledger..."
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-600 w-48 sm:w-64"
                  />
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-slate-800 font-medium"
                  >
                    <option value={15}>15 rows</option>
                    <option value={30}>30 rows</option>
                    <option value={50}>50 rows</option>
                  </select>
                </div>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-sm font-medium">No matching records found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                        {Object.keys(currentReport.records[0] || {}).map((colKey) => (
                          <th
                            key={colKey}
                            onClick={() => handleSort(colKey)}
                            className="py-3 px-4 font-bold whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors select-none"
                          >
                            <div className="flex items-center gap-1">
                              <span>{colKey.replace(/_/g, " ")}</span>
                              {sortField === colKey && (
                                <span className="text-blue-600 font-mono text-xs">
                                  {sortAsc ? "▲" : "▼"}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {paginatedRecords.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          {Object.entries(row).map(([k, val], cIdx) => {
                            const isAmount = k.toLowerCase().includes("amount");
                            const isStatus = k.toLowerCase().includes("status");
                            return (
                              <td
                                key={cIdx}
                                className={`py-2.5 px-4 whitespace-nowrap ${
                                  isAmount
                                    ? "text-right font-bold text-emerald-800"
                                    : "text-slate-800"
                                }`}
                              >
                                {isStatus ? (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      val === "CLEARED" || val === "MATCHED" || val === "VERIFIED"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : val === "RETURNED" || val === "FLAGGED"
                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {String(val)}
                                  </span>
                                ) : isAmount && typeof val === "number" ? (
                                  formatCurrency(val)
                                ) : (
                                  String(val ?? "—")
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Page {currentPage} of {totalPages} ({filteredRecords.length} records)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: REPORT ARCHIVE & AUDIT LEDGER
           ========================================================================= */}
        {activeTab === "archive" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Regulatory Report Archive & Ledger
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete audit history of generated bank MIS returns and statutory files.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">
                Total Archived: {reports.length}
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p className="text-sm font-medium">No reports generated yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click on "Report Generator" above to compile your first bank report.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 font-bold">Report Reference</th>
                      <th className="py-3 px-4 font-bold">Type</th>
                      <th className="py-3 px-4 font-bold">Generated At</th>
                      <th className="py-3 px-4 font-bold">Operator</th>
                      <th className="py-3 px-4 font-bold text-right">Items</th>
                      <th className="py-3 px-4 font-bold text-right">Total Amount</th>
                      <th className="py-3 px-4 font-bold text-center">Format</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {rep.reportRef}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <span className="font-semibold">{rep.title || rep.reportType}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(rep.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {rep.generatedByName || rep.generatedBy}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                          {rep.recordCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                          {formatCurrency(rep.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                            {rep.format}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewReport(rep)}
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadCsv(rep.id, rep.reportRef)}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              CSV
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: AUTOMATED EOD SCHEDULES
           ========================================================================= */}
        {activeTab === "scheduled" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Automated Scheduled MIS & EOD Reporting Jobs
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cron schedules executing automatic generation, archiving, and dispatch of statutory returns.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Scheduler Engine: Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {scheduledJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {job.id}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {job.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Department: {job.department}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-600">
                        <span>Freq: <strong>{job.frequency}</strong></span>
                        <span>Last Run: <strong>{job.lastRun}</strong></span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Auto-Archived to PostgreSQL
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const targetTpl = templates.find((t) => t.type === job.targetType);
                          if (targetTpl) {
                            setSelectedTemplate(targetTpl);
                            handleGenerate(targetTpl);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white transition-all cursor-pointer"
                      >
                        Run Ad-Hoc Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
