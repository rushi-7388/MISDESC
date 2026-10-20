const express = require("express");
const router = express.Router();
const swarmCtrl = require("../controllers/liquidity-swarm.controller");

router.get("/state", swarmCtrl.getState);
router.post("/resolve", swarmCtrl.resolve);
router.post("/auto-repo", swarmCtrl.autoRepo);

module.exports = router;
