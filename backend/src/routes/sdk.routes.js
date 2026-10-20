const express = require("express");
const router = express.Router();
const sdkCtrl = require("../controllers/sdk.controller");

router.get("/keys", sdkCtrl.getApiKeys);
router.post("/keys/generate", sdkCtrl.generateApiKey);
router.get("/examples", sdkCtrl.getCodeExamples);

module.exports = router;
