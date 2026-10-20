/**
 * ==============================================================================
 * @misdesc/sdk — Sovereign Financial Infrastructure Developer SDK
 * ==============================================================================
 * 
 * Allows any Indian startup, bank, NBFC, or enterprise developer to embed:
 * 1. Instant Cheque Truncation & Positive Pay Pre-Verification
 * 2. Ultrasonic Acoustic Zero-Internet Offline Pay
 * 3. Deepfake Voice Liveness & 365nm Optical Forensics
 * 4. Programmable e-Rupee (CBDC) & GSTN/TDS Auto-Splitting
 * 5. De-Dollarized Bilateral Cross-Border Settlement (INR-AED / INR-SGD / INR-EUR)
 * 
 * Usage in 3 lines of code:
 * -------------------------------------------------------------
 * const { MisdescClient } = require("@misdesc/sdk");
 * const misdesc = new MisdescClient({ apiKey: "sk_live_india_sovereign_..." });
 * const result = await misdesc.cheques.clear({ chequeNumber: "000101", amount: 250000 });
 * -------------------------------------------------------------
 */

class MisdescClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || "sk_live_test_sovereign_key";
    this.baseUrl = (options.baseUrl || "http://localhost:5000/api").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs || 10000;

    // Sub-namespaces
    this.cheques = {
      present: (payload) => this._request("POST", "/cheques", payload),
      get: (id) => this._request("GET", `/cheques/${id}`),
      clear: (payload) => this._request("POST", "/clearing/present", payload),
    };

    this.acoustic = {
      createVoucher: (payload) => this._request("POST", "/acoustic/voucher/create", payload),
      verifyVoucher: (payload) => this._request("POST", "/acoustic/voucher/verify", payload),
      syncMesh: () => this._request("POST", "/acoustic/mesh/sync", {}),
      getStatus: () => this._request("GET", "/acoustic/status"),
    };

    this.forensics = {
      verifyVoiceLiveness: (payload) => this._request("POST", "/forensics/voice-liveness", payload),
      verifyMicroKerning: (payload) => this._request("POST", "/forensics/micro-kerning", payload),
      verifySignature: (payload) => this._request("POST", "/forensics/analyze-signature", payload),
      getDossier: (chequeId) => this._request("GET", `/forensics/cheque/${chequeId}`),
    };

    this.cbdc = {
      executeTaxSplit: (payload) => this._request("POST", "/smart-cheques/tax-split", payload),
      verifyGeofence: (payload) => this._request("POST", "/smart-cheques/geofence-verify", payload),
      settle: (payload) => this._request("POST", "/smart-cheques/cbdc/settle", payload),
    };

    this.crossBorder = {
      getFxRates: () => this._request("GET", "/crossborder/fx-rates"),
      settleDvp: (payload) => this._request("POST", "/crossborder/dvp-settle", payload),
      screenSanctions: (payload) => this._request("POST", "/crossborder/screen", payload),
    };

    this.liquiditySwarm = {
      getState: () => this._request("GET", "/liquidity-swarm/state"),
      resolveGridlock: () => this._request("POST", "/liquidity-swarm/resolve", {}),
      executeAutoRepo: (payload) => this._request("POST", "/liquidity-swarm/auto-repo", payload),
    };
  }

  async _request(method, endpoint, body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "X-Misdesc-Api-Key": this.apiKey,
      "X-Client-Agent": "Misdesc-Sovereign-SDK/1.0.0-Node",
    };

    const options = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    try {
      // Cross-platform fetch (Node 18+ native global fetch)
      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Request failed`);
      }
      return data;
    } catch (err) {
      throw new Error(`[MISDESC SDK ERROR] ${err.message}`);
    }
  }
}

module.exports = { MisdescClient };
