const smartService = require("../services/smartcheque.service");

async function earmarkLien(req, res, next) {
  try {
    const { chequeId, amount, drawerAccount } = req.body;
    const lien = smartService.earmarkMicroLien(chequeId, amount, drawerAccount);
    return res.status(201).json({
      message: "Cryptographic micro-lien successfully earmarked on drawer funds (0% bounce risk guarantee)",
      lien,
    });
  } catch (err) {
    next(err);
  }
}

async function getContract(req, res, next) {
  try {
    const { chequeId } = req.params;
    let contract = await smartService.fetchSmartContractFromDb(chequeId);
    if (!contract) contract = smartService.getSmartContract(chequeId);

    let lien = await smartService.fetchMicroLienFromDb(chequeId);
    if (!lien) lien = smartService.getMicroLien(chequeId);

    return res.json({ contract, lien });
  } catch (err) {
    next(err);
  }
}

async function releaseMilestone(req, res, next) {
  try {
    const { chequeId } = req.params;
    const { stepId } = req.body;
    const contract = smartService.releaseMilestone(chequeId, stepId);
    return res.json({
      message: `Escrow milestone ${stepId} released successfully`,
      contract,
    });
  } catch (err) {
    next(err);
  }
}

async function settleCbdc(req, res, next) {
  try {
    const { chequeId, amount, walletId } = req.body;
    const receipt = smartService.settleWithCbdc(chequeId, amount, walletId);
    return res.status(201).json({
      message: "Cheque settled atomically with Reserve Bank Digital Rupee (e₹)",
      receipt,
    });
  } catch (err) {
    next(err);
  }
}

async function handleIotTriggerWebhook(req, res, next) {
  try {
    const result = await smartService.processIotWebhookTrigger(req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function executeTaxSplit(req, res, next) {
  try {
    const result = smartService.executeProgrammableCbdcTaxSplit(req.body);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function verifyGeofence(req, res, next) {
  try {
    const result = smartService.verifyGeofenceEscrowRelease(req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  earmarkLien,
  getContract,
  releaseMilestone,
  settleCbdc,
  handleIotTriggerWebhook,
  executeTaxSplit,
  verifyGeofence,
};


