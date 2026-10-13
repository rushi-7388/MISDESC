const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
  getTemplates,
  generateReport,
  listReports,
  getReportById,
  exportReport,
  getQuickStats,
} = require("../controllers/report.controller");

const router = express.Router();

router.use(authenticate);

router.get("/templates", getTemplates);
router.get("/kpis", getQuickStats);
router.get("/", listReports);
router.post("/generate", generateReport);
router.get("/:id", getReportById);
router.get("/:id/export", exportReport);

module.exports = router;
