const crossService = require("../services/crossborder.service");

async function getFxRates(req, res, next) {
  try {
    return res.json({
      baseCurrency: "INR",
      rates: crossService.FX_RATES,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

async function convertFx(req, res, next) {
  try {
    const { amount, currency } = req.body;
    const result = crossService.convertCurrency(amount, currency);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function screenSanctions(req, res, next) {
  try {
    const result = crossService.screenSanctions(req.body);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function exportPacs009(req, res, next) {
  try {
    const { cheque, fxDetails } = req.body;
    const xml = crossService.generatePacs009Xml(cheque || { chequeNumber: "000101" }, fxDetails);
    res.set("Content-Type", "application/xml");
    return res.send(xml);
  } catch (err) {
    next(err);
  }
}

async function executeDvp(req, res, next) {
  try {
    const result = crossService.executeBilateralDvpSettlement(req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFxRates,
  convertFx,
  screenSanctions,
  exportPacs009,
  executeDvp,
};

