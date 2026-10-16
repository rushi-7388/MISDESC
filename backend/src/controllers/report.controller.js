const reportService = require("../services/report.service");

/**
 * Controller for Bank MIS & Regulatory Reporting Suite
 */

async function getTemplates(req, res) {
  try {
    const role = req.user?.role || "ADMIN";
    const templates = reportService.getAvailableTemplates(role);
    return res.json({ templates });
  } catch (err) {
    console.error("Failed to load report templates:", err);
    return res.status(500).json({ error: "Failed to retrieve reporting templates" });
  }
}

async function generateReport(req, res) {
  try {
    const { reportType, format = "CSV", filters = {} } = req.body;
    const user = req.user || {
      name: "Bank Operator",
      role: "ADMIN",
      email: "reports@MISDESC.com",
      branchName: "Main Branch",
    };

    const report = await reportService.generateReport({
      reportType,
      format,
      filters,
      user,
    });

    return res.status(201).json({
      message: `Report ${report.reportRef} generated successfully.`,
      report,
    });
  } catch (err) {
    console.error("Report generation failed:", err);
    return res.status(500).json({ error: err.message || "Failed to generate report" });
  }
}

async function listReports(req, res) {
  try {
    const { page = 1, limit = 20, reportType } = req.query;
    const user = req.user || {};
    const reports = await reportService.listReports({ page, limit, reportType, user });
    return res.json({ reports });
  } catch (err) {
    console.error("Failed to list reports:", err);
    return res.status(500).json({ error: "Failed to retrieve reports list" });
  }
}

async function getReportById(req, res) {
  try {
    const { id } = req.params;
    const report = await reportService.getReportById(id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    return res.json({ report });
  } catch (err) {
    console.error("Failed to retrieve report:", err);
    return res.status(500).json({ error: "Failed to retrieve report details" });
  }
}

async function exportReport(req, res) {
  try {
    const { id } = req.params;
    const { format = "csv" } = req.query;
    const report = await reportService.getReportById(id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (format.toLowerCase() === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${report.reportRef}.json"`);
      return res.send(JSON.stringify(report, null, 2));
    }

    const csvData = reportService.exportReportToCsv(report);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${report.reportRef}.csv"`);
    return res.send(csvData);
  } catch (err) {
    console.error("Report export failed:", err);
    return res.status(500).json({ error: "Failed to export report file" });
  }
}

async function getQuickStats(req, res) {
  try {
    const templates = reportService.REPORT_TEMPLATES;
    const user = req.user || {};
    const reports = await reportService.listReports({ limit: 100, user });

    const totalGenerated = reports.length;
    const totalInstrumentsAudited = reports.reduce((acc, r) => acc + (r.recordCount || 0), 0);
    const totalVolumeAudited = reports.reduce((acc, r) => acc + (r.totalAmount || 0), 0);

    return res.json({
      templatesCount: templates.length,
      totalGenerated,
      totalInstrumentsAudited,
      totalVolumeAudited,
      bankName: "SURAT PEOPLES CO OP BANK",
      systemStandard: "RBI CTS-2010 & e-Kuber Reporting Framework",
    });
  } catch (err) {
    console.error("Failed to load reporting stats:", err);
    return res.status(500).json({ error: "Failed to load reporting overview" });
  }
}

async function getAnalytics(req, res) {
  try {
    const analytics = await reportService.getAnalyticsSummary();
    return res.json({ analytics });
  } catch (err) {
    console.error("Failed to load analytics summary:", err);
    return res.status(500).json({ error: "Failed to load reporting analytics" });
  }
}

async function submitVerification(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = req.user || { name: "Clearing Officer", role: "BRANCH_MANAGER" };
    const result = await reportService.submitForVerification(id, user, notes);
    return res.json({ message: "Report successfully submitted for Checker audit.", ...result });
  } catch (err) {
    console.error("Submit verification error:", err);
    return res.status(500).json({ error: err.message || "Failed to submit for verification" });
  }
}

async function approveVerification(req, res) {
  try {
    const { id } = req.params;
    const { decision = "APPROVED", comments = "" } = req.body;
    const checker = req.user || { name: "Audit Head", role: "COMPLIANCE_AUDITOR" };
    const result = await reportService.verifyAndApproveReport(id, checker, { decision, comments });
    return res.json({ message: `Report sign-off recorded: ${decision}`, ...result });
  } catch (err) {
    console.error("Approve verification error:", err);
    return res.status(500).json({ error: err.message || "Failed to record sign-off" });
  }
}

async function getWorkflowStatus(req, res) {
  try {
    const { id } = req.params;
    const workflow = reportService.getWorkflowStatus(id);
    return res.json({ workflow });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve workflow status" });
  }
}

async function exportCimsXml(req, res) {
  try {
    const { id } = req.params;
    const report = await reportService.getReportById(id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    const xml = reportService.generateRbiCimsXml(report);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${report.reportRef}-CIMS.xml"`);
    return res.send(xml);
  } catch (err) {
    console.error("CIMS export error:", err);
    return res.status(500).json({ error: "Failed to generate CIMS XML return" });
  }
}

async function getBranchMatrix(req, res) {
  try {
    const matrix = reportService.getBranchPerformanceMatrix();
    return res.json({ matrix, bankName: "THE SURAT PEOPLES CO-OPERATIVE BANK LTD." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve branch performance matrix" });
  }
}

async function getAlerts(req, res) {
  try {
    const alerts = reportService.getRegulatoryAlerts();
    return res.json({ alerts });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve regulatory alerts" });
  }
}

async function acknowledgeAlert(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = req.user || { name: "Compliance Officer", role: "ADMIN" };
    const alert = reportService.acknowledgeAlert(id, user, notes);
    return res.json({ message: "Alert acknowledged and logged.", alert });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to acknowledge alert" });
  }
}

async function compareReports(req, res) {
  try {
    const { reportIdA, reportIdB } = req.body;
    if (!reportIdA || !reportIdB) {
      return res.status(400).json({ error: "Both reportIdA and reportIdB are required" });
    }
    const comparison = await reportService.compareReports(reportIdA, reportIdB);
    return res.json({ comparison });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to compare reports" });
  }
}

async function dispatchReport(req, res) {
  try {
    const { id } = req.params;
    const { channel = "RBI_SFTP_GATEWAY", destination = "" } = req.body;
    const user = req.user || { name: "System Operator", role: "ADMIN" };
    const dispatch = await reportService.dispatchReport(id, channel, destination, user);
    return res.json({ message: `Report dispatched successfully via ${channel}`, dispatch });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to dispatch report" });
  }
}

async function getDispatchLogs(req, res) {
  try {
    const dispatches = reportService.getDispatchLogs();
    return res.json({ dispatches });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve dispatch records" });
  }
}

module.exports = {
  getTemplates,
  generateReport,
  listReports,
  getReportById,
  exportReport,
  getQuickStats,
  getAnalytics,
  submitVerification,
  approveVerification,
  getWorkflowStatus,
  exportCimsXml,
  getBranchMatrix,
  getAlerts,
  acknowledgeAlert,
  compareReports,
  dispatchReport,
  getDispatchLogs,
};
