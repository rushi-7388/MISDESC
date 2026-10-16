const express = require("express");
const router = express.Router();
const forensicController = require("../controllers/forensic.controller");

router.post("/analyze-signature", forensicController.analyzeSignature);
router.post("/uv-spectral", forensicController.analyzeUvSpectral);
router.post("/payee-integrity", forensicController.analyzePayeeIntegrity);
router.get("/cheque/:id", forensicController.getChequeDossier);

module.exports = router;
