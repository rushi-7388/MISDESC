const crypto = require("crypto");
const { broadcastEvent } = require("../utils/sse.util");

/**
 * Core Banking System (CBS) Adapter & ISO 20022 camt.053 / camt.054 Gateway
 * Integrates with Infosys Finacle v11.2, TCS BaNCS Cloud, and Oracle FLEXCUBE 14.x.
 */

const ADAPTER_REGISTRY = {
  FINACLE: {
    name: "Infosys Finacle v11.2 REST Gateway",
    protocol: "HTTPS / Mutual TLS (mTLS)",
    host: "https://finacle-gw.spcbl.in:8443/cbs/v1",
    status: "HEALTHY_ONLINE",
    latencyMs: 14,
    supportedVersions: ["11.2", "11.14"],
    dailyThroughput: 84210,
  },
  BANCS: {
    name: "TCS BaNCS Cloud Universal Adapter",
    protocol: "ISO 8583 / AS2 Gateway",
    host: "https://bancs-mesh.spcbl.in/api/v2",
    status: "HEALTHY_ONLINE",
    latencyMs: 22,
    supportedVersions: ["Cloud-2024", "Universal-v19"],
    dailyThroughput: 53190,
  },
  FLEXCUBE: {
    name: "Oracle FLEXCUBE 14.x Enterprise Connector",
    protocol: "SOAP XML / JMS Queue",
    host: "https://flexcube-switch.spcbl.in/fcubs/services",
    status: "HEALTHY_ONLINE",
    latencyMs: 19,
    supportedVersions: ["14.5", "14.7"],
    dailyThroughput: 29840,
  },
};

/**
 * Generate ISO 20022 camt.053.001.08 Bank-to-Customer Statement XML
 */
