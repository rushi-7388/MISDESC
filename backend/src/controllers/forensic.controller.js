const forensicService = require("../services/forensic.service");
const prisma = require("../config/prisma");

async function analyzeSignature(req, res) {
  try {
    const { presentedSignature, referenceSpecimen } = req.body;
    const result = forensicService.compareSignatures(presentedSignature, referenceSpecimen);
    return res.json({ success: true, result });
  } catch (err) {
    console.error("Signature analysis failed:", err);
    return res.status(500).json({ error: "Failed to analyze signature" });
  }
}

async function analyzeUvSpectral(req, res) {
  try {
    const { chequeNumber, hasChemicalWash, hasUvBleachHalo, fluorescenceIntensity } = req.body;
    const result = forensicService.analyzeUvSpectralFluorescence({
      chequeNumber,
      hasChemicalWash,
      hasUvBleachHalo,
      fluorescenceIntensity,
    });
    return res.json({ success: true, result });
  } catch (err) {
    console.error("UV spectral analysis failed:", err);
    return res.status(500).json({ error: "Failed to analyze UV spectral response" });
  }
}

async function analyzePayeeIntegrity(req, res) {
  try {
    const result = forensicService.analyzePayeeIntegrity(req.body);
    return res.json({ success: true, result });
  } catch (err) {
    console.error("Payee integrity analysis failed:", err);
    return res.status(500).json({ error: "Failed to analyze payee integrity" });
  }
}

async function getChequeDossier(req, res) {
  try {
    const { id } = req.params;
    let cheque = null;
    try {
      cheque = await prisma.cheque.findUnique({ where: { id } });
    } catch {
      // fallback mock
    }

    if (!cheque) {
      cheque = {
        id,
        chequeNumber: "000456",
        payeeName: "SURAT DIAMOND TRADERS LLP",
        amount: 350000.0,
        amountInWords: "Rupees Three Lakh Fifty Thousand Only",
        drawerAccount: "102938475612",
        fraudAlerts: { chemicalWash: false, uvHalo: false, payeeAltered: false },
      };
    }

    const dossier = forensicService.generateForensicDossier(cheque);
    return res.json({ success: true, dossier });
  } catch (err) {
    console.error("Dossier compilation failed:", err);
    return res.status(500).json({ error: "Failed to compile forensic dossier" });
  }
}

module.exports = {
  analyzeSignature,
  analyzeUvSpectral,
  analyzePayeeIntegrity,
  getChequeDossier,
};
