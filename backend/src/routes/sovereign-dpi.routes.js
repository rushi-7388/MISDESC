const express = require("express");
const {
  analyzeMuleRisk,
  getHourlyClearingStatus,
  triggerHourlySettlement,
  generateNeslNotice,
  evaluateUliOverdraft,
  listBhashiniLanguages,
  processVoiceClearingIntent,
  listVostroAccounts,
  executeVostroSettlement,
} = require("../controllers/sovereign-dpi.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

// 1. MuleHunter.AI
router.post("/mulehunter/analyze", analyzeMuleRisk);

// 2. Hourly Continuous Clearing Engine
router.get("/continuous-clearing/status", getHourlyClearingStatus);
router.post("/continuous-clearing/hourly-batch", triggerHourlySettlement);

// 3. NeSL DDE & Section 138 Legal Suite
router.post("/nesl/generate-notice", generateNeslNotice);

// 4. ULI & Account Aggregator JIT-OD Overdraft Bridge
router.post("/uli/evaluate-overdraft", evaluateUliOverdraft);

// 5. Bhashini 22-Language Conversational Voice Engine
router.get("/bhashini/languages", listBhashiniLanguages);
router.post("/bhashini/voice-intent", processVoiceClearingIntent);

// 6. SRVA Rupee Vostro Bilateral DvP Bridge
router.get("/srva/accounts", listVostroAccounts);
router.post("/srva/settle", executeVostroSettlement);

module.exports = router;
