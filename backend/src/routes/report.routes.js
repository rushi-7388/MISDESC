const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
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
} = require("../controllers/report.controller");

const router = express.Router();

router.use(authenticate);

// Global Reporting Analytics, Matrix & Alerts
router.get("/templates", getTemplates);
router.get("/kpis", getQuickStats);
router.get("/analytics", getAnalytics);
router.get("/branch-matrix", getBranchMatrix);
router.get("/alerts", getAlerts);
router.post("/alerts/:id/acknowledge", acknowledgeAlert);
router.post("/compare", compareReports);
router.get("/dispatches", getDispatchLogs);

// Standard Report Operations
router.get("/", listReports);
router.post("/generate", generateReport);
router.get("/:id", getReportById);
router.get("/:id/export", exportReport);
router.get("/:id/cims-xml", exportCimsXml);

// Maker-Checker & Dispatch Operations
router.get("/:id/workflow", getWorkflowStatus);
router.post("/:id/submit-verification", submitVerification);
router.post("/:id/verify-approve", approveVerification);
router.post("/:id/dispatch", dispatchReport);

// RBI CIMS & Statutory Section 138 Compliance Hub
const cimsController = require("../controllers/cims.controller");
router.post("/cims/generate", cimsController.generateCimsReturn);
router.post("/memo/section138", cimsController.generateSection138Memo);
router.get("/compliance/return-analytics", cimsController.getReturnAnalytics);
router.get("/compliance/escalations", cimsController.listComplianceEscalations);
router.post("/compliance/escalations/:id/action", cimsController.actionComplianceEscalation);

module.exports = router;
