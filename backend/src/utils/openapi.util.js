/**
 * OpenAPI 3.0.3 Specification for Next-Gen MISDESC & Open Banking Integration
 */

const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "Next-Gen MISDESC (Cheque Truncation System) Open Banking Core API",
    version: "3.0.0",
    description:
      "Statutory REST & Webhook APIs for Commercial Bank CBS integration (Finacle, TCS BaNCS, Oracle Flexcube). Enforces CBPR+ compliance, HMAC-SHA256 authenticated webhooks, and sub-500ms clearing pipelines.",
    contact: {
      name: "Reserve Bank of India & NPCI MISDESC Developer Hub",
      url: "https://rbi.org.in/MISDESC/developers",
    },
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local Development & Sandbox Gateway",
    },
    {
      url: "https://MISDESC.npci.org.in/api/v3",
      description: "National Production Clearing Gateway",
    },
  ],
  paths: {
    "/cheques": {
      get: {
        summary: "List Inward & Outward Cheque Clearances",
        description: "Retrieves clearing instruments filtered by bank, status, and settlement batch.",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, description: "Filter by clearing state (PRESENTED, CLEARED, REJECTED)" },
          { name: "batchId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Array of MISDESC-2010 cheque instruments with OCR and forensic flags." },
        },
      },
      post: {
        summary: "Present New Cheque Instrument (MISDESC-2010)",
        description: "Submits front/rear UV/IR TIFF/JPEG images and E-13B MICR line data for central switch clearing.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["chequeNumber", "accountNumber", "amount", "draweeIfsc"],
                properties: {
                  chequeNumber: { type: "string", example: "000456" },
                  accountNumber: { type: "string", example: "987654321012" },
                  amount: { type: "number", example: 150000 },
                  payeeName: { type: "string", example: "Larsen & Toubro Heavy Eng Ltd" },
                  draweeIfsc: { type: "string", example: "HDFC0005678" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Cheque accepted into clearing session. Emits CHEQUE_PRESENTED webhook." },
        },
      },
    },
    "/smart-cheques": {
      post: {
        summary: "Create Programmable Smart Cheque & CBS Micro-Lien",
        description: "Earmarks funds in drawer CBS escrow and configures conditional multi-milestone payouts.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["chequeId", "amount", "payeeName"],
                properties: {
                  chequeId: { type: "string", example: "chq-9948" },
                  amount: { type: "number", example: 250000 },
                  payeeName: { type: "string", example: "Apex Infrastructure Corp" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Smart contract registered with 0% bounce guarantee." },
        },
      },
    },
    "/liquidity/lsm/resolve-cycles": {
      post: {
        summary: "Trigger Autonomous Tarjan LSM Multilateral Cycle Elimination",
        description: "Executes directed graph SCC analysis and greedy bilateral offsetting to dissolve gridlocks with zero central bank reserve drain.",
        responses: {
          200: { description: "Discharged circular obligations with cryptographic audit certificate." },
        },
      },
    },
    "/swarm/adversarial/simulate": {
      post: {
        summary: "Run 4-Agent Swarm Adversarial Fraud Simulation",
        description: "Simulates adversarial scenarios (prepending digits, chemical washing, signature forgery) across 4 XAI dimensions.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  scenario: { type: "string", enum: ["PREPEND_DIGIT", "CHEMICAL_WASHING", "FORGED_SIGNATURE", "CLEAN_BASELINE"] },
                  originalAmount: { type: "number", example: 50000 },
                  alteredAmount: { type: "number", example: 150000 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "4-Agent consensus verdict with radar dimensions and XAI forensic reasoning." },
        },
      },
    },
    "/webhooks": {
      get: {
        summary: "List Core Banking Webhook Subscriptions",
        description: "Retrieves registered webhook delivery targets for commercial banks.",
        responses: {
          200: { description: "Array of CBS webhook endpoints with HMAC secrets and subscribed events." },
        },
      },
      post: {
        summary: "Register Core Banking Webhook Endpoint",
        description: "Registers an endpoint with HMAC-SHA256 signature validation for real-time CBS notifications.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["targetUrl", "bankCode"],
                properties: {
                  bankCode: { type: "string", example: "SBIN" },
                  systemName: { type: "string", example: "Finacle v11.2 Core Banking" },
                  targetUrl: { type: "string", example: "https://cbs-gw.sbi.co.in/api/v1/MISDESC/events" },
                  events: {
                    type: "array",
                    items: { type: "string" },
                    example: ["CHEQUE_PRESENTED", "LIEN_EARMARKED", "LSM_CYCLE_SETTLED"],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Webhook registered successfully." },
        },
      },
    },
    "/webhooks/test-dispatch": {
      post: {
        summary: "Dispatch Test Webhook Event with HMAC-SHA256 Signature",
        description: "Broadcasts a synthetic test event to verify core banking endpoint connectivity and signature verification.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  eventType: { type: "string", example: "CHEQUE_PRESENTED" },
                  payload: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Dispatched event with X-MISDESC-Signature header." },
        },
      },
    },
    "/stress/generate-batch": {
      post: {
        summary: "Generate Bulk Synthetic MISDESC-2010 Instruments",
        description: "Generates 100 to 1,000 synthetic cheques with authentic E-13B MICR bands and valid IFSCs for benchmark testing.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  count: { type: "number", example: 500 },
                  persistToDatabase: { type: "boolean", example: false },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Synthetic batch generated." },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      HmacSignature: {
        type: "apiKey",
        in: "header",
        name: "X-MISDESC-Signature",
        description: "HMAC-SHA256 hex digest of the canonical JSON request payload using the registered secret key.",
      },
    },
  },
};

module.exports = {
  OPENAPI_SPEC,
};
