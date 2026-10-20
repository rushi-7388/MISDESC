const { broadcastEvent } = require("../utils/sse.util");

/**
 * ==============================================================================
 * Geospatial Branch Radar & Armed Cash-in-Transit (CIT) Telemetry Engine
 * Tracks physical cheque batches & high-value negotiable instruments in transit
 * across South Gujarat & Mumbai clearing corridors.
 * ==============================================================================
 */

// Simulated GPS transit vehicles
const TRANSIT_VANS = [
  {
    vanId: "CIT-GJ05-SURAT-01",
    vehicleReg: "GJ-05-BX-4921",
    driverName: "Kishore Solanki",
    securityChief: "Havildar Ramesh Patel (Ex-Army Escort)",
    currentLocation: {
      lat: 21.1702,
      lng: 72.8311,
      name: "Athwa Gate Junction, Surat",
      heading: 45,
      speedKmh: 38,
    },
    route: "Athwa Lines Head Office → Ring Road Textile Hub → Surat Central Hub",
    status: "EN_ROUTE_SECURE",
    instrumentsCount: 42,
    totalCarriedValue: 18500000.0, // ₹1.85 Cr
    geofenceStatus: "INSIDE_SECURE_CORRIDOR",
    vaultTamperSensor: "LOCKED_INTACT",
    etaMinutes: 14,
    lastPing: new Date().toISOString(),
  },
  {
    vanId: "CIT-GJ05-SURAT-02",
    vehicleReg: "GJ-05-CZ-8812",
    driverName: "Dharmesh Modi",
    securityChief: "Bhavin Desai (Armed Escort)",
    currentLocation: {
      lat: 21.1959,
      lng: 72.8302,
      name: "Surat Railway Station Road",
      heading: 120,
      speedKmh: 24,
    },
    route: "Katargam Diamond Hub → Athwa Lines CPC",
    status: "EN_ROUTE_SECURE",
    instrumentsCount: 28,
    totalCarriedValue: 34200000.0, // ₹3.42 Cr
    geofenceStatus: "INSIDE_SECURE_CORRIDOR",
    vaultTamperSensor: "LOCKED_INTACT",
    etaMinutes: 22,
    lastPing: new Date().toISOString(),
  },
  {
    vanId: "CIT-MH01-MUMBAI-01",
    vehicleReg: "MH-01-EE-9041",
    driverName: "Sachin Kadam",
    securityChief: "Subedar Arvind Shinde",
    currentLocation: {
      lat: 19.076,
      lng: 72.8777,
      name: "Bandra Kurla Complex (BKC) Financial Hub",
      heading: 180,
      speedKmh: 0,
    },
    route: "Nariman Point Clearing Desk → BKC Interbank Exchange",
    status: "STATIONARY_DROP_BOX_UNLOADING",
    instrumentsCount: 65,
    totalCarriedValue: 62500000.0, // ₹6.25 Cr
    geofenceStatus: "SECURE_VAULT_DOCK",
    vaultTamperSensor: "LOCKED_INTACT",
    etaMinutes: 0,
    lastPing: new Date().toISOString(),
  },
  {
    vanId: "CIT-GJ01-AHMD-01",
    vehicleReg: "GJ-01-FA-1102",
    driverName: "Manish Shah",
    securityChief: "Prakash Vaghela (Armed Escort)",
    currentLocation: {
      lat: 23.0225,
      lng: 72.5714,
      name: "Ashram Road Reserve Bank Inter-State Hub",
      heading: 270,
      speedKmh: 52,
    },
    route: "Surat Central CPC → RBI Ahmedabad Clearing House",
    status: "INTERCITY_HIGHWAY_TRANSIT",
    instrumentsCount: 110,
    totalCarriedValue: 98000000.0, // ₹9.80 Cr
    geofenceStatus: "NATIONAL_HIGHWAY_ESCORT",
    vaultTamperSensor: "LOCKED_INTACT",
    etaMinutes: 65,
    lastPing: new Date().toISOString(),
  },
];

// Major clearing hubs & bank branches
const BRANCH_GEOLOCATIONS = [
  { id: "BR-01", name: "Athwa Lines Main Head Office", code: "SPCB-ATHWA", lat: 21.174, lng: 72.812, type: "HEAD_OFFICE_CPC", city: "Surat", activeClearanceVol: 184000000 },
  { id: "BR-02", name: "Ring Road Textile Market Branch", code: "SPCB-RINGRD", lat: 21.189, lng: 72.842, type: "COMMERCIAL_HUB", city: "Surat", activeClearanceVol: 92000000 },
  { id: "BR-03", name: "Katargam Diamond Bourse Branch", code: "SPCB-KATAR", lat: 21.218, lng: 72.833, type: "DIAMOND_EXPORT_HUB", city: "Surat", activeClearanceVol: 145000000 },
  { id: "BR-04", name: "Nariman Point Capital Branch", code: "SPCB-BOM-NP", lat: 18.925, lng: 72.822, type: "METRO_CLEARING_CENTRE", city: "Mumbai", activeClearanceVol: 210000000 },
  { id: "BR-05", name: "BKC Clearing Desk", code: "SPCB-BOM-BKC", lat: 19.066, lng: 72.868, type: "INTERBANK_EXCHANGE", city: "Mumbai", activeClearanceVol: 320000000 },
  { id: "BR-06", name: "Ashram Road Regulatory Hub", code: "SPCB-AHMD-AR", lat: 23.033, lng: 72.574, type: "RBI_SUB_STATION", city: "Ahmedabad", activeClearanceVol: 115000000 },
];

function getTransitTelemetry() {
  // Add realistic micro-variations to GPS and speed
  return TRANSIT_VANS.map((van) => {
    const latDelta = (Math.random() - 0.5) * 0.0008;
    const lngDelta = (Math.random() - 0.5) * 0.0008;
    return {
      ...van,
      currentLocation: {
        ...van.currentLocation,
        lat: Number((van.currentLocation.lat + latDelta).toFixed(6)),
        lng: Number((van.currentLocation.lng + lngDelta).toFixed(6)),
        speedKmh: Math.max(0, van.currentLocation.speedKmh + Math.floor((Math.random() - 0.5) * 4)),
      },
      lastPing: new Date().toISOString(),
    };
  });
}

function getBranchGeolocations() {
  return BRANCH_GEOLOCATIONS;
}

function triggerEmergencyLockdown(vanId) {
  const van = TRANSIT_VANS.find((v) => v.vanId === vanId);
  if (!van) throw new Error("Vehicle not found");

  van.status = "VAULT_EMERGENCY_LOCKDOWN_ENGAGED";
  van.vaultTamperSensor = "REMOTE_SOLENOID_LOCKED_POLICE_ALERTED";
  van.currentLocation.speedKmh = 0;

  broadcastEvent("CIT_SECURITY_ALERT", {
    vanId,
    vehicleReg: van.vehicleReg,
    alert: "Remote Solenoid Vault Lockdown Activated by Central Switch SRE",
    timestamp: new Date().toISOString(),
  });

  return van;
}

module.exports = {
  getTransitTelemetry,
  getBranchGeolocations,
  triggerEmergencyLockdown,
};
