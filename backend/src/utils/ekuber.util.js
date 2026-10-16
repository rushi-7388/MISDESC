const crypto = require("crypto");

/**
 * Generates an official RBI e-Kuber Central Bank Transaction Reference
 * Format: EKUBER/MISDESC3/YYYYMMDD/<seq>
 */
function generateEkuberTransactionRef() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const seq = Math.floor(100000 + Math.random() * 900000);
  return `EKUBER/MISDESC3/${dateStr}/${seq}`;
}

/**
 * Generates an official Reserve Bank of India RTGS Central Bank UTR
 * Format: RBIR5 + YYYYMMDD + 8 numeric digits (22 characters)
 */
function generateRbiUtr() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `RBIR5${dateStr}${randDigits}`;
}

/**
 * Simulates real-time interbank central bank settlement across RBI current accounts
 */
function executeContinuousRealization({ cheque, presentingBank, draweeBank }) {
  const ekuberRef = generateEkuberTransactionRef();
  const utr = generateRbiUtr();
  const settledAt = new Date();

  // Central Bank current account mappings
  const draweeAccount = `RBI-${draweeBank?.code || "DB"}-CA-${Math.floor(100000 + Math.random() * 900000)}`;
  const presentingAccount = `RBI-${presentingBank?.code || "PB"}-CA-${Math.floor(100000 + Math.random() * 900000)}`;

  const ledgerDebit = {
    account: draweeAccount,
    bank: draweeBank?.name || "Drawee Bank",
    ifsc: draweeBank?.ifsc,
    type: "DEBIT",
    amount: Number(cheque.amount),
    currency: "INR",
  };

  const ledgerCredit = {
    account: presentingAccount,
    bank: presentingBank?.name || "Presenting Bank",
    ifsc: presentingBank?.ifsc,
    type: "CREDIT",
    amount: Number(cheque.amount),
    currency: "INR",
  };

  const beneficiaryCredit = {
    status: "CREDITED_INSTANT",
    timestamp: settledAt.toISOString(),
    fastPathMethod: "FAST_PATH_RTGS_IMPS_BRIDGE",
    payeeName: cheque.payeeName,
    creditedAmount: Number(cheque.amount),
  };

  return {
    ekuberRef,
    utr,
    settledAt,
    settlementMode: "CONTINUOUS_T0",
    status: "EKUBER_SETTLED",
    mandate: "RBI Continuous Clearing & On-Realisation Directive 2024-25",
    accounting: {
      debit: ledgerDebit,
      credit: ledgerCredit,
    },
    beneficiaryCredit,
  };
}

/**
 * Generates official pacs.009.001.08 Financial Institution Direct Settlement XML
 */
function generatePacs009Xml({ settlementRef, utr, cheque, presentingBank, draweeBank, settledAt }) {
  const timestamp = (settledAt || new Date()).toISOString();
  const msgId = `MSG-EKUBER-${Date.now()}`;
  const amount = Number(cheque.amount).toFixed(2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.009.001.08"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FICdtTrf>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys>
          <Prtry>RBI-EKUBER-MISDESC-T0</Prtry>
        </ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>${settlementRef}</EndToEndId>
        <TxId>${utr}</TxId>
        <UETR>${crypto.randomUUID()}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="INR">${amount}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>${timestamp.slice(0, 10)}</IntrBkSttlmDt>
      <Dbtr>
        <FinInstnId>
          <BICFI>${draweeBank.code}INBBXXX</BICFI>
          <ClrSysMmbId>
            <MmbId>${draweeBank.ifsc}</MmbId>
          </ClrSysMmbId>
          <Nm>${draweeBank.name}</Nm>
        </FinInstnId>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <Othr>
            <Id>RBI-${draweeBank.code}-CA-SETTL</Id>
          </Othr>
        </Id>
      </DbtrAcct>
      <Cdtr>
        <FinInstnId>
          <BICFI>${presentingBank.code}INBBXXX</BICFI>
          <ClrSysMmbId>
            <MmbId>${presentingBank.ifsc}</MmbId>
          </ClrSysMmbId>
          <Nm>${presentingBank.name}</Nm>
        </FinInstnId>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <Othr>
            <Id>RBI-${presentingBank.code}-CA-SETTL</Id>
          </Othr>
        </Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>RBI Continuous Clearing On-Realisation Settlement for Cheque #${cheque.chequeNumber} Payee: ${cheque.payeeName}</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FICdtTrf>
</Document>`;
}

module.exports = {
  generateEkuberTransactionRef,
  generateRbiUtr,
  executeContinuousRealization,
  generatePacs009Xml,
};
