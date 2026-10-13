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

module.exports = {
  getTemplates,
  generateReport,
  listReports,
  getReportById,
  exportReport,
  getQuickStats,
};
