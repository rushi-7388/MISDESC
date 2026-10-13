import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState("templates"); // "templates", "archive", "preview"
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filter Parameters
  const [filters, setFilters] = useState({
    dateRange: "all",
    branchName: "ALL",
    status: "ALL",
    minAmount: "",
    format: "CSV",
  });

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
        client.get("/reports?limit=50"),
      ]);
      setTemplates(tplRes.data.templates || []);
      setKpis(kpiRes.data);
      setReports(repRes.data.reports || []);

      if (tplRes.data.templates?.length > 0 && !selectedTemplate) {
        setSelectedTemplate(tplRes.data.templates[0]);
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
        reportType: tpl.id,
        format: filters.format,
        filters: {
          dateRange: filters.dateRange,
          branchName: filters.branchName,
          status: filters.status,
          minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        },
      });

      const generated = res.data.report;
      setCurrentReport(generated);
      setActiveTab("preview");
      notify(`Report ${generated.reportRef} generated successfully.`);
      // Refresh list
      const repRes = await client.get("/reports?limit=50");
      setReports(repRes.data.reports || []);
      const kpiRes = await client.get("/reports/kpis");
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
      link.setAttribute("download", `${reportRef || "bank_report"}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notify("CSV report downloaded successfully.");
    } catch (err) {
      console.error("Failed to download CSV:", err);
      notify("Download failed. Please try again.");
    }
  }

  async function handleViewReport(report) {
    if (report.records && report.records.length > 0) {
      setCurrentReport(report);
      setActiveTab("preview");
    } else {
      try {
        const res = await client.get(`/reports/${report.id}`);
        setCurrentReport(res.data.report);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />

      {/* Floating Institutional Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Institutional Bank Header */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-blue-800 border border-blue-200">
                SURAT PEOPLES CO OP BANK
              </span>
              <span className="text-xs font-mono text-slate-400">
                | CTS MIS Reporting Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bank Reporting & MIS Software
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Official regulatory clearing returns, Positive Pay audit, e-Kuber settlement positions, and statutory MIS reports under RBI CTS-2010 framework.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 cursor-pointer"
            >
              Refresh Data
            </button>
            <button
              type="button"
              onClick={() => handleGenerate(selectedTemplate)}
              disabled={generating || !selectedTemplate}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Compiling Ledger...</span>
                </>
              ) : (
                <>
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Regulatory Templates
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {templates.length || 6}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              RBI & NPCI Compliant
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Reports in Archive
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-1">
              {reports.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Digitally sealed records
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Instruments Audited
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {kpis?.totalInstrumentsAudited?.toLocaleString() || "—"}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              CTS Clearing Records
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Audited Clearing Value
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 truncate">
              {formatCurrency(kpis?.totalVolumeAudited || 0)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              100% Reconciled
            </div>
          </div>
        </div>

        {/* Main Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "templates"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Report Catalog & Generate
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
            Generated Reports Archive ({reports.length})
          </button>
          {currentReport && (
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "preview"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Active Report: {currentReport.reportRef}
            </button>
          )}
        </div>

        {/* VIEW 1: TEMPLATE CATALOG & CONFIGURATION */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            {/* Filter Configuration Panel */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Report Generation Parameters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Date Window
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-600 font-medium"
                  >
                    <option value="all">All Available Clearing Cycles</option>
                    <option value="today">Today's Active Session</option>
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-600 font-medium"
                  >
                    <option value="ALL">All Bank Branches (Consolidated)</option>
                    <option value="Athwa Branch">Athwa Main Branch (Surat)</option>
                    <option value="Varachha Branch">Varachha Branch (Surat)</option>
                    <option value="Rander Road Branch">Rander Road Branch</option>
                    <option value="Ring Road Branch">Ring Road Commercial Branch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Export Format
                  </label>
                  <select
                    value={filters.format}
                    onChange={(e) => setFilters({ ...filters, format: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-600 font-medium"
                  >
                    <option value="CSV">Standard CSV (Excel / ERP Compatible)</option>
                    <option value="JSON">Auditable JSON Ledger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Minimum Amount Filter (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50000 (PPS Threshold)"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-600 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Template Catalog Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                  Official Bank Reporting Templates
                </h2>
                <span className="text-xs text-slate-500">
                  Select a template to configure and compile
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((tpl) => {
                  const isSelected = selectedTemplate?.id === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white relative flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                          : "border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
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
                          {tpl.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-400">
                          {tpl.columns?.length || 0} Data Dimensions
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

        {/* VIEW 2: REPORTS ARCHIVE */}
        {activeTab === "archive" && (
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
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
                  Click on "Report Catalog" above to compile your first bank report.
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
                          {rep.generatedBy}
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

        {/* VIEW 3: ACTIVE REPORT PREVIEW & LEDGER */}
        {activeTab === "preview" && currentReport && (
          <div className="space-y-6">
            {/* Report Header Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded">
                      {currentReport.reportRef}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      SURAT PEOPLES CO OP BANK
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {currentReport.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prepared by: <span className="font-semibold text-slate-700">{currentReport.generatedBy}</span> ({currentReport.userRole})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 cursor-pointer"
                  >
                    Print Report
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
                    Clearing Ratio
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
                    {currentReport.summary?.clearRate || "100.0%"}
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

            {/* Tabular Dataset Ledger */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Detailed Audit Ledger Dataset ({currentReport.records?.length || 0} Rows)
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Standard Format: RBI CTS-2010
                </span>
              </div>

              {(!currentReport.records || currentReport.records.length === 0) ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-sm font-medium">No records found matching filter criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                        {Object.keys(currentReport.records[0]).map((colKey) => (
                          <th key={colKey} className="py-3 px-4 font-bold whitespace-nowrap">
                            {colKey.replace(/_/g, " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {currentReport.records.map((row, idx) => (
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
                                ) : isAmount ? (
                                  formatCurrency(Number(val))
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
