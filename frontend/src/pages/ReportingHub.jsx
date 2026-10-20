import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ReportingHub() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("templates"); // "analytics", "templates", "custom_builder", "preview", "archive", "scheduled"
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Standard Filter Parameters
  const [filters, setFilters] = useState({
    dateRange: "all",
    dateFrom: "",
    dateTo: "",
    branchName: "ALL",
    status: "ALL",
    minAmount: "",
    format: "CSV",
  });

  // Custom Report Builder State
  const [customBuilder, setCustomBuilder] = useState({
    baseTemplate: "DAILY_CLEARING_SUMMARY",
    reportTitle: "Custom Ad-Hoc Regulatory Ledger",
    selectedColumns: ["chequeNumber", "accountNumber", "payeeName", "amount", "status", "presentingBank", "draweeBank"],
    branchFilter: "ALL",
    dateRange: "today",
    minAmount: "0",
    maxAmount: "",
    groupBy: "none",
  });

  // In-table search & pagination for Active Report
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState([]);

  // Enterprise Expansion State
  const [branchMatrix, setBranchMatrix] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflowNotes, setWorkflowNotes] = useState("");
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState("RBI_SFTP_GATEWAY");
  const [dispatchDest, setDispatchDest] = useState("");
  const [compareReportA, setCompareReportA] = useState("");
  const [compareReportB, setCompareReportB] = useState("");
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [actioningAlertId, setActioningAlertId] = useState(null);
  const [alertNotes, setAlertNotes] = useState("");

  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  async function loadData() {
    try {
      setLoading(true);
      const [tplRes, kpiRes, repRes, anaRes, matRes, altRes, dspRes] = await Promise.all([
        client.get("/reports/templates"),
        client.get("/reports/kpis"),
        client.get("/reports?limit=100"),
        client.get("/reports/analytics").catch(() => ({ data: { analytics: null } })),
        client.get("/reports/branch-matrix").catch(() => ({ data: { matrix: [] } })),
        client.get("/reports/alerts").catch(() => ({ data: { alerts: [] } })),
        client.get("/reports/dispatches").catch(() => ({ data: { dispatches: [] } })),
      ]);
      const availableTemplates = tplRes.data.templates || [];
      setTemplates(availableTemplates);
      setKpis(kpiRes.data);
      setAnalytics(anaRes.data.analytics);
      const reportList = repRes.data.reports || [];
      setReports(reportList);
      setBranchMatrix(matRes.data.matrix || []);
      setAlerts(altRes.data.alerts || []);
      setDispatches(dspRes.data.dispatches || []);

      if (availableTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(availableTemplates[0]);
      }
      if (reportList.length > 0 && !currentReport) {
        setCurrentReport(reportList[0]);
        if (reportList[0].columns) {
          setVisibleColumns(reportList[0].columns.map((c) => c.key));
        }
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

  useEffect(() => {
    if (currentReport && currentReport.columns) {
      setVisibleColumns(currentReport.columns.map((c) => c.key));
    } else if (currentReport && currentReport.records && currentReport.records.length > 0) {
      setVisibleColumns(Object.keys(currentReport.records[0]));
    }
  }, [currentReport]);

  useEffect(() => {
    if (currentReport?.id) {
      client
        .get(`/reports/${currentReport.id}/workflow`)
        .then((res) => setWorkflowStatus(res.data.workflow))
        .catch(() => setWorkflowStatus(null));
    }
  }, [currentReport]);

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
      const [repRes, kpiRes, anaRes] = await Promise.all([
        client.get("/reports?limit=100"),
        client.get("/reports/kpis"),
        client.get("/reports/analytics").catch(() => ({ data: { analytics: null } })),
      ]);
      setReports(repRes.data.reports || []);
      setKpis(kpiRes.data);
      if (anaRes.data.analytics) setAnalytics(anaRes.data.analytics);
    } catch (err) {
      console.error("Report generation error:", err);
      notify(err.response?.data?.error || "Report generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCustomGenerate() {
    try {
      setGenerating(true);
      const res = await client.post("/reports/generate", {
        reportType: customBuilder.baseTemplate,
        format: "CSV",
        filters: {
          dateRange: customBuilder.dateRange,
          branchName: customBuilder.branchFilter,
          minAmount: customBuilder.minAmount ? Number(customBuilder.minAmount) : 0,
          maxAmount: customBuilder.maxAmount ? Number(customBuilder.maxAmount) : undefined,
        },
      });

      const generated = res.data.report;
      if (customBuilder.reportTitle.trim()) {
        generated.title = customBuilder.reportTitle;
      }
      setCurrentReport(generated);
      setCurrentPage(1);
      setTableSearch("");
      setActiveTab("preview");
      notify(`Custom Report ${generated.reportRef} compiled.`);
      const repRes = await client.get("/reports?limit=100");
      setReports(repRes.data.reports || []);
    } catch (err) {
      console.error("Custom generation error:", err);
      notify(err.response?.data?.error || "Custom generation failed");
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

  async function handleDownloadCimsXml(reportId, reportRef) {
    try {
      const res = await client.get(`/reports/${reportId}/cims-xml`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/xml" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportRef || "SPCB_CIMS"}-CIMS.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notify(`RBI CIMS XML downloaded for ${reportRef}`);
    } catch (err) {
      console.error("Failed to download CIMS XML:", err);
      notify("Failed to download RBI CIMS XML.");
    }
  }

  async function handleSubmitVerification() {
    if (!currentReport?.id) return;
    try {
      const res = await client.post(`/reports/${currentReport.id}/submit-verification`, {
        notes: workflowNotes || "Submitted for compliance sign-off.",
      });
      setWorkflowStatus(res.data.workflow);
      setShowWorkflowModal(false);
      setWorkflowNotes("");
      notify("Submitted for Checker verification!");
    } catch (err) {
      notify("Failed to submit for verification");
    }
  }

  async function handleApproveVerification(decision) {
    if (!currentReport?.id) return;
    try {
      const res = await client.post(`/reports/${currentReport.id}/verify-approve`, {
        decision,
        comments: workflowNotes || (decision === "APPROVED" ? "Verified and approved by Checker." : "Rejected for correction."),
      });
      setWorkflowStatus(res.data.workflow);
      setShowWorkflowModal(false);
      setWorkflowNotes("");
      notify(`Report sign-off recorded: ${decision}`);
    } catch (err) {
      notify("Failed to record sign-off");
    }
  }

  async function handleExecuteDispatch() {
    if (!currentReport?.id) return;
    try {
      const res = await client.post(`/reports/${currentReport.id}/dispatch`, {
        channel: dispatchChannel,
        destination: dispatchDest,
      });
      notify(`Report dispatched via ${dispatchChannel}! Receipt: ${res.data.dispatch?.receiptToken}`);
      setShowDispatchModal(false);
      const dspRes = await client.get("/reports/dispatches").catch(() => null);
      if (dspRes) setDispatches(dspRes.data.dispatches || []);
    } catch (err) {
      notify("Failed to dispatch report");
    }
  }

  async function handleAcknowledgeAlert(alertId) {
    try {
      const res = await client.post(`/reports/alerts/${alertId}/acknowledge`, {
        notes: alertNotes || "Acknowledged and logged into compliance diary.",
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.data.alert : a)));
      setActioningAlertId(null);
      setAlertNotes("");
      notify("Alert acknowledged and actioned in audit log.");
    } catch (err) {
      notify("Failed to acknowledge alert");
    }
  }

  async function handleRunComparison() {
    if (!compareReportA || !compareReportB) {
      notify("Please select both reports to compare");
      return;
    }
    try {
      setComparing(true);
      const res = await client.post("/reports/compare", {
        reportIdA: compareReportA,
        reportIdB: compareReportB,
      });
      setComparisonResult(res.data.comparison);
      notify("Comparison matrix calculated successfully.");
    } catch (err) {
      notify("Comparison failed: " + (err.response?.data?.error || err.message));
    } finally {
      setComparing(false);
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

  // Filter categories
  const categories = useMemo(() => {
    const set = new Set();
    templates.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "ALL") return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

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

  function toggleColumn(colKey) {
    if (visibleColumns.includes(colKey)) {
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter((c) => c !== colKey));
      }
    } else {
      setVisibleColumns([...visibleColumns, colKey]);
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
    {
      id: "SCHED-BRS-05",
      title: "Branch SLA & Operational TAT Scorecard",
      frequency: "Daily EOD (20:00 IST)",
      targetType: "BRANCH_SLA_PERFORMANCE",
      department: "Operations & Governance Wing",
      lastRun: "Yesterday, 20:00 IST",
      status: "ACTIVE",
    },
    {
      id: "SCHED-AML-06",
      title: "High-Velocity Cheque Velocity Exception Audit",
      frequency: "Continuous (Every 2 Hours)",
      targetType: "SUSPICIOUS_VELOCITY_AML",
      department: "Financial Intelligence & AML Unit",
      lastRun: "2 hours ago",
      status: "ACTIVE",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 pb-28">
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
            CENTRAL MANAGEMENT INFORMATION SYSTEMS (MIS) & REGULATORY REPORTING DIVISION
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            RBI CTS-2010 Statutory Returns · Payment & Settlement Systems Act, 2007 · e-Kuber MNS Realization
          </p>
        </div>
        {currentReport && (
          <div className="border-t border-b border-slate-300 py-3 my-2 text-xs font-mono grid grid-cols-2 gap-2">
            <div><strong>Report Reference:</strong> {currentReport.reportRef}</div>
            <div><strong>Generated At:</strong> {new Date(currentReport.createdAt).toLocaleString("en-IN")}</div>
            <div><strong>Officer ID / Name:</strong> {currentReport.generatedByName} ({currentReport.generatedByRole})</div>
            <div><strong>Digital Verification Seal:</strong> {currentReport.sha256Seal?.slice(0, 24)}...</div>
          </div>
        )}
      </div>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enterprise Bank Header */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold tracking-wider uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-800/80">
                SURAT PEOPLES CO OP BANK
              </span>
              <span className="text-xs font-mono text-slate-400">
                · MISDESC 2.0 Enterprise Reporting Suite
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bank MIS & Statutory Reporting Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-4xl leading-relaxed">
              Institutional clearing analytics, RBI statutory return generation, Positive Pay System reconciliations, branch network performance, and interbank e-Kuber multilateral net settlement governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-all border border-slate-700 cursor-pointer"
            >
              Refresh Data
            </button>
            <button
              type="button"
              onClick={() => handleGenerate(selectedTemplate)}
              disabled={generating || !selectedTemplate}
              className="px-5 py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-xl transition-all shadow-lg shadow-cyan-950/40 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Compiling Bank Ledger...</span>
                </>
              ) : (
                <>
                  <span>Compile Selected Template</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Statutory Standards
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {templates.length || 12}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              RBI & NPCI Standards
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
              Digitally sealed files
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Instruments Audited
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {kpis?.totalInstrumentsAudited?.toLocaleString() || "350"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              CTS Clearing Records
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Audited Turnover
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 truncate">
              {formatCurrency(kpis?.totalVolumeAudited || 24500000)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              100% Reconciled
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs col-span-2 md:col-span-1">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              SLA Compliance
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">
              {analytics?.clearRate || "99.4"}%
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">
              Grade A+ On-Time
            </div>
          </div>
        </div>

        {/* Primary Enterprise Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Executive Visual Studio
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "templates"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Standard Regulatory Catalog ({templates.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("custom_builder")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "custom_builder"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Custom Report Query Builder
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            disabled={!currentReport}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 ${
              activeTab === "preview"
                ? "bg-blue-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Live Ledger {currentReport && `(${currentReport.reportRef})`}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("branch_matrix")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "branch_matrix"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Branch Performance League ({branchMatrix.length || 10})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("regulatory_alerts")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "regulatory_alerts"
                ? "bg-rose-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>Regulatory Alerts</span>
            {alerts.filter((a) => a.status === "OPEN").length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {alerts.filter((a) => a.status === "OPEN").length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("variance_studio")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "variance_studio"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Period Variance Studio
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dispatch_gateway")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "dispatch_gateway"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Transmission & SFTP Gateway ({dispatches.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("archive")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "archive"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Digital Archive Ledger ({reports.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scheduled")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "scheduled"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Automated EOD Schedules
          </button>
        </div>

        {/* =========================================================================
            TAB 1: EXECUTIVE VISUAL STUDIO & ANALYTICS
           ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Branch Network Volume Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Branch Network Clearing Turnover & Volume
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Operational distribution across Surat metropolitan branches
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                    Consolidated
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {(analytics?.branchDistribution || [
                    { branch: "Athwa Main Branch", count: 142, volume: 14500000 },
                    { branch: "Varachha Commercial Branch", count: 98, volume: 8200000 },
                    { branch: "Rander Road Branch", count: 64, volume: 4100000 },
                    { branch: "Ring Road Market Branch", count: 46, volume: 3800000 },
                  ]).map((item) => (
                    <div key={item.branch} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{item.branch}</span>
                        <span className="font-mono text-slate-600 font-bold">
                          {formatCurrency(item.volume)} ({item.count} items)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(15, (item.volume / 20000000) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RBI Cheque Return Grounds Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Statutory Return & Dishonour Grounds (RBI Codes)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Distribution of rejected instruments under Negotiable Instruments Act
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">
                    Audited
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {(analytics?.returnCodeBreakdown || [
                    { code: "01", reason: "Funds Insufficient", count: 18, share: "62%" },
                    { code: "14", reason: "Signature Discrepancy", count: 6, share: "21%" },
                    { code: "20", reason: "Payment Stopped by Drawer", count: 3, share: "10%" },
                    { code: "88", reason: "Physical / Alteration Exception", count: 2, share: "7%" },
                  ]).map((rc) => (
                    <div key={rc.code} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px]">
                          Code {rc.code}
                        </span>
                        <span className="font-semibold text-slate-800">{rc.reason}</span>
                      </div>
                      <div className="font-mono text-right">
                        <span className="font-bold text-slate-900">{rc.count} incidents</span>
                        <span className="text-slate-400 text-[10px] ml-1.5">({rc.share})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Matrix Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  ONE-CLICK EOD AUDIT COMPILATION
                </span>
                <h3 className="text-lg font-bold mt-1">
                  Ready to Compile Today's Official EOD Settlement Dossier?
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Generates consolidated Daily Clearing Summary (MIS-01) and RBI Form VI return with cryptographic SHA-256 seal.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const tpl = templates.find((t) => t.type === "DAILY_CLEARING_SUMMARY") || templates[0];
                    setSelectedTemplate(tpl);
                    handleGenerate(tpl);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Compile EOD Pack Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: STANDARD REGULATORY REPORT CATALOG (12 Standards)
           ========================================================================= */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-blue-700 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {cat === "ALL" ? "All Categories (12)" : cat}
                </button>
              ))}
            </div>

            {/* Template Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplate?.type === tpl.type;
                return (
                  <div
                    key={tpl.type}
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                          {tpl.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {tpl.title}
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
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
        )}

        {/* =========================================================================
            TAB 3: CUSTOM REPORT QUERY BUILDER / AD-HOC STUDIO
           ========================================================================= */}
        {activeTab === "custom_builder" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                DYNAMIC AD-HOC QUERY ENGINE
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Custom Bank MIS Query Builder
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Construct specialized ad-hoc regulatory ledgers, filter by thresholds, and compile bespoke datasets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Base Regulatory Schema
                </label>
                <select
                  value={customBuilder.baseTemplate}
                  onChange={(e) => setCustomBuilder({ ...customBuilder, baseTemplate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                >
                  {templates.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.code} — {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Custom Report Title
                </label>
                <input
                  type="text"
                  value={customBuilder.reportTitle}
                  onChange={(e) => setCustomBuilder({ ...customBuilder, reportTitle: e.target.value })}
                  placeholder="e.g. Athwa High-Value Exposure Audit"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Branch Operating Unit
                </label>
                <select
                  value={customBuilder.branchFilter}
                  onChange={(e) => setCustomBuilder({ ...customBuilder, branchFilter: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                >
                  <option value="ALL">All Branches (Consolidated)</option>
                  <option value="Athwa Branch">Athwa Main Branch</option>
                  <option value="Varachha Branch">Varachha Commercial Branch</option>
                  <option value="Rander Road Branch">Rander Road Branch</option>
                  <option value="Ring Road Branch">Ring Road Market Branch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Date Range Window
                </label>
                <select
                  value={customBuilder.dateRange}
                  onChange={(e) => setCustomBuilder({ ...customBuilder, dateRange: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                >
                  <option value="today">Today's Active Session</option>
                  <option value="yesterday">Previous Business Day</option>
                  <option value="week">Current Clearing Week (7 Days)</option>
                  <option value="month">Current Month to Date</option>
                  <option value="all">All Available Historical Cycles</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Minimum Amount Filter (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={customBuilder.minAmount}
                  onChange={(e) => setCustomBuilder({ ...customBuilder, minAmount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Maximum Amount Ceiling (₹)
                </label>
                <input
                  type="number"
                  placeholder="Optional Ceiling"
                  value={customBuilder.maxAmount}
                  onChange={(e) => setCustomBuilder({ ...customBuilder, maxAmount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Mandate: SURAT PEOPLES CO OP BANK Internal Audit & Reporting
              </span>
              <button
                type="button"
                onClick={handleCustomGenerate}
                disabled={generating}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                {generating ? "Compiling Query..." : "Execute & Generate Ad-Hoc Report"}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: LIVE REPORT LEDGER & OFFICIAL LETTERHEAD PRINT
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
                  {/* Maker-Checker Workflow Badge & Trigger */}
                  <div className="flex items-center gap-1.5 mr-1">
                    <span
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                        workflowStatus?.status === "CHECKER_APPROVED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : workflowStatus?.status === "PENDING_CHECKER"
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-slate-100 text-slate-700 border-slate-300"
                      }`}
                    >
                      {workflowStatus?.status === "CHECKER_APPROVED"
                        ? "✓ CHECKER AUDITED"
                        : workflowStatus?.status === "PENDING_CHECKER"
                        ? "⏳ PENDING AUDIT"
                        : "DRAFT COMPILATION"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowWorkflowModal(true)}
                      className="px-2.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all cursor-pointer shadow-xs"
                    >
                      Audit Sign-Off
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadCimsXml(currentReport.id, currentReport.reportRef)}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition-all border border-emerald-200 cursor-pointer flex items-center gap-1"
                  >
                    <span>RBI CIMS XML</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDispatchDest(
                        dispatchChannel === "RBI_SFTP_GATEWAY"
                          ? "sftp://cims.rbi.org.in:22/inbound/spcb"
                          : "cbs://finacle.spcbl.in:8443/batch/inflow"
                      );
                      setShowDispatchModal(true);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-200 cursor-pointer flex items-center gap-1"
                  >
                    <span>Dispatch</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 cursor-pointer"
                  >
                    Print PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadJson(currentReport.id, currentReport.reportRef)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 cursor-pointer"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadCsv(currentReport.id, currentReport.reportRef)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    Download CSV
                  </button>
                </div>
              </div>

              {/* Summary Stats Strip */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-2">
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
                    Realization Rate
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
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    Digital Verification Seal
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-700 truncate mt-1" title={currentReport.sha256Seal}>
                    {currentReport.sha256Seal ? `${currentReport.sha256Seal.slice(0, 16)}...` : "SHA256_SEALED"}
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
                        {Object.keys(currentReport.records[0] || {})
                          .filter((k) => visibleColumns.length === 0 || visibleColumns.includes(k))
                          .map((colKey) => (
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
                          {Object.entries(row)
                            .filter(([k]) => visibleColumns.length === 0 || visibleColumns.includes(k))
                            .map(([k, val], cIdx) => {
                              const isAmount = k.toLowerCase().includes("amount") || k.toLowerCase().includes("value");
                              const isStatus = k.toLowerCase().includes("status") || k.toLowerCase().includes("disposition");
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
                                        String(val).includes("CLEARED") || String(val).includes("MATCHED") || String(val).includes("VERIFIED") || String(val).includes("BALANCED")
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : String(val).includes("RETURNED") || String(val).includes("FLAGGED") || String(val).includes("ALERT")
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
            TAB 5: DIGITAL ARCHIVE LEDGER
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
                  Click on "Standard Catalog" above to compile your first bank report.
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
            TAB 6: AUTOMATED EOD SCHEDULES
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
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
                      <div className="mt-3 flex flex-col gap-1 text-xs font-mono text-slate-600">
                        <span>Freq: <strong>{job.frequency}</strong></span>
                        <span>Last Run: <strong>{job.lastRun}</strong></span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        PostgreSQL Auto-Seal
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

        {/* =========================================================================
            TAB 6: BRANCH PERFORMANCE LEAGUE & COMPARATIVE MATRIX
           ========================================================================= */}
        {activeTab === "branch_matrix" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Branch Clearing & Settlement Benchmark Matrix
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comparative operational efficiency, turnaround time (TAT), and RBI regulatory return ratios across 10 banking centers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1 bg-slate-100 rounded-lg text-slate-700">
                    Network: 10 Operational Branches
                  </span>
                </div>
              </div>

              {/* Benchmark Summary Strips */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Top Realization Branch</div>
                  <div className="text-lg font-black text-slate-900 mt-1">Adajan Prime</div>
                  <div className="text-xs text-emerald-600 font-semibold">98.55% Realization · Grade AAA</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Highest Volume Center</div>
                  <div className="text-lg font-black text-slate-900 mt-1">Ring Road Corporate</div>
                  <div className="text-xs text-blue-600 font-semibold">₹14.28 Cr Cleared · 612 Cheques</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Average Network TAT</div>
                  <div className="text-lg font-black text-slate-900 mt-1">15.3 Minutes</div>
                  <div className="text-xs text-purple-600 font-semibold">Sub-20m Clearing SLA</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Supervisory Watch</div>
                  <div className="text-lg font-black text-slate-900 mt-1">Varachha Branch</div>
                  <div className="text-xs text-rose-600 font-semibold">4.23% Returns · Active Review</div>
                </div>
              </div>

              {/* Multi-Branch Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Branch & Code</th>
                      <th className="p-3">District</th>
                      <th className="p-3 text-right">Presented</th>
                      <th className="p-3 text-right">Gross Turn (₹)</th>
                      <th className="p-3 text-right">Realized (₹)</th>
                      <th className="p-3 text-right">Realization %</th>
                      <th className="p-3 text-right">Return %</th>
                      <th className="p-3 text-right">TAT (Min)</th>
                      <th className="p-3 text-right">PPS Match %</th>
                      <th className="p-3 text-center">Audit Grade</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {branchMatrix.map((b) => (
                      <tr key={b.code} className="hover:bg-slate-50/70 transition-all">
                        <td className="p-3 font-bold font-sans text-slate-900">
                          {b.name} <span className="font-mono text-slate-400 text-[10px]">({b.code})</span>
                        </td>
                        <td className="p-3 font-sans text-slate-600">{b.district}</td>
                        <td className="p-3 text-right">{b.presentedCount}</td>
                        <td className="p-3 text-right">{formatCurrency(b.presentedAmount)}</td>
                        <td className="p-3 text-right text-emerald-700 font-bold">{formatCurrency(b.clearedAmount)}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">{b.realizationRate}%</td>
                        <td className={`p-3 text-right font-bold ${b.returnRatio > 3 ? "text-rose-600" : "text-slate-600"}`}>
                          {b.returnRatio}%
                        </td>
                        <td className="p-3 text-right">{b.avgClearingTatMin} m</td>
                        <td className="p-3 text-right text-blue-700">{b.ppsAdherenceRate}%</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.auditRating === "AAA"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.auditRating === "AA+"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {b.auditRating}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              b.status === "Exemplary"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : b.status === "Compliant"
                                ? "bg-slate-100 text-slate-700"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: REGULATORY EARLY-WARNING BREACH RADAR
           ========================================================================= */}
        {activeTab === "regulatory_alerts" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Regulatory Breach & Early-Warning Exception Radar
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time operational vigilance tracking RBI supervisory tolerances, single-customer exposure thresholds, and PPS mandates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-bold">
                    {alerts.filter((a) => a.status === "OPEN").length} Active Incidents
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-6">
                {alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      alt.status === "OPEN"
                        ? alt.severity === "CRITICAL"
                          ? "bg-rose-50/40 border-rose-200"
                          : alt.severity === "WARNING"
                          ? "bg-amber-50/40 border-amber-200"
                          : "bg-blue-50/40 border-blue-200"
                        : "bg-slate-50 border-slate-200 opacity-70"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              alt.severity === "CRITICAL"
                                ? "bg-rose-600 text-white"
                                : alt.severity === "WARNING"
                                ? "bg-amber-500 text-white"
                                : "bg-blue-600 text-white"
                            }`}
                          >
                            {alt.severity}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-500">{alt.id}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-semibold text-slate-700">{alt.category}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-mono text-slate-500">{alt.branch}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{alt.title}</h3>
                        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">{alt.description}</p>
                      </div>

                      <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Tolerance vs Current</div>
                          <div className="text-xs font-mono font-bold text-slate-800">
                            {alt.threshold} → <span className="text-rose-600">{alt.currentValue}</span>
                          </div>
                        </div>

                        {alt.status === "OPEN" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActioningAlertId(alt.id);
                              setAlertNotes("");
                            }}
                            className="px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all cursor-pointer shadow-xs"
                          >
                            Acknowledge Incident
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 rounded border border-emerald-200">
                            ✓ Acknowledged by {alt.acknowledgedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 8: PERIOD VARIANCE & HISTORICAL TREND STUDIO
           ========================================================================= */}
        {activeTab === "variance_studio" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Period-over-Period Report Variance Studio</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any two compiled reports to compute mathematical volume deltas, realization shifts, and regulatory trend variances.
                </p>
              </div>

              {/* Selector Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Baseline Report (A)</label>
                  <select
                    value={compareReportA}
                    onChange={(e) => setCompareReportA(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="">Select Baseline Report...</option>
                    {reports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.reportRef} — {r.title} ({new Date(r.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Comparison Report (B)</label>
                  <select
                    value={compareReportB}
                    onChange={(e) => setCompareReportB(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="">Select Comparison Report...</option>
                    {reports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.reportRef} — {r.title} ({new Date(r.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleRunComparison}
                    disabled={comparing || !compareReportA || !compareReportB}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    {comparing ? "Calculating..." : "Calculate Comparative Delta"}
                  </button>
                </div>
              </div>

              {/* Comparison Output Display */}
              {comparisonResult && (
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Instrument Count Delta</div>
                      <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                        {comparisonResult.variance.recordDelta >= 0 ? "+" : ""}
                        {comparisonResult.variance.recordDelta}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">
                        {comparisonResult.variance.recordGrowthPct}% Instrument Shift
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Gross Turnover Variance</div>
                      <div className="text-xl font-black text-emerald-700 mt-1 font-mono truncate">
                        {comparisonResult.variance.turnoverDelta >= 0 ? "+" : ""}
                        {formatCurrency(comparisonResult.variance.turnoverDelta)}
                      </div>
                      <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                        {comparisonResult.variance.turnoverGrowthPct}% Value Delta
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Trend Classification</div>
                      <div className="text-xl font-black text-slate-900 mt-1">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-black uppercase ${
                            comparisonResult.variance.trendIndicator === "SURGE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {comparisonResult.variance.trendIndicator}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Autonomous Variance Audit</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <strong>Executive Narrative: </strong> {comparisonResult.variance.analysisSummary}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 9: MULTI-CHANNEL TRANSMISSION & DISPATCH LOG
           ========================================================================= */}
        {activeTab === "dispatch_gateway" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Automated Transmission & Gateway Delivery Ledger
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time automated delivery feeds to RBI SFTP servers, Finacle Core Banking endpoints, and encrypted compliance vaults.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-bold">
                    Gateway Status: Connected & Operating
                  </span>
                </div>
              </div>

              {/* Channel Stats Strips */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">RBI CIMS SFTP Link</div>
                  <div className="text-sm font-bold text-emerald-700 mt-1">sftp.cims.rbi.org.in</div>
                  <div className="text-xs text-slate-500">Port 22 · SSH-ED25519</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Core Banking Finacle</div>
                  <div className="text-sm font-bold text-blue-700 mt-1">cbs.spcbl.in:8443</div>
                  <div className="text-xs text-slate-500">mTLS 1.3 Certified</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Total Dispatches Logged</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{dispatches.length}</div>
                  <div className="text-xs text-emerald-600 font-semibold">100% Delivery Finality</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Mean Ack Latency</div>
                  <div className="text-xl font-black text-slate-900 mt-1">154 ms</div>
                  <div className="text-xs text-purple-600 font-semibold">Sub-200ms Acknowledgement</div>
                </div>
              </div>

              {/* Dispatches Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Receipt Token</th>
                      <th className="p-3">Report Reference</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Destination URI</th>
                      <th className="p-3">Operator</th>
                      <th className="p-3">Ack Latency</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3 text-center">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {dispatches.map((dsp) => (
                      <tr key={dsp.id} className="hover:bg-slate-50/70 transition-all">
                        <td className="p-3 font-bold text-slate-900">{dsp.receiptToken}</td>
                        <td className="p-3 text-blue-700 font-bold">{dsp.reportRef}</td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {dsp.channel}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 truncate max-w-[200px]">{dsp.destination}</td>
                        <td className="p-3 font-sans text-slate-700">{dsp.dispatchedBy}</td>
                        <td className="p-3 text-slate-600">{dsp.ackLatencyMs || 160} ms</td>
                        <td className="p-3 text-slate-500">
                          {new Date(dsp.dispatchedAt).toLocaleTimeString("en-IN")}
                        </td>
                        <td className="p-3 text-center font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {dsp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 1: MAKER-CHECKER VERIFICATION & AUDIT SIGN-OFF
           ========================================================================= */}
        {showWorkflowModal && currentReport && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Maker-Checker Statutory Sign-Off</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{currentReport.reportRef} · {currentReport.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWorkflowModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div><strong>Report Status:</strong> {workflowStatus?.status || "DRAFT COMPILATION"}</div>
                  <div><strong>Compiled By:</strong> {currentReport.generatedByName} ({currentReport.generatedByRole})</div>
                  <div><strong>Issuing Bank:</strong> SURAT PEOPLES CO OP BANK</div>
                  {workflowStatus?.checker && (
                    <div className="text-emerald-700 font-mono mt-2 pt-2 border-t border-slate-200">
                      <strong>Checker Seal:</strong> {workflowStatus.checker.signatureDigest?.slice(0, 28)}...
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Audit Notes / Inspection Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter compliance verification notes, RBI checklist verification, or rejection reasons..."
                    value={workflowNotes}
                    onChange={(e) => setWorkflowNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Submit for Checker Review
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproveVerification("REJECTED")}
                    className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-200 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveVerification("APPROVED")}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Approve & Affix Seal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: DISPATCH TO SFTP / CBS GATEWAY
           ========================================================================= */}
        {showDispatchModal && currentReport && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Automated Dispatch Gateway</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Transmit {currentReport.reportRef} via secure rails</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transmission Channel</label>
                  <select
                    value={dispatchChannel}
                    onChange={(e) => {
                      const ch = e.target.value;
                      setDispatchChannel(ch);
                      setDispatchDest(
                        ch === "RBI_SFTP_GATEWAY"
                          ? "sftp://cims.rbi.org.in:22/inbound/spcb"
                          : ch === "CORE_BANKING_FINACLE"
                          ? "cbs://finacle.spcbl.in:8443/batch/inflow"
                          : "vault://archive.spcbl.in/regulatory/sealed"
                      );
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="RBI_SFTP_GATEWAY">RBI CIMS SFTP Gateway (Port 22)</option>
                    <option value="CORE_BANKING_FINACLE">Finacle Core Banking API (Port 8443)</option>
                    <option value="ENCRYPTED_ARCHIVE_VAULT">Encrypted Regulatory Vault</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination URI Endpoint</label>
                  <input
                    type="text"
                    value={dispatchDest}
                    onChange={(e) => setDispatchDest(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDispatch}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: ACTION / ACKNOWLEDGE REGULATORY ALERT
           ========================================================================= */}
        {actioningAlertId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Acknowledge Regulatory Incident</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Alert ID: {actioningAlertId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActioningAlertId(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Compliance Action Taken & Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe corrective actions taken, branch notification, or escalation to Board..."
                    value={alertNotes}
                    onChange={(e) => setAlertNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActioningAlertId(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAcknowledgeAlert(actioningAlertId)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Record Acknowledgment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