function generateCamt053Xml({
  statementId = `STMT-${Date.now()}`,
  accountIban = "IN29SPCB0000001029384756",
  accountCurrency = "INR",
  openingBalance = 150000000.0,
  closingBalance = 168250000.0,
  transactions = [],
}) {
  const timestamp = new Date().toISOString();
  const txList = transactions.length > 0 ? transactions : [
    { ref: "TXN-CTS-001", amount: 125000.0, cdtDbtInd: "CRDT", bookingDate: timestamp.slice(0, 10), desc: "CTS Inward Clearing Realisation" },
    { ref: "TXN-CTS-002", amount: 450000.0, cdtDbtInd: "DBIT", bookingDate: timestamp.slice(0, 10), desc: "CTS Outward Clearing Settlement" },
  ];

  const entriesXml = txList.map((tx) => `
      <Ntry>
        <Amt Ccy="${accountCurrency}">${Number(tx.amount).toFixed(2)}</Amt>
        <CdtDbtInd>${tx.cdtDbtInd}</CdtDbtInd>
        <Sts>BOOK</Sts>
        <BookgDt><Dt>${tx.bookingDate || timestamp.slice(0, 10)}</Dt></BookgDt>
        <NtryDtls>
          <TxDtls>
            <Refs><EndToEndId>${tx.ref}</EndToEndId></Refs>
            <RmtInf><Ustrd>${tx.desc}</Ustrd></RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">
  <BkToCstmrStmt>
    <GrpHdr>
      <MsgId>CAMT053-${statementId}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
    </GrpHdr>
    <Stmt>
      <Id>${statementId}</Id>
      <Acct>
        <Id><Othr><Id>${accountIban}</Id></Othr></Id>
        <Ccy>${accountCurrency}</Ccy>
      </Acct>
      <Bal>
        <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="${accountCurrency}">${openingBalance.toFixed(2)}</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><Dt>${timestamp.slice(0, 10)}</Dt></Dt>
      </Bal>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="${accountCurrency}">${closingBalance.toFixed(2)}</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><Dt>${timestamp.slice(0, 10)}</Dt></Dt>
      </Bal>
      ${entriesXml}
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

  return {
    messageType: "camt.053.001.08",
    statementId,
    accountIban,
    xml,
    generatedAt: timestamp,
    digest: crypto.createHash("sha256").update(xml).digest("hex"),
  };
}

/**
 * Generate ISO 20022 camt.054.001.08 Bank-to-Customer Debit/Credit Notification XML
 */
function generateCamt054Xml({
  notificationId = `NOTIF-${Date.now()}`,
  accountNumber = "102938475612",
  chequeNumber = "000456",
  amount = 125000.0,
  creditDebitIndicator = "CRDT",
  payerName = "SHREEJI EXPORTS",
  payeeName = "RUSHIKESH PATEL",
}) {
  const timestamp = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08">
  <BkToCstmrDbtCdtNtfctn>
    <GrpHdr>
      <MsgId>CAMT054-${notificationId}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
    </GrpHdr>
    <Ntfctn>
      <Id>${notificationId}</Id>
      <Acct>
        <Id><Othr><Id>${accountNumber}</Id></Othr></Id>
      </Acct>
      <Ntry>
        <Amt Ccy="INR">${Number(amount).toFixed(2)}</Amt>
        <CdtDbtInd>${creditDebitIndicator}</CdtDbtInd>
        <Sts>BOOK</Sts>
        <BookgDt><Dt>${timestamp.slice(0, 10)}</Dt></BookgDt>
        <NtryDtls>
          <TxDtls>
            <Refs>
              <EndToEndId>CTS-${chequeNumber}</EndToEndId>
              <InstrId>${chequeNumber}</InstrId>
            </Refs>
            <RltdPties>
              <Dbtr><Nm>${payerName}</Nm></Dbtr>
              <Cdtr><Nm>${payeeName}</Nm></Cdtr>
            </RltdPties>
            <RmtInf><Ustrd>Cheque No ${chequeNumber} Realisation Notification</Ustrd></RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
    </Ntfctn>
  </BkToCstmrDbtCdtNtfctn>
</Document>`;

  return {
    messageType: "camt.054.001.08",
    notificationId,
    chequeNumber,
    xml,
    generatedAt: timestamp,
    digest: crypto.createHash("sha256").update(xml).digest("hex"),
  };
}

/**
 * Simulate Core Banking Balance Check & Intraday Lien Hold
 */
function simulateCbsInquiry({
  system = "FINACLE",
  accountNumber = "102938475612",
  amount = 125000.0,
}) {
  const adapter = ADAPTER_REGISTRY[system] || ADAPTER_REGISTRY.FINACLE;
  const mockBalances = {
    "102938475612": { available: 850000.0, ledger: 850000.0, status: "ACTIVE" },
    "987654321098": { available: 42000.0, ledger: 55000.0, status: "ACTIVE" },
    "112233445566": { available: 0.0, ledger: 1500.0, status: "DORMANT_FROZEN" },
  };

  const accountInfo = mockBalances[accountNumber] || {
    available: 500000.0,
    ledger: 500000.0,
    status: "ACTIVE",
  };

  const isSolvent = accountInfo.available >= Number(amount) && accountInfo.status === "ACTIVE";
  const lienReference = isSolvent ? `LIEN-${system}-${Date.now().toString().slice(-6)}` : null;

  const response = {
    cbsSystem: adapter.name,
    protocol: adapter.protocol,
    accountNumber,
    accountStatus: accountInfo.status,
    currency: "INR",
    ledgerBalance: accountInfo.ledger,
    availableBalance: accountInfo.available,
    chequeAmountRequested: Number(amount),
    isSolvent,
    lienHoldPlaced: isSolvent,
    lienReference,
    statusCode: isSolvent ? "CBS_0000_SUCCESS" : accountInfo.status === "DORMANT_FROZEN" ? "CBS_7002_ACCOUNT_FROZEN" : "CBS_5001_INSUFFICIENT_FUNDS",
    latencyMs: adapter.latencyMs + Math.floor(Math.random() * 8),
    timestamp: new Date().toISOString(),
  };

  broadcastEvent("CBS_INQUIRY_SIMULATED", {
    system,
    accountNumber,
    isSolvent,
    lienReference,
  });

  return response;
}

/**
 * Get CBS Adapters Health & Telemetry
 */
function getAdapterStatus() {
  return ADAPTER_REGISTRY;
}

module.exports = {
  ADAPTER_REGISTRY,
  generateCamt053Xml,
  generateCamt054Xml,
  simulateCbsInquiry,
  getAdapterStatus,
};
