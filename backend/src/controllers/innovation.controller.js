const voiceService = require("../services/voice.service");
const transitService = require("../services/telemetry-transit.service");
const selfHealingService = require("../services/selfhealing.service");

// 1. Voice Banking
async function processVoice(req, res, next) {
  try {
    const { query, language } = req.body;
    if (!query) return res.status(400).json({ error: "Voice query text is required" });
    const result = await voiceService.processVoiceQuery(query, language);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

// 2. Geospatial CIT Radar
function getTransitTelemetry(req, res) {
  const telemetry = transitService.getTransitTelemetry();
  const branches = transitService.getBranchGeolocations();
  return res.json({ telemetry, branches });
}

function triggerEmergencyLockdown(req, res, next) {
  try {
    const { vanId } = req.params;
    const van = transitService.triggerEmergencyLockdown(vanId);
    return res.json({ message: `Emergency vault lockdown engaged on vehicle ${van.vehicleReg}`, van });
  } catch (err) {
    next(err);
  }
}

// 3. Self-Healing AIOps
function getSelfHealingStatus(req, res) {
  return res.json(selfHealingService.getSystemHealthState());
}

function simulateChaos(req, res) {
  const { incidentType } = req.body;
  const incident = selfHealingService.simulateChaosIncident(incidentType);
  return res.status(201).json({ message: "Simulated infrastructure incident injected", incident });
}

async function executePlaybook(req, res, next) {
  try {
    const { incidentId, playbookKey } = req.body;
    const result = await selfHealingService.executeRemediationPlaybook(incidentId, playbookKey);
    return res.json({ message: "Autonomous remediation playbook executed successfully", result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  processVoice,
  getTransitTelemetry,
  triggerEmergencyLockdown,
  getSelfHealingStatus,
  simulateChaos,
  executePlaybook,
};
