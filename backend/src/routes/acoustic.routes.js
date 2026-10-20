const express = require("express");
const router = express.Router();
const acousticCtrl = require("../controllers/acoustic.controller");

router.get("/status", acousticCtrl.getStatus);
router.post("/voucher/create", acousticCtrl.createVoucher);
router.post("/voucher/verify", acousticCtrl.verifyVoucher);
router.post("/mesh/sync", acousticCtrl.syncMesh);

module.exports = router;
