const crypto = require("crypto");
const { MisdescClient } = require("../sdk/misdesc-sdk");

// Active generated API keys ledger
const apiKeysLedger = [
  {
    keyId: "KEY_SOV_PROD_01",
    clientName: "Surat Peoples Co-Op Bank (Core Finacle Adapter)",
    apiKey: "sk_live_india_sovereign_snb_77291a0c49",
    tier: "SOVEREIGN_PARTICIPANT_UNLIMITED",
    rateLimitPerSec: 5000,
    created: "2026-01-15T00:00:00.000Z",
    status: "ACTIVE",
  },
  {
    keyId: "KEY_SOV_DEV_02",
    clientName: "Next-Gen Fintech Sandbox Merchant",
    apiKey: "sk_test_india_sovereign_sandbox_88201a",
    tier: "DEVELOPER_SANDBOX",
    rateLimitPerSec: 100,
    created: new Date().toISOString(),
    status: "ACTIVE",
  },
];

function generateApiKey(req, res) {
  const { clientName = "Developer Application", tier = "DEVELOPER_SANDBOX" } = req.body;
  const rawKey = `sk_${tier.toLowerCase().includes("prod") ? "live" : "test"}_india_sovereign_${crypto.randomBytes(12).toString("hex")}`;
  const keyRecord = {
    keyId: `KEY_${Date.now()}`,
    clientName,
    apiKey: rawKey,
    tier,
    rateLimitPerSec: tier === "SOVEREIGN_PARTICIPANT_UNLIMITED" ? 5000 : 250,
    created: new Date().toISOString(),
    status: "ACTIVE",
  };

  apiKeysLedger.push(keyRecord);
  return res.status(201).json(keyRecord);
}

function getApiKeys(req, res) {
  return res.json({
    keys: apiKeysLedger,
    totalKeys: apiKeysLedger.length,
    documentationUrl: "https://docs.misdesc-india.gov.in/sdk/quickstart",
  });
}

function getCodeExamples(req, res) {
  const examples = {
    javascript: `import { MisdescClient } from '@misdesc/sdk';

// 1. Initialize Sovereign Client
const misdesc = new MisdescClient({ apiKey: 'sk_live_india_sovereign_...' });

// 2. Transmit Offline Acoustic Voucher (18.5 kHz Ultrasonic FSK)
const voucher = await misdesc.acoustic.createVoucher({
  amount: 1500.00,
  payerDeviceId: 'DEV-IN-442918',
  recipientDeviceId: 'DEV-IN-889101',
  memo: 'Mandi Produce Offline Settlement'
});
console.log('PQC Lattice Signature:', voucher.pqcSignature);

// 3. Execute Bilateral De-Dollarized DvP (INR -> AED in 1.2s)
const settlement = await misdesc.crossBorder.settleDvp({
  corridor: 'INR_TO_AED',
  inrAmount: 500000,
  beneficiaryName: 'Emirates Sovereign Logistics'
});
console.log('ISO 20022 UETR:', settlement.uetr);`,

    python: `from misdesc import MisdescClient

# Initialize Client
client = MisdescClient(api_key="sk_live_india_sovereign_...")

# Deepfake Voice-Clone Liveness Interception
liveness = client.forensics.verify_voice_liveness(
    caller_phone="+919825011223",
    sample_length_sec=3.5,
    is_simulated_deepfake=False
)
print("Biological Vocal Tract Verified:", liveness["livenessStatus"])

# Programmable e-Rupee Auto-Split (18% GST + 1% TDS)
split = client.cbdc.execute_tax_split(
    gross_amount=100000,
    vendor_name="Gujarat Steel Corp"
)
print("Government GSTN Escrow:", split["taxSovereignRouting"]["gstnTreasury"]["totalGst"])`,

    curl: `# 1. Ultrasonic Acoustic Offline Voucher
curl -X POST http://localhost:5000/api/acoustic/voucher/create \\
  -H "Content-Type: application/json" \\
  -H "X-Misdesc-Api-Key: sk_live_india_sovereign_..." \\
  -d '{"amount": 500.0, "payerDeviceId": "DEV-IN-442918"}'

# 2. Tarjan 100ms Autonomous Liquidity Swarm
curl -X POST http://localhost:5000/api/liquidity-swarm/resolve \\
  -H "Content-Type: application/json" \\
  -H "X-Misdesc-Api-Key: sk_live_india_sovereign_..."`,
  };

  return res.json(examples);
}

module.exports = {
  generateApiKey,
  getApiKeys,
  getCodeExamples,
};
