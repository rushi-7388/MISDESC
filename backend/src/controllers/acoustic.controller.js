const acousticService = require("../services/acoustic-mesh.service");

function getStatus(req, res) {
  try {
    const status = acousticService.getAcousticMeshStatus();
    return res.json(status);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function createVoucher(req, res) {
  try {
    const voucher = acousticService.createOfflineVoucher(req.body);
    return res.status(201).json(voucher);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

function verifyVoucher(req, res) {
  try {
    const result = acousticService.verifyAcousticVoucher(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

function syncMesh(req, res) {
  try {
    const result = acousticService.synchronizeMeshVouchers();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getStatus,
  createVoucher,
  verifyVoucher,
  syncMesh,
};
