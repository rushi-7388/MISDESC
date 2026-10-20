/**
 * ==============================================================================
 * Sovereign DPI & RBI/NPCI Next-Gen FinTech Controller
 * ==============================================================================
 */

const muleHunterService = require("../services/mulehunter.service");
const continuousClearingService = require("../services/continuous-clearing-engine.service");
const neslLegalService = require("../services/nesl-legal.service");
const uliOverdraftService = require("../services/uli-overdraft.service");
const bhashiniVoiceService = require("../services/bhashini-voice.service");
const srvaVostroService = require("../services/srva-vostro.service");
const { broadcastEvent } = require("../utils/sse.util");

// 1. MuleHunter.AI
async function analyzeMuleRisk(req, res, next) {
  try {
    const analysis = muleHunterService.analyzeBeneficiaryMuleRisk(req.body);
    if (analysis.muleHoldRecommended) {
      broadcastEvent("MULE_HOLD_ADVISORY", analysis);
    }
    return res.json(analysis);
  } catch (err) {
    next(err);
  }
}

// 2. Hourly Continuous Clearing Engine
async function getHourlyClearingStatus(req, res, next) {
  try {
    const status = continuousClearingService.getContinuousClearingOperationalStatus();
    return res.json(status);
  } catch (err) {
    next(err);
  }
}

async function triggerHourlySettlement(req, res, next) {
  try {
    const settlement = continuousClearingService.executeHourlySettlementBatch(req.body);
    broadcastEvent("HOURLY_BATCH_SETTLED", settlement);
    return res.json(settlement);
  } catch (err) {
    next(err);
  }
}

// 3. NeSL DDE & Section 138 Legal Suite
async function generateNeslNotice(req, res, next) {
  try {
    const notice = neslLegalService.generateSection138LegalNotice(req.body);
    broadcastEvent("NESL_NOTICE_ISSUED", {
      noticeId: notice.noticeId,
      eStampNumber: notice.eStampNumber,
      chequeNumber: notice.chequeNumber,
    });
    return res.json(notice);
  } catch (err) {
    next(err);
  }
}

// 4. ULI & Account Aggregator JIT-OD Overdraft Bridge
async function evaluateUliOverdraft(req, res, next) {
  try {
    const result = uliOverdraftService.evaluateAndDisburseJitOverdraft(req.body);
    if (result.eligibleForJitOd) {
      broadcastEvent("ULI_OVERDRAFT_DISBURSED", result);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

// 5. Bhashini 22-Language Conversational Voice Engine
async function listBhashiniLanguages(req, res) {
  return res.json(bhashiniVoiceService.SUPPORTED_INDIAN_LANGUAGES);
}

async function processVoiceClearingIntent(req, res, next) {
  try {
    const result = bhashiniVoiceService.processBhashiniVoiceIntent(req.body);
    broadcastEvent("BHASHINI_VOICE_AUTHENTICATED", result);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

// 6. SRVA Rupee Vostro Bilateral DvP Bridge
async function listVostroAccounts(req, res) {
  return res.json(srvaVostroService.VOSTRO_ACCOUNTS);
}

async function executeVostroSettlement(req, res, next) {
  try {
    const result = srvaVostroService.settleViaVostroAccount(req.body);
    if (result.success) {
      broadcastEvent("SRVA_VOSTRO_SETTLED", result);
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  analyzeMuleRisk,
  getHourlyClearingStatus,
  triggerHourlySettlement,
  generateNeslNotice,
  evaluateUliOverdraft,
  listBhashiniLanguages,
  processVoiceClearingIntent,
  listVostroAccounts,
  executeVostroSettlement,
};
