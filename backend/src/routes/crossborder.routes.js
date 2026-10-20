const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
  getFxRates,
  convertFx,
  screenSanctions,
  exportPacs009,
  executeDvp,
} = require("../controllers/crossborder.controller");

const router = express.Router();

router.use(authenticate);

// Cross-Border Multi-Currency Endpoints
router.get("/fx-rates", getFxRates);
router.post("/convert", convertFx);
router.post("/screen", screenSanctions);
router.post("/iso20022/cbpr-pacs009", exportPacs009);
router.post("/dvp-settle", executeDvp);

module.exports = router;

